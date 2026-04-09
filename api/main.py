from __future__ import annotations

import io
import json
import logging
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from fastapi import Depends, FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import Analysis, Project, User
from .security import CORS_ORIGINS, create_access_token, decode_access_token, hash_password, verify_password
from . import ai_provider
from .dfl_parser import dfl_to_csv_bytes, DFLParseError
from .image_parser import parse_spectrum_image, convert_dbm_to_dbuv, ImageParseError

logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="WaveSight EMC POC", lifespan=lifespan)
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)


# ─── Pydantic Schemas ──────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    is_active: bool


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None


class ProjectOut(BaseModel):
    id: int
    name: str
    description: str | None
    created_at: str
    analysis_count: int = 0


class AnalysisSave(BaseModel):
    filename: str
    params_json: str | None = None
    results_json: str | None = None
    project_id: int | None = None


class AnalysisOut(BaseModel):
    id: int
    filename: str
    ai_insights: str | None
    emission_type: str | None
    created_at: str
    project_id: int | None


class AnalyzeRequest(BaseModel):
    data: dict


# ─── Helpers ────────────────────────────────────────────────────────
def _normalize_email(email: str) -> str:
    normalized = (email or "").strip().lower()
    if "@" not in normalized or "." not in normalized:
        raise HTTPException(status_code=400, detail="Email invalido")
    return normalized


def _user_to_out(user: User) -> UserOut:
    return UserOut(id=user.id, name=user.name, email=user.email, is_active=user.is_active)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Nao autenticado")
    token = credentials.credentials
    try:
        subject = decode_access_token(token)
        user_id = int(subject)
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalido")
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario invalido")
    return user


# ─── Auth Endpoints ─────────────────────────────────────────────────
@app.post("/auth/register", response_model=AuthResponse)
@limiter.limit("3/minute")
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    name = (payload.name or "").strip()
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Nome deve ter ao menos 2 caracteres")
    email = _normalize_email(payload.email)
    password = payload.password or ""
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Senha deve ter ao menos 8 caracteres")
    existing = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Email ja cadastrado")
    user = User(name=name, email=email, password_hash=hash_password(password), is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id))
    return AuthResponse(access_token=token, token_type="bearer", user=_user_to_out(user))


@app.post("/auth/login", response_model=AuthResponse)
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    email = _normalize_email(payload.email)
    password = payload.password or ""
    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciais invalidas")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario inativo")
    token = create_access_token(str(user.id))
    return AuthResponse(access_token=token, token_type="bearer", user=_user_to_out(user))


@app.get("/auth/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return _user_to_out(current_user)


# ─── CSV Processing (internal) ──────────────────────────────────────
_ALLOWED_EXTENSIONS = {".csv", ".dfl"}


def _file_extension(filename: str) -> str:
    lower = (filename or "").lower()
    for ext in _ALLOWED_EXTENSIONS:
        if lower.endswith(ext):
            return ext
    return ""


def _coerce_to_csv_bytes(file_bytes: bytes, filename: str) -> bytes:
    """Transparently convert .dfl files to CSV bytes; pass .csv files through as-is."""
    ext = _file_extension(filename)
    if ext == ".dfl":
        try:
            return dfl_to_csv_bytes(file_bytes)
        except DFLParseError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Erro ao processar .dfl: {exc}") from exc
    return file_bytes


def _read_csv(file_bytes: bytes) -> pd.DataFrame:
    try:
        df = pd.read_csv(io.BytesIO(file_bytes), sep=None, engine="python", header=None, comment="#")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"CSV invalido: {exc}") from exc

    if df.shape[1] < 2:
        raise HTTPException(status_code=400, detail="CSV deve ter pelo menos 2 colunas (frequencia, intensidade).")

    df = df.iloc[:, :2]

    def _is_number(x: Any) -> bool:
        try:
            float(x)
            return True
        except Exception:
            return False

    if not (_is_number(df.iloc[0, 0]) and _is_number(df.iloc[0, 1])):
        df = df.iloc[1:, :]

    df = df.dropna()
    df[0] = pd.to_numeric(df[0], errors="coerce")
    df[1] = pd.to_numeric(df[1], errors="coerce")
    df = df.dropna()

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV sem dados numericos validos.")

    df = df.sort_values(by=0).reset_index(drop=True)
    return df


