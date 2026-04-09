"""
EMC Screenshot Parser — extracts spectrum traces from R&S EMC32 screenshots
and similar spectrum analyzer displays.

Strategy:
1. OCR the header area to extract metadata (RBW, VBW, span, ref level, units)
2. Detect the plot area boundaries using grid lines
3. For each trace color, extract pixel columns and convert to (freq, amplitude)
4. Return structured data compatible with _process_series output format
"""
from __future__ import annotations

import re
import io
import logging
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)

# ─── Color definitions for R&S EMC32 traces ─────────────────────────
# Each entry: (name, BGR_lower, BGR_upper, priority)
# Colors tuned for R&S EMC32 default color scheme
TRACE_COLORS = [
    {
        "name": "PkMax",
        "label": "2Pk Max",
        "bgr_lower": (180, 0, 0),
        "bgr_upper": (255, 80, 80),
        "detector": "pk",
    },
    {
        "name": "AvMax",
        "label": "3Av Max",
        "bgr_lower": (0, 100, 0),
        "bgr_upper": (80, 255, 80),
        "detector": "av",
    },
    {
        "name": "Clrw",
        "label": "1Sa Clrw",
        "bgr_lower": (0, 0, 0),
        "bgr_upper": (60, 60, 60),
        "detector": "pk",
    },
    {
        "name": "MinHold",
        "label": "4Mi Min",
        "bgr_lower": (150, 0, 150),
        "bgr_upper": (255, 80, 255),
        "detector": "av",
    },
]


class ImageParseError(Exception):
    pass


def _import_cv2():
    try:
        import cv2
        return cv2
    except ImportError:
        raise ImageParseError("opencv-python-headless não instalado. Adicione ao requirements.txt.")


def _import_pytesseract():
    try:
        import pytesseract
        return pytesseract
    except ImportError:
        raise ImageParseError("pytesseract não instalado.")


def parse_spectrum_image(image_bytes: bytes) -> Dict[str, Any]:
    """
    Parse a spectrum analyzer screenshot and extract trace data.

    Returns a dict with:
      - traces: list of {name, detector, frequency, intensity}
      - metadata: {freq_start, freq_stop, ref_level, rbw, vbw, swt, unit, date}
      - primary_trace: the most useful trace (PkMax preferred)
    """
    cv2 = _import_cv2()

    # Decode image
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ImageParseError("Não foi possível decodificar a imagem. Verifique o formato (PNG/JPG/BMP).")

    h, w = img.shape[:2]
    logger.info(f"Image size: {w}x{h}")

    # Step 1: Extract metadata via OCR
    metadata = _extract_metadata(img, w, h)
    logger.info(f"Metadata: {metadata}")

    # Step 2: Detect plot area
    plot_bounds = _detect_plot_area(img, w, h)
    logger.info(f"Plot bounds: {plot_bounds}")

    px, py, pw, ph = plot_bounds
    freq_start = metadata.get("freq_start", 0.0)
    freq_stop  = metadata.get("freq_stop", 3000.0)
    ref_level  = metadata.get("ref_level", -20.0)
    db_per_div = metadata.get("db_per_div", 10.0)
    n_divs     = metadata.get("n_divs", 8)
    unit       = metadata.get("unit", "dBm")

    # Y axis: top of plot = ref_level, bottom = ref_level - (n_divs * db_per_div)
    y_top_dbm    = ref_level
    y_bottom_dbm = ref_level - (n_divs * db_per_div)

    # Step 3: Extract each trace
    traces = []
    plot_region = img[py:py+ph, px:px+pw]

    for tc in TRACE_COLORS:
        try:
            freq_arr, amp_arr = _extract_trace(
                plot_region, pw, ph,
                tc["bgr_lower"], tc["bgr_upper"],
                freq_start, freq_stop,
                y_top_dbm, y_bottom_dbm,
                unit,
            )
            if len(freq_arr) > 10:
                traces.append({
                    "name": tc["name"],
                    "label": tc["label"],
                    "detector": tc["detector"],
                    "frequency": freq_arr,
                    "intensity": amp_arr,
                })
                logger.info(f"Trace {tc['name']}: {len(freq_arr)} points")
        except Exception as e:
            logger.warning(f"Failed to extract trace {tc['name']}: {e}")

    if not traces:
        raise ImageParseError(
            "Nenhum trace detectado na imagem. "
            "Verifique se é uma screenshot de analisador de espectro com fundo escuro."
        )

    # Pick primary trace: prefer PkMax, then Clrw, then first available
    primary = next((t for t in traces if t["name"] == "PkMax"), None)
    if primary is None:
        primary = next((t for t in traces if t["name"] == "Clrw"), None)
    if primary is None:
        primary = traces[0]

    return {
        "traces": traces,
        "metadata": metadata,
        "primary_trace": primary,
    }


