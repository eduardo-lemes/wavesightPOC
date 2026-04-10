"""
PDF Report Generator for WaveSight EMC.

Generates professional PDF reports using WeasyPrint.
Falls back gracefully if WeasyPrint is not installed.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


def _is_available() -> bool:
    try:
        import weasyprint  # noqa: F401
        return True
    except ImportError:
        return False


def generate_pdf(
    analysis_data: Dict[str, Any],
    filename: str = "wavesight-report.pdf",
    project_name: Optional[str] = None,
    norm_label: Optional[str] = None,
) -> bytes:
    """Generate a PDF report from analysis data. Returns PDF bytes."""
    if not _is_available():
        raise RuntimeError("weasyprint não instalado. Adicione ao requirements.txt.")

    import weasyprint

    series = []
    if isinstance(analysis_data.get("results_json"), str):
        try:
            series = json.loads(analysis_data["results_json"])
        except Exception:
            series = []
    elif isinstance(analysis_data.get("series"), list):
        series = analysis_data["series"]

    html = _build_html(
        series=series,
        filename=analysis_data.get("filename", filename),
        ai_insights=analysis_data.get("ai_insights"),
        emission_type=analysis_data.get("emission_type"),
        project_name=project_name,
        norm_label=norm_label,
    )

    pdf_bytes = weasyprint.HTML(string=html).write_pdf()
    return pdf_bytes


# ─── RE310 evaluation (same logic as frontend) ──────────────────────
RE310_REQUIREMENTS = [
    {"type": "group", "label": "Broadcast Services"},
    {"type": "row", "id": "BS-01", "desc": "LW", "min": 0.15, "max": 0.285, "pk": None, "av": 36, "qp": 43},
    {"type": "row", "id": "BS-02", "desc": "MW", "min": 0.53, "max": 1.7, "pk": None, "av": 12, "qp": 30},
    {"type": "row", "id": "BS-03", "desc": "SW", "min": 1.7, "max": 30, "pk": None, "av": 12, "qp": 24},
    {"type": "row", "id": "BS-04", "desc": "FM 1", "min": 75, "max": 91, "pk": 18, "av": 12, "qp": 24},
    {"type": "row", "id": "BS-05", "desc": "FM 2", "min": 86, "max": 108, "pk": 18, "av": 12, "qp": 24},
    {"type": "group", "label": "Digital Broadcast Services"},
    {"type": "row", "id": "DB-01", "desc": "DAB III / TV Band III", "min": 167, "max": 245, "pk": 32, "av": 22, "qp": None},
    {"type": "row", "id": "DB-02", "desc": "TV Band IV/V", "min": 470, "max": 890, "pk": 38, "av": 28, "qp": None},
    {"type": "row", "id": "DB-03", "desc": "DAB L Band", "min": 1447, "max": 1494, "pk": 46, "av": 36, "qp": None},
    {"type": "row", "id": "DB-04", "desc": "SDARS", "min": 2320, "max": 2345, "pk": 46, "av": 36, "qp": None},
    {"type": "group", "label": "Mobile Services"},
    {"type": "row", "id": "MS-01", "desc": "4m", "min": 68, "max": 88, "pk": 18, "av": 12, "qp": 24},
    {"type": "row", "id": "MS-02", "desc": "2m", "min": 140, "max": 176, "pk": 18, "av": 12, "qp": 24},
    {"type": "row", "id": "MS-03", "desc": "RKE & TPMS 1", "min": 310, "max": 320, "pk": 20, "av": 14, "qp": None},
    {"type": "row", "id": "MS-04", "desc": "TETRA", "min": 380, "max": 424, "pk": 25, "av": 19, "qp": None},
    {"type": "row", "id": "MS-05", "desc": "RKE & TPMS 2", "min": 425, "max": 439, "pk": 25, "av": 19, "qp": None},
    {"type": "row", "id": "MS-06", "desc": "Police (Europe)", "min": 440, "max": 470, "pk": 25, "av": 19, "qp": None},
    {"type": "row", "id": "MS-07", "desc": "RKE", "min": 868, "max": 870, "pk": 30, "av": 24, "qp": None},
    {"type": "row", "id": "MS-08", "desc": "RKE", "min": 902, "max": 904, "pk": 30, "av": 24, "qp": None},
    {"type": "row", "id": "MS-09", "desc": "4G", "min": 703, "max": 821, "pk": 46, "av": 36, "qp": None},
    {"type": "row", "id": "MS-10", "desc": "GSM 850", "min": 859, "max": 895, "pk": 32, "av": 12, "qp": None},
    {"type": "row", "id": "MS-11", "desc": "GSM 900", "min": 915, "max": 960, "pk": 32, "av": 12, "qp": None},
    {"type": "row", "id": "MS-12", "desc": "GPS", "min": 1567, "max": 1583, "pk": None, "av": 10, "qp": None},
    {"type": "row", "id": "MS-13", "desc": "GLONASS GPS", "min": 1585, "max": 1616, "pk": None, "av": 10, "qp": None},
    {"type": "row", "id": "MS-14", "desc": "GSM 1800", "min": 1805, "max": 1880, "pk": 34, "av": 14, "qp": None},
    {"type": "row", "id": "MS-15", "desc": "GSM 1900", "min": 1930, "max": 1995, "pk": 34, "av": 14, "qp": None},
    {"type": "row", "id": "MS-16", "desc": "3G", "min": 1900, "max": 2170, "pk": 46, "av": 36, "qp": None},
    {"type": "row", "id": "MS-17", "desc": "WiFi / Bluetooth", "min": 2400, "max": 2496, "pk": 46, "av": 36, "qp": None},
    {"type": "row", "id": "MS-18", "desc": "4G", "min": 2496, "max": 2690, "pk": 46, "av": 36, "qp": None},
    {"type": "row", "id": "MS-19", "desc": "WiFi", "min": 4915, "max": 5825, "pk": 56, "av": 46, "qp": None},
    {"type": "row", "id": "MS-20", "desc": "ITS", "min": 5875, "max": 5905, "pk": 56, "av": 46, "qp": None},
]


def _evaluate_band(req: dict, series: list) -> dict:
    """Evaluate a single RE310 band across all series."""
    limit = req.get("pk") or req.get("av") or req.get("qp")
    det = "PK" if req.get("pk") else "AV" if req.get("av") else "QP" if req.get("qp") else None
    if not det or limit is None:
        return {"status": "N/A", "det": det, "max_val": None, "max_freq": None, "margin": None}

    worst_val = -999
    worst_freq = None
    for s in series:
        freqs = s.get("frequency", [])
        amps = s.get("intensity", [])
        for i, f in enumerate(freqs):
            if req["min"] <= f <= req["max"] and i < len(amps):
                if amps[i] > worst_val:
                    worst_val = amps[i]
                    worst_freq = f

    if worst_val == -999:
        return {"status": "N/D", "det": det, "max_val": None, "max_freq": None, "margin": None}

    margin = round(worst_val - limit, 1)
    status = "PASS" if margin <= 0 else "FAIL"
    return {"status": status, "det": det, "max_val": round(worst_val, 1), "max_freq": round(worst_freq, 2), "margin": margin, "limit": limit}


def _build_re310_html(series: list) -> str:
    """Build RE310 evaluation table HTML."""
    rows = []
    pass_count = 0
    fail_count = 0
    for req in RE310_REQUIREMENTS:
        if req["type"] == "group":
            rows.append(f'<tr class="group"><td colspan="7">{req["label"]}</td></tr>')
            continue
        result = _evaluate_band(req, series)
        cls = "pass" if result["status"] == "PASS" else "fail" if result["status"] == "FAIL" else "na"
        if result["status"] == "PASS":
            pass_count += 1
        elif result["status"] == "FAIL":
            fail_count += 1
        max_str = f'{result["max_val"]} @ {result["max_freq"]} MHz' if result["max_val"] is not None else "—"
        margin_str = f'{result["margin"]:+.1f} dB' if result["margin"] is not None else "—"
        limit_str = f'{result.get("limit", "—")}' if result.get("limit") else "—"
        rows.append(f'''<tr>
            <td>{req["id"]}</td><td>{req["desc"]}</td>
            <td>{req["min"]}–{req["max"]}</td><td>{result["det"] or "—"}</td>
            <td>{limit_str}</td><td>{max_str}</td>
            <td class="{cls}">{margin_str}</td>
            <td class="result-{cls}">{result["status"]}</td>
        </tr>''')
    total = pass_count + fail_count
    overall = "PASS" if fail_count == 0 and total > 0 else "FAIL" if fail_count > 0 else "N/D"
    summary = f'<div class="re310-summary {overall.lower()}">{overall} — {pass_count} pass, {fail_count} fail de {total} bandas avaliadas</div>'
    return f'''{summary}
    <table class="re310"><thead><tr>
        <th>ID</th><th>Banda</th><th>Faixa (MHz)</th><th>Det</th><th>Limite</th><th>Máx medido</th><th>Margem</th><th>Resultado</th>
    </tr></thead><tbody>{"".join(rows)}</tbody></table>'''


def _build_html(
    series: list,
    filename: str,
    ai_insights: Optional[str] = None,
    emission_type: Optional[str] = None,
    project_name: Optional[str] = None,
    norm_label: Optional[str] = None,
) -> str:
    ts = datetime.now().strftime("%d/%m/%Y %H:%M")
    file_list = filename or "—"
    n_series = len(series)

    # Stats rows
    stats_rows = ""
    for s in series:
        st = s.get("stats", {})
        stats_rows += f'''<tr>
            <td>{s.get("filename", "—")}</td>
            <td>{s.get("count", "—")}</td>
            <td>{st.get("min", 0):.1f}</td><td>{st.get("max", 0):.1f}</td>
            <td>{st.get("mean", 0):.1f}</td><td>{st.get("std", 0):.1f}</td>
            <td>{s.get("emission_type", "—")}</td>
        </tr>'''

    # Top peaks
    all_peaks = []
    for s in series:
        for p in s.get("peaks", []):
            all_peaks.append(p)
    all_peaks.sort(key=lambda p: p.get("intensity", 0), reverse=True)
    peak_rows = ""
    for i, p in enumerate(all_peaks[:30]):
        peak_rows += f'<tr><td>{i+1}</td><td>{p.get("frequency", 0):.4f}</td><td>{p.get("intensity", 0):.2f}</td></tr>'

    # RE310
    re310_html = _build_re310_html(series)

    # AI insights
    ai_section = ""
    if ai_insights:
        ai_text = ai_insights.replace("\n", "<br/>")
        ai_section = f'<div class="section"><h2>Diagnóstico IA</h2><div class="ai-box">{ai_text}</div></div>'

    return f'''<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"/><title>WaveSight EMC — Relatório</title>
<style>
@page {{ size: A4 landscape; margin: 15mm; }}
* {{ box-sizing: border-box; }}
body {{ font-family: "Helvetica Neue", Arial, sans-serif; color: #1a1a1a; font-size: 10px; line-height: 1.5; margin: 0; }}
.cover {{ padding: 40px; border: 2px solid #0a7ea4; border-radius: 8px; margin-bottom: 20px; page-break-after: always; }}
.cover h1 {{ font-size: 28px; color: #0a7ea4; margin: 0 0 8px; }}
.cover .subtitle {{ font-size: 14px; color: #555; }}
.cover .meta {{ margin-top: 20px; font-size: 11px; color: #666; }}
.cover .meta div {{ margin: 4px 0; }}
.section {{ margin-bottom: 16px; }}
h2 {{ font-size: 13px; color: #0a7ea4; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin: 16px 0 8px; }}
table {{ border-collapse: collapse; width: 100%; font-size: 9px; margin-bottom: 12px; }}
th, td {{ border: 1px solid #ccc; padding: 4px 6px; text-align: left; }}
th {{ background: #f0f4f8; font-weight: 600; font-size: 8px; text-transform: uppercase; }}
.re310 th {{ text-align: center; }}
.re310 td {{ text-align: center; }}
.re310 .group td {{ background: #e8ecf0; font-weight: 700; text-align: left; }}
.pass {{ color: #1b7a3d; font-weight: 600; }}
.fail {{ color: #c0392b; font-weight: 600; }}
.na {{ color: #888; }}
.result-pass {{ background: #e8f5e9; color: #1b7a3d; font-weight: 700; }}
.result-fail {{ background: #ffebee; color: #c0392b; font-weight: 700; }}
.result-na {{ background: #f5f5f5; color: #888; }}
.re310-summary {{ font-size: 13px; font-weight: 700; padding: 8px 12px; border-radius: 6px; margin-bottom: 8px; display: inline-block; }}
.re310-summary.pass {{ background: #e8f5e9; color: #1b7a3d; border: 1px solid #a5d6a7; }}
.re310-summary.fail {{ background: #ffebee; color: #c0392b; border: 1px solid #ef9a9a; }}
.re310-summary.n\\/d {{ background: #f5f5f5; color: #888; }}
.ai-box {{ background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px; font-size: 10px; line-height: 1.6; }}
.footer {{ margin-top: 20px; font-size: 8px; color: #999; border-top: 1px solid #eee; padding-top: 6px; text-align: center; }}
.badge {{ display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: 600; }}
.badge-nb {{ background: #e3f2fd; color: #1565c0; }}
.badge-bb {{ background: #fff3e0; color: #e65100; }}
.badge-mx {{ background: #f3e5f5; color: #7b1fa2; }}
</style></head>
<body>
<div class="cover">
    <h1>WaveSight EMC</h1>
    <div class="subtitle">Relatório de Pre-Compliance</div>
    <div class="meta">
        <div><strong>Arquivos:</strong> {file_list}</div>
        <div><strong>Séries:</strong> {n_series}</div>
        {"<div><strong>Projeto:</strong> " + project_name + "</div>" if project_name else ""}
        {"<div><strong>Norma:</strong> " + norm_label + "</div>" if norm_label else ""}
        {"<div><strong>Tipo de emissão:</strong> " + emission_type + "</div>" if emission_type else ""}
        <div><strong>Gerado em:</strong> {ts}</div>
    </div>
</div>

<div class="section">
    <h2>RE310 Level 2 — Avaliação por Banda</h2>
    <p style="font-size:8px;color:#888;">Detector ref: PK→AV→QP. Pior caso entre arquivos. Dados assumidos como PK (pre-compliance).</p>
    {re310_html}
</div>

<div class="section" style="page-break-before: always;">
    <h2>Resumo das Séries</h2>
    <table><thead><tr>
        <th>Arquivo</th><th>Amostras</th><th>Min</th><th>Max</th><th>Média</th><th>Desvio</th><th>Emissão</th>
    </tr></thead><tbody>{stats_rows}</tbody></table>
</div>

<div class="section">
    <h2>Top 30 Picos</h2>
    <table><thead><tr><th>#</th><th>Frequência (MHz)</th><th>Amplitude (dBµV)</th></tr></thead>
    <tbody>{peak_rows if peak_rows else "<tr><td colspan='3'>Nenhum pico detectado</td></tr>"}</tbody></table>
</div>

{ai_section}

<div class="footer">WaveSight EMC — Relatório de pre-compliance gerado automaticamente em {ts}. Valores de referência para preparação — não substitui certificação formal com norma oficial e receptor EMC.</div>
</body></html>'''