def _find_peaks(y: np.ndarray, min_height: Optional[float] = None, min_distance: Optional[int] = None) -> List[int]:
    try:
        from scipy.signal import find_peaks
        kwargs = {}
        if min_height is not None:
            kwargs["height"] = min_height
        if min_distance is not None and min_distance > 0:
            kwargs["distance"] = min_distance
        peaks, _ = find_peaks(y, **kwargs)
        return peaks.astype(int).tolist()
    except Exception:
        peaks = []
        for i in range(1, len(y) - 1):
            if y[i] > y[i - 1] and y[i] > y[i + 1]:
                if min_height is None or y[i] >= min_height:
                    peaks.append(i)
        if min_distance is None or min_distance <= 0:
            return peaks
        filtered = []
        last_kept = -min_distance
        for idx in peaks:
            if idx - last_kept >= min_distance:
                filtered.append(idx)
                last_kept = idx
        return filtered


def _basic_stats(y: np.ndarray) -> Dict[str, float]:
    return {"min": float(np.min(y)), "max": float(np.max(y)), "mean": float(np.mean(y)), "std": float(np.std(y))}


def _normalize_smoothing(method: Optional[str], window: Optional[int]) -> Dict[str, Any]:
    method_norm = (method or "none").strip().lower()
    if method_norm not in {"none", "moving", "savgol"}:
        raise HTTPException(status_code=400, detail="Metodo de suavizacao invalido.")
    if method_norm == "none":
        return {"method": "none", "window": None}
    if window is None or window <= 0:
        window = 5 if method_norm == "moving" else 11
    if window < 3:
        window = 3
    if method_norm == "savgol" and window % 2 == 0:
        window += 1
    return {"method": method_norm, "window": int(window)}


def _apply_smoothing(y: np.ndarray, method: str, window: int) -> np.ndarray:
    if method == "moving":
        if window <= 1:
            return y
        # Use uniform_filter1d instead of convolve to avoid edge distortion
        from scipy.ndimage import uniform_filter1d
        return uniform_filter1d(y.astype(float), size=window, mode="nearest")
    if method == "savgol":
        try:
            from scipy.signal import savgol_filter
            polyorder = 2
            if window <= polyorder:
                window = polyorder + 1
                if window % 2 == 0:
                    window += 1
            return savgol_filter(y, window_length=window, polyorder=polyorder)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Savitzky-Golay indisponivel: {exc}") from exc
    return y


def _analyze_patterns(freq: np.ndarray, inten: np.ndarray, peaks_idx: List[int], tol_ratio: float = 0.02) -> Dict[str, Any]:
    if len(peaks_idx) < 3:
        return {}

    peaks = [(float(freq[i]), float(inten[i])) for i in peaks_idx if 0 <= i < len(freq)]
    if len(peaks) < 3:
        return {}

    # Adaptive tolerance: 2% above 10 MHz, 5% below 10 MHz (lower freq resolution in CSV)
    def get_tol(f: float) -> float:
        return 0.05 if f < 10.0 else tol_ratio

    # Harmonic detection — test top 20 peaks as fundamental candidates (not just 10)
    # Also test sub-harmonics: if peaks at 200, 400, 600 MHz, fundamental could be 200 MHz
    # but also check if 100 MHz (not present) would explain them as 2nd, 4th, 6th harmonics
    candidates = sorted(peaks, key=lambda p: p[1], reverse=True)[:20]
    best = None
    for f0, _ in candidates:
        if f0 <= 0:
            continue
        matches: List[Tuple[int, float, float]] = []
        for f, amp in peaks:
            n = int(round(f / f0))
            if n < 2:
                continue
            target = n * f0
            if target <= 0:
                continue
            tol = get_tol(target)
            if abs(f - target) / target <= tol:
                matches.append((n, f, amp))
        if best is None or len(matches) > len(best["matches"]):
            best = {"f0": f0, "matches": matches}

    harmonics = None
    if best and len(best["matches"]) >= 2:
        harmonics = {
            "fundamental": best["f0"],
            "count": len(best["matches"]),
            "matches": [{"n": n, "frequency": f, "intensity": amp} for n, f, amp in sorted(best["matches"], key=lambda x: x[0])],
        }

    # Spacing detection — find regularly spaced peaks (common in switching regulators)
    peaks_sorted = sorted(peaks, key=lambda p: p[0])
    diffs = [peaks_sorted[i + 1][0] - peaks_sorted[i][0] for i in range(len(peaks_sorted) - 1)]
    diffs = [d for d in diffs if d > 0]
    spacing = None
    if len(diffs) >= 3:
        clusters: List[Tuple[float, int]] = []
        for d in diffs:
            placed = False
            for idx, (center, count) in enumerate(clusters):
                tol = get_tol(center)
                if abs(d - center) / center <= tol:
                    new_center = (center * count + d) / (count + 1)
                    clusters[idx] = (new_center, count + 1)
                    placed = True
                    break
            if not placed:
                clusters.append((d, 1))
        clusters.sort(key=lambda x: x[1], reverse=True)
        if clusters and clusters[0][1] >= 3:
            spacing = {"delta": clusters[0][0], "count": clusters[0][1]}

    patterns: Dict[str, Any] = {}
    if harmonics:
        patterns["harmonics"] = harmonics
    if spacing:
        patterns["spacing"] = spacing
    return patterns