def _extract_metadata(img: "np.ndarray", w: int, h: int) -> Dict[str, Any]:
    """OCR the header and footer areas to extract measurement parameters."""
    pytesseract = _import_pytesseract()
    from PIL import Image

    meta: Dict[str, Any] = {}

    # OCR top header (top 20% of image)
    header_h = int(h * 0.20)
    header_img = img[0:header_h, 0:w]
    header_pil = Image.fromarray(header_img[:, :, ::-1])  # BGR→RGB

    # Upscale for better OCR
    header_pil = header_pil.resize((header_pil.width * 2, header_pil.height * 2))
    header_text = pytesseract.image_to_string(header_pil, config="--psm 6")
    logger.debug(f"Header OCR: {header_text[:300]}")

    # OCR bottom footer (bottom 8%)
    footer_y = int(h * 0.92)
    footer_img = img[footer_y:h, 0:w]
    footer_pil = Image.fromarray(footer_img[:, :, ::-1])
    footer_pil = footer_pil.resize((footer_pil.width * 2, footer_pil.height * 2))
    footer_text = pytesseract.image_to_string(footer_pil, config="--psm 6")
    logger.debug(f"Footer OCR: {footer_text[:200]}")

    full_text = header_text + "\n" + footer_text

    # Parse frequency span from footer: "Start 100.0 MHz ... Stop 3.0 GHz"
    start_m = re.search(r'[Ss]tart\s+([\d.]+)\s*(MHz|GHz|kHz)', full_text)
    stop_m  = re.search(r'[Ss]top\s+([\d.]+)\s*(MHz|GHz|kHz)', full_text)
    if start_m:
        meta["freq_start"] = _to_mhz(float(start_m.group(1)), start_m.group(2))
    if stop_m:
        meta["freq_stop"] = _to_mhz(float(stop_m.group(1)), stop_m.group(2))

    # Parse Ref level: "Ref -20.0 dBm" or "Ref 0 dBm"
    ref_m = re.search(r'[Rr]ef\s+([-\d.]+)\s*(dBm|dBuV|dB[µu]V)', full_text)
    if ref_m:
        meta["ref_level"] = float(ref_m.group(1))
        meta["unit"] = ref_m.group(2).replace("dBuV", "dBµV").replace("dBµV", "dBµV")
    else:
        meta["ref_level"] = -20.0
        meta["unit"] = "dBm"

    # Parse RBW
    rbw_m = re.search(r'RBW\s+([\d.]+)\s*(MHz|kHz|Hz)', full_text)
    if rbw_m:
        meta["rbw_khz"] = _to_khz(float(rbw_m.group(1)), rbw_m.group(2))

    # Parse VBW
    vbw_m = re.search(r'VBW\s+([\d.]+)\s*(MHz|kHz|Hz)', full_text)
    if vbw_m:
        meta["vbw_khz"] = _to_khz(float(vbw_m.group(1)), vbw_m.group(2))

    # Parse SWT
    swt_m = re.search(r'SWT\s+([\d.]+)\s*(ms|s)', full_text)
    if swt_m:
        val = float(swt_m.group(1))
        meta["swt_s"] = val / 1000 if swt_m.group(2) == "ms" else val

    # Parse date
    date_m = re.search(r'Date[:\s]+([\d.]+\s+[\d:]+)', full_text)
    if date_m:
        meta["date"] = date_m.group(1).strip()

    # Detect dB/div from Y axis labels in the plot area
    db_per_div, n_divs = _detect_y_scale(img, w, h)
    meta["db_per_div"] = db_per_div
    meta["n_divs"] = n_divs

    # Defaults
    meta.setdefault("freq_start", 0.0)
    meta.setdefault("freq_stop", 3000.0)
    meta.setdefault("ref_level", -20.0)
    meta.setdefault("unit", "dBm")
    meta.setdefault("db_per_div", 10.0)
    meta.setdefault("n_divs", 8)

    return meta