def _classify_emission(patterns: Dict[str, Any], peaks_count: int, freq: np.ndarray) -> str:
    """Classify emission type based on detected patterns and spectral density.

    Uses peak density (peaks per 100 MHz) rather than absolute count to avoid
    false broadband classification on wide-span sweeps.
    """
    has_harmonics = "harmonics" in patterns and patterns["harmonics"].get("count", 0) >= 3

    # Calculate span in MHz to normalize peak density
    span_mhz = float(freq[-1] - freq[0]) if len(freq) > 1 else 1.0
    span_mhz = max(span_mhz, 1.0)
    peak_density = (peaks_count / span_mhz) * 100  # peaks per 100 MHz

    # Broadband: high peak density without harmonic structure
    # >5 peaks/100 MHz without harmonics suggests broadband noise
    has_broadband = peak_density > 5 and "harmonics" not in patterns

    if has_harmonics and has_broadband:
        return "mixed"
    elif has_harmonics:
        return "narrowband"
    elif has_broadband:
        return "broadband"
    return "indeterminate"


def _compare_revisions(series: List[Dict[str, Any]], threshold_db: float = 6.0) -> Dict[str, Any] | None:
    """Compare 2+ series to find new/removed emissions and significant deltas."""
    if len(series) < 2:
        return None

    baseline = series[0]
    baseline_peaks = {round(p["frequency"], 1): p["intensity"] for p in baseline.get("peaks", [])}
    comparison = {"new_emissions": [], "removed_emissions": [], "significant_deltas": []}

    for s in series[1:]:
        s_peaks = {round(p["frequency"], 1): p["intensity"] for p in s.get("peaks", [])}
        label = s.get("filename", "?")

        for freq, intensity in s_peaks.items():
            if freq not in baseline_peaks:
                comparison["new_emissions"].append({"file": label, "freq_mhz": freq, "intensity_dbuv": intensity})
            else:
                delta = intensity - baseline_peaks[freq]
                if abs(delta) >= threshold_db:
                    comparison["significant_deltas"].append({"file": label, "freq_mhz": freq, "delta_db": round(delta, 1)})

        for freq, intensity in baseline_peaks.items():
            if freq not in s_peaks:
                comparison["removed_emissions"].append({"file": label, "freq_mhz": freq, "intensity_dbuv": intensity})

    return comparison if any(comparison.values()) else None


def _process_series(
    file_bytes: bytes, filename: str, smoothing_method: Optional[str], smoothing_window: Optional[int],
    peak_min_height: Optional[float], peak_min_distance: Optional[int], max_peaks: int,
) -> Dict[str, Any]:
    df = _read_csv(file_bytes)
    freq = df.iloc[:, 0].to_numpy(dtype=float)
    inten = df.iloc[:, 1].to_numpy(dtype=float)

    smoothing = _normalize_smoothing(smoothing_method, smoothing_window)
    if smoothing["method"] != "none":
        inten = _apply_smoothing(inten, smoothing["method"], smoothing["window"])

    peaks_idx = _find_peaks(inten, peak_min_height, peak_min_distance)
    max_peaks = max(10, int(max_peaks))
    peaks_idx_sorted = sorted(sorted(peaks_idx, key=lambda i: inten[i], reverse=True)[:max_peaks])

    peaks = [{"frequency": float(freq[i]), "intensity": float(inten[i])} for i in peaks_idx_sorted]
    stats = _basic_stats(inten)
    patterns = _analyze_patterns(freq, inten, peaks_idx_sorted)
    emission_type = _classify_emission(patterns, len(peaks_idx), freq)

    return {
        "filename": filename,
        "count": int(len(freq)),
        "frequency": freq.tolist(),
        "intensity": inten.tolist(),
        "peaks": peaks,
        "stats": stats,
        "patterns": patterns,
        "smoothing": smoothing,
        "emission_type": emission_type,
    }


def _build_ai_data(series: List[Dict[str, Any]], comparison: Dict[str, Any] | None = None) -> dict:
    """Build structured data dict for AI provider."""
    data: dict = {
        "files": [s["filename"] for s in series],
        "stats": {s["filename"]: {**s["stats"], "samples": s["count"]} for s in series},
        "peaks": [],
        "patterns": {},
    }
    for s in series:
        for p in (s.get("peaks") or [])[:10]:
            data["peaks"].append({"file": s["filename"], "freq_mhz": p["frequency"], "intensity_dbuv": p["intensity"]})
        if s.get("patterns"):
            pat = s["patterns"]
            if "harmonics" in pat:
                data["patterns"]["harmonics"] = {"fundamental_mhz": pat["harmonics"]["fundamental"], "count": pat["harmonics"]["count"]}
            if "spacing" in pat:
                data["patterns"]["spacing"] = {"delta_mhz": pat["spacing"]["delta"], "count": pat["spacing"]["count"]}
        if s.get("emission_type"):
            data["emission_type"] = s["emission_type"]
    if comparison:
        data["revision_comparison"] = comparison
    return data


# ─── API Endpoints ──────────────────────────────────────────────────
@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    smoothing: Optional[str] = None,
    smoothing_window: Optional[int] = None,
    peak_min_height: Optional[float] = None,
    peak_min_distance: Optional[int] = None,
    max_peaks: int = 200,
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    _ = current_user
    filename = file.filename or ""
    if not _file_extension(filename):
        raise HTTPException(status_code=400, detail="Arquivo deve ser .csv ou .dfl")
    file_bytes = await file.read()
    csv_bytes = _coerce_to_csv_bytes(file_bytes, filename)
    payload = _process_series(csv_bytes, filename, smoothing, smoothing_window, peak_min_height, peak_min_distance, max_peaks)
    return JSONResponse(payload)