def _detect_y_scale(img: "np.ndarray", w: int, h: int) -> Tuple[float, float]:
    """Detect dB/div and number of divisions from Y axis labels."""
    pytesseract = _import_pytesseract()
    from PIL import Image

    # OCR left strip (Y axis labels)
    left_w = int(w * 0.12)
    plot_top = int(h * 0.15)
    plot_bot = int(h * 0.88)
    left_img = img[plot_top:plot_bot, 0:left_w]
    left_pil = Image.fromarray(left_img[:, :, ::-1])
    left_pil = left_pil.resize((left_pil.width * 3, left_pil.height * 2))
    text = pytesseract.image_to_string(left_pil, config="--psm 6 -c tessedit_char_whitelist=0123456789-. dBm")

    # Find all dB values
    vals = re.findall(r'(-?\d+(?:\.\d+)?)\s*dBm', text)
    if len(vals) >= 2:
        nums = sorted([float(v) for v in vals], reverse=True)
        if len(nums) >= 2:
            diffs = [abs(nums[i] - nums[i+1]) for i in range(len(nums)-1)]
            # Most common diff = dB/div
            if diffs:
                db_per_div = max(set(round(d) for d in diffs), key=lambda x: diffs.count(x))
                n_divs = len(nums) - 1
                return float(db_per_div), float(n_divs)

    return 10.0, 8  # R&S default


def _detect_plot_area(img: "np.ndarray", w: int, h: int) -> Tuple[int, int, int, int]:
    """
    Detect the plot area boundaries.
    R&S EMC32 has a consistent layout:
    - Header: ~15% top
    - Footer: ~10% bottom
    - Left margin (Y labels): ~10%
    - Right margin (legend): ~15%
    Returns (x, y, width, height) of plot area.
    """
    # Conservative fixed ratios that work well for R&S EMC32
    x = int(w * 0.10)
    y = int(h * 0.15)
    pw = int(w * 0.75)
    ph = int(h * 0.73)
    return x, y, pw, ph


def _extract_trace(
    plot_img: "np.ndarray",
    pw: int, ph: int,
    bgr_lower: Tuple[int, int, int],
    bgr_upper: Tuple[int, int, int],
    freq_start: float, freq_stop: float,
    y_top_dbm: float, y_bottom_dbm: float,
    unit: str,
) -> Tuple[List[float], List[float]]:
    """
    Extract a single trace by color from the plot region.
    For each X column, find the topmost pixel matching the color mask.
    """
    cv2 = _import_cv2()
    import numpy as np

    lower = np.array(bgr_lower, dtype=np.uint8)
    upper = np.array(bgr_upper, dtype=np.uint8)
    mask = cv2.inRange(plot_img, lower, upper)

    freq_arr = []
    amp_arr  = []

    for col in range(pw):
        col_mask = mask[:, col]
        rows = np.where(col_mask > 0)[0]
        if len(rows) == 0:
            continue

        # Use topmost pixel (highest amplitude)
        row = int(rows[0])

        # Convert pixel coordinates to physical values
        freq = freq_start + (col / pw) * (freq_stop - freq_start)
        amp  = y_top_dbm - (row / ph) * (y_top_dbm - y_bottom_dbm)

        freq_arr.append(round(freq, 4))
        amp_arr.append(round(amp, 2))

    # Downsample to max 5000 points
    if len(freq_arr) > 5000:
        step = len(freq_arr) // 5000
        freq_arr = freq_arr[::step]
        amp_arr  = amp_arr[::step]

    return freq_arr, amp_arr


def _to_mhz(val: float, unit: str) -> float:
    unit = unit.upper()
    if unit == "GHZ":
        return val * 1000
    if unit == "KHZ":
        return val / 1000
    return val  # MHz


def _to_khz(val: float, unit: str) -> float:
    unit = unit.upper()
    if unit == "MHZ":
        return val * 1000
    if unit == "HZ":
        return val / 1000
    return val  # kHz


def convert_dbm_to_dbuv(dbm_values: List[float], impedance_ohm: float = 50.0) -> List[float]:
    """
    Convert dBm to dBµV for a given impedance.
    Formula: dBµV = dBm + 10*log10(impedance) + 90
    For 50Ω: dBµV = dBm + 107
    For 75Ω: dBµV = dBm + 108.75
    """
    offset = 10 * np.log10(impedance_ohm) + 90.0
    return [round(v + offset, 2) for v in dbm_values]