@app.post("/upload-multi")
async def upload_csv_multi(
    files: List[UploadFile] = File(...),
    smoothing: Optional[str] = None,
    smoothing_window: Optional[int] = None,
    peak_min_height: Optional[float] = None,
    peak_min_distance: Optional[int] = None,
    max_peaks: int = 200,
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    _ = current_user
    if not files:
        raise HTTPException(status_code=400, detail="Nenhum arquivo enviado.")

    series = []
    for file in files:
        filename = file.filename or ""
        if not _file_extension(filename):
            raise HTTPException(status_code=400, detail=f"Arquivo invalido (esperado .csv ou .dfl): {filename}")
        file_bytes = await file.read()
        csv_bytes = _coerce_to_csv_bytes(file_bytes, filename)
        series.append(_process_series(csv_bytes, filename, smoothing, smoothing_window, peak_min_height, peak_min_distance, max_peaks))

    # Revision comparison
    comparison = _compare_revisions(series)

    # AI insights (never blocks)
    ai_data = _build_ai_data(series, comparison)
    ai_insights = await ai_provider.analyze(ai_data)

    payload = {
        "series": series,
        "smoothing": _normalize_smoothing(smoothing, smoothing_window),
        "peak_params": {"min_height": peak_min_height, "min_distance": peak_min_distance, "max_peaks": max_peaks},
        "ai_insights": ai_insights,
        "revision_comparison": comparison,
    }

    # Auto-save as report
    import json as _json
    db = next(get_db())
    filenames = ", ".join(f.filename or "unknown" for f in files)
    emission = series[0].get("emission_type") if series else None
    analysis = Analysis(
        user_id=current_user.id,
        filename=filenames,
        params_json=_json.dumps(payload.get("peak_params", {})),
        results_json=_json.dumps(series),
        ai_insights=ai_insights,
        emission_type=emission,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    payload["report_id"] = analysis.id
    return JSONResponse(payload)


@app.post("/analyze")
async def analyze_endpoint(
    payload: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """Standalone AI analysis endpoint. Returns null if AI not configured."""
    _ = current_user
    ai_insights = await ai_provider.analyze(payload.data)
    return JSONResponse({"ai_insights": ai_insights})


# ─── Analysis CRUD ──────────────────────────────────────────────────
@app.post("/analyses")
def save_analysis(payload: AnalysisSave, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> JSONResponse:
    analysis = Analysis(
        user_id=current_user.id,
        filename=payload.filename,
        params_json=payload.params_json,
        results_json=payload.results_json,
        project_id=payload.project_id,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return JSONResponse({"id": analysis.id, "message": "Analise salva"})


@app.get("/analyses")
def list_analyses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    project_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> JSONResponse:
    q = select(Analysis).where(Analysis.user_id == current_user.id)
    if project_id is not None:
        q = q.where(Analysis.project_id == project_id)
    q = q.order_by(Analysis.created_at.desc()).limit(limit).offset(offset)
    rows = db.execute(q).scalars().all()
    import json as _json
    result = []
    for a in rows:
        item = {
            "id": a.id, "filename": a.filename, "ai_insights": a.ai_insights,
            "emission_type": a.emission_type, "project_id": a.project_id,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        # Extract metadata from results_json
        try:
            series = _json.loads(a.results_json) if a.results_json else []
            if series:
                all_peaks = []
                all_freqs = []
                all_amps = []
                for s in series:
                    peaks = s.get("peaks", [])
                    all_peaks.extend(peaks)
                    freqs = s.get("freqs", [])
                    amps = s.get("amps", [])
                    if freqs:
                        all_freqs.extend([freqs[0], freqs[-1]])
                    if amps:
                        all_amps.append(max(amps))
                item["peak_count"] = len(all_peaks)
                item["freq_range"] = f"{min(all_freqs):.1f} – {max(all_freqs):.1f} MHz" if all_freqs else None
                item["max_amplitude"] = round(max(all_amps), 1) if all_amps else None
        except Exception:
            item["peak_count"] = None
            item["freq_range"] = None
            item["max_amplitude"] = None
        result.append(item)
    return JSONResponse(result)


@app.get("/analyses/{analysis_id}")
def get_analysis(analysis_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> JSONResponse:
    analysis = db.get(Analysis, analysis_id)
    if not analysis or analysis.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Analise nao encontrada")
    return JSONResponse({
        "id": analysis.id, "filename": analysis.filename,
        "params_json": analysis.params_json, "results_json": analysis.results_json,
        "ai_insights": analysis.ai_insights, "emission_type": analysis.emission_type,
        "project_id": analysis.project_id, "s3_key": analysis.s3_key,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
    })


@app.delete("/analyses/{analysis_id}")
def delete_analysis(analysis_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> JSONResponse:
    analysis = db.get(Analysis, analysis_id)
    if not analysis or analysis.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Analise nao encontrada")
    db.delete(analysis)
    db.commit()
    return JSONResponse({"message": "Analise removida"})


@app.post("/analyses/{analysis_id}/reprocess")
async def reprocess_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Re-run AI analysis on an existing report. Updates ai_insights in DB."""
    analysis = db.get(Analysis, analysis_id)
    if not analysis or analysis.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Analise nao encontrada")
    import json as _json
    try:
        series = _json.loads(analysis.results_json) if analysis.results_json else []
    except Exception:
        series = []
    comparison = _compare_revisions(series) if len(series) > 1 else None
    ai_data = _build_ai_data(series, comparison)
    ai_insights = await ai_provider.analyze(ai_data)
    analysis.ai_insights = ai_insights
    if series:
        analysis.emission_type = series[0].get("emission_type")
    db.commit()
    db.refresh(analysis)
    return JSONResponse({
        "id": analysis.id,
        "ai_insights": ai_insights,
        "emission_type": analysis.emission_type,
        "message": "Reprocessado com sucesso",
    })


# ─── Project CRUD ───────────────────────────────────────────────────
@app.post("/projects")
def create_project(payload: ProjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> JSONResponse:
    project = Project(user_id=current_user.id, name=payload.name, description=payload.description)
    db.add(project)
    db.commit()
    db.refresh(project)
    return JSONResponse({"id": project.id, "message": "Projeto criado"})


@app.get("/projects")
def list_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> JSONResponse:
    rows = db.execute(select(Project).where(Project.user_id == current_user.id).order_by(Project.created_at.desc())).scalars().all()
    result = []
    for p in rows:
        count = db.execute(select(Analysis.id).where(Analysis.project_id == p.id)).scalars().all()
        result.append({
            "id": p.id, "name": p.name, "description": p.description,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "analysis_count": len(count),
        })
    return JSONResponse(result)


@app.get("/projects/{project_id}")
def get_project(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> JSONResponse:
    project = db.get(Project, project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Projeto nao encontrado")
    analyses = db.execute(select(Analysis).where(Analysis.project_id == project.id).order_by(Analysis.created_at.desc())).scalars().all()
    return JSONResponse({
        "id": project.id, "name": project.name, "description": project.description,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "analyses": [{
            "id": a.id, "filename": a.filename, "emission_type": a.emission_type,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        } for a in analyses],
    })


@app.delete("/projects/{project_id}")
def delete_project(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> JSONResponse:
    project = db.get(Project, project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Projeto nao encontrado")
    db.delete(project)
    db.commit()
    return JSONResponse({"message": "Projeto removido"})


# ─── Image Upload Endpoint ──────────────────────────────────────────
@app.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    impedance: float = Query(50.0, description="Impedância do sistema em Ohms (50 ou 75)"),
    trace: str = Query("auto", description="Trace: auto, PkMax, AvMax, Clrw, MinHold"),
    smoothing: Optional[str] = None,
    smoothing_window: Optional[int] = None,
    peak_min_height: Optional[float] = None,
    peak_min_distance: Optional[int] = None,
    max_peaks: int = 200,
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Upload a spectrum analyzer screenshot (PNG/JPG/BMP) and extract trace data.
    Supports R&S EMC32 and similar displays.
    Automatically converts dBm → dBµV using the specified impedance.
    """
    _ = current_user
    filename = file.filename or "screenshot"
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext not in {"png", "jpg", "jpeg", "bmp", "tiff", "tif"}:
        raise HTTPException(status_code=400, detail="Formato não suportado. Use PNG, JPG ou BMP.")

    image_bytes = await file.read()
    if len(image_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Imagem muito grande (máx 20 MB).")

    try:
        parsed = parse_spectrum_image(image_bytes)
    except ImageParseError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Image parse error: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar imagem: {e}")

    metadata = parsed["metadata"]
    traces   = parsed["traces"]

    # Select trace
    if trace == "auto":
        selected = parsed["primary_trace"]
    else:
        selected = next((t for t in traces if t["name"] == trace), parsed["primary_trace"])

    freq_arr = selected["frequency"]
    amp_arr  = selected["intensity"]
    unit     = metadata.get("unit", "dBm")

    # Convert dBm → dBµV
    converted = False
    if "dBm" in unit:
        amp_arr = convert_dbm_to_dbuv(amp_arr, impedance_ohm=impedance)
        unit = "dBµV"
        converted = True

    # Build synthetic CSV and process normally
    csv_lines = ["freq_mhz,amplitude_dbuv"] + [f"{f},{a}" for f, a in zip(freq_arr, amp_arr)]
    csv_bytes = "\n".join(csv_lines).encode()

    payload = _process_series(
        csv_bytes, filename,
        smoothing, smoothing_window,
        peak_min_height, peak_min_distance, max_peaks,
    )

    payload["image_metadata"] = {
        **metadata,
        "unit_original": metadata.get("unit", "dBm"),
        "unit_processed": unit,
        "converted_to_dbuv": converted,
        "impedance_ohm": impedance,
        "trace_used": selected["name"],
        "traces_available": [t["name"] for t in traces],
        "detector_assumed": selected.get("detector", "pk"),
    }

    ai_data = _build_ai_data([payload])
    ai_data["image_metadata"] = payload["image_metadata"]
    payload["ai_insights"] = await ai_provider.analyze(ai_data)

    return JSONResponse(payload)


# ─── Demo Endpoint ──────────────────────────────────────────────────
@app.get("/demo")
def demo() -> JSONResponse:
    """Returns pre-processed sample data for demo mode (no auth required)."""
    import os
    samples_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "samples")
    sample_file = os.path.join(samples_dir, "sample_re310_full_x.csv")
    if not os.path.exists(sample_file):
        return JSONResponse({"series": [], "message": "Dados de exemplo não disponíveis"})
    with open(sample_file, "rb") as f:
        file_bytes = f.read()
    try:
        series_data = _process_series(file_bytes, "demo_sample.csv", "moving", 5, None, None, 100)
        return JSONResponse({"series": [series_data], "ai_insights": None, "demo": True})
    except Exception:
        return JSONResponse({"series": [], "message": "Falha ao processar dados de exemplo"})
