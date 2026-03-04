from __future__ import annotations

import io
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import User
from .security import create_access_token, decode_access_token, hash_password, verify_password

app = FastAPI(title="WaveSight EMC POC")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)


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


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


def _normalize_email(email: str) -> str:
    normalized = (email or "").strip().lower()
    if "@" not in normalized or "." not in normalized:
        raise HTTPException(status_code=400, detail="Email invalido")
    return normalized


def _user_to_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        is_active=user.is_active,
    )


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


@app.post("/auth/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
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
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
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


def _read_csv(file_bytes: bytes) -> pd.DataFrame:
    """
    Read a 2-column CSV (frequency, intensity) with flexible delimiter and optional header.
    """
    try:
        df = pd.read_csv(
            io.BytesIO(file_bytes),
            sep=None,
            engine="python",
            header=None,
            comment="#",
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"CSV invalido: {exc}") from exc

    if df.shape[1] < 2:
        raise HTTPException(status_code=400, detail="CSV deve ter pelo menos 2 colunas (frequencia, intensidade).")

    # Keep first two columns only
    df = df.iloc[:, :2]

    # Try to drop header row if non-numeric
    def _is_number(x: Any) -> bool:
        try:
            float(x)
            return True
        except Exception:
            return False

    if not (_is_number(df.iloc[0, 0]) and _is_number(df.iloc[0, 1])):
        df = df.iloc[1:, :]

    df = df.dropna()

    # Ensure numeric
    df[0] = pd.to_numeric(df[0], errors="coerce")
    df[1] = pd.to_numeric(df[1], errors="coerce")
    df = df.dropna()

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV sem dados numericos validos.")

    df = df.sort_values(by=0)
    df = df.reset_index(drop=True)
    return df


def _find_peaks(
    y: np.ndarray,
    min_height: Optional[float] = None,
    min_distance: Optional[int] = None,
) -> List[int]:
    """
    Find peak indices. Prefer scipy if available, else simple local maxima.
    """
    try:
        from scipy.signal import find_peaks  # type: ignore

        kwargs = {}
        if min_height is not None:
            kwargs["height"] = min_height
        if min_distance is not None and min_distance > 0:
            kwargs["distance"] = min_distance

        peaks, _ = find_peaks(y, **kwargs)
        return peaks.astype(int).tolist()
    except Exception:
        # Simple local maxima
        peaks = []
        for i in range(1, len(y) - 1):
            if y[i] > y[i - 1] and y[i] > y[i + 1]:
                if min_height is None or y[i] >= min_height:
                    peaks.append(i)

        if min_distance is None or min_distance <= 0:
            return peaks

        # Enforce a minimal distance between peaks (simple pass)
        filtered = []
        last_kept = -min_distance
        for idx in peaks:
            if idx - last_kept >= min_distance:
                filtered.append(idx)
                last_kept = idx
        return filtered


def _basic_stats(y: np.ndarray) -> Dict[str, float]:
    return {
        "min": float(np.min(y)),
        "max": float(np.max(y)),
        "mean": float(np.mean(y)),
        "std": float(np.std(y)),
    }


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
        kernel = np.ones(window, dtype=float) / float(window)
        return np.convolve(y, kernel, mode="same")

    if method == "savgol":
        try:
            from scipy.signal import savgol_filter  # type: ignore

            polyorder = 2
            if window <= polyorder:
                window = polyorder + 1
                if window % 2 == 0:
                    window += 1
            return savgol_filter(y, window_length=window, polyorder=polyorder)
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Savitzky-Golay indisponivel: {exc}",
            ) from exc

    return y


def _analyze_patterns(
    freq: np.ndarray,
    inten: np.ndarray,
    peaks_idx: List[int],
    tol_ratio: float = 0.02,
) -> Dict[str, Any]:
    if len(peaks_idx) < 3:
        return {}

    peaks = [
        (float(freq[i]), float(inten[i]))
        for i in peaks_idx
        if i >= 0 and i < len(freq)
    ]
    if len(peaks) < 3:
        return {}

    # Harmonic detection: choose candidate fundamental with most harmonic matches
    candidates = sorted(peaks, key=lambda p: p[1], reverse=True)[:10]
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
            if abs(f - target) <= tol_ratio * target:
                matches.append((n, f, amp))
        if best is None or len(matches) > len(best["matches"]):
            best = {"f0": f0, "matches": matches}

    harmonics = None
    if best and len(best["matches"]) >= 2:
        harmonics = {
            "fundamental": best["f0"],
            "count": len(best["matches"]),
            "matches": [
                {"n": n, "frequency": f, "intensity": amp}
                for n, f, amp in sorted(best["matches"], key=lambda x: x[0])
            ],
        }

    # Switching/comb spacing detection: most common spacing between adjacent peaks
    peaks_sorted = sorted(peaks, key=lambda p: p[0])
    diffs = [peaks_sorted[i + 1][0] - peaks_sorted[i][0] for i in range(len(peaks_sorted) - 1)]
    diffs = [d for d in diffs if d > 0]
    spacing = None
    if len(diffs) >= 3:
        clusters: List[Tuple[float, int]] = []
        for d in diffs:
            placed = False
            for idx, (center, count) in enumerate(clusters):
                if abs(d - center) <= tol_ratio * center:
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


def _process_series(
    file_bytes: bytes,
    filename: str,
    smoothing_method: Optional[str],
    smoothing_window: Optional[int],
    peak_min_height: Optional[float],
    peak_min_distance: Optional[int],
    max_peaks: int,
) -> Dict[str, Any]:
    df = _read_csv(file_bytes)

    freq = df.iloc[:, 0].to_numpy(dtype=float)
    inten = df.iloc[:, 1].to_numpy(dtype=float)

    smoothing = _normalize_smoothing(smoothing_method, smoothing_window)
    if smoothing["method"] != "none":
        inten = _apply_smoothing(inten, smoothing["method"], smoothing["window"])

    peaks_idx = _find_peaks(inten, peak_min_height, peak_min_distance)

    # Keep only top N peaks by intensity to avoid huge payloads
    max_peaks = max(10, int(max_peaks))
    peaks_idx_sorted = sorted(peaks_idx, key=lambda i: inten[i], reverse=True)[:max_peaks]
    peaks_idx_sorted = sorted(peaks_idx_sorted)

    peaks = [
        {"frequency": float(freq[i]), "intensity": float(inten[i])}
        for i in peaks_idx_sorted
    ]

    stats = _basic_stats(inten)
    patterns = _analyze_patterns(freq, inten, peaks_idx_sorted)

    return {
        "filename": filename,
        "count": int(len(freq)),
        "frequency": freq.tolist(),
        "intensity": inten.tolist(),
        "peaks": peaks,
        "stats": stats,
        "patterns": patterns,
        "smoothing": smoothing,
    }


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
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Arquivo deve ser .csv")

    file_bytes = await file.read()
    payload = _process_series(
        file_bytes,
        filename,
        smoothing,
        smoothing_window,
        peak_min_height,
        peak_min_distance,
        max_peaks,
    )
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
        if not filename.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail=f"Arquivo invalido: {filename}")

        file_bytes = await file.read()
        series.append(
            _process_series(
                file_bytes,
                filename,
                smoothing,
                smoothing_window,
                peak_min_height,
                peak_min_distance,
                max_peaks,
            )
        )

    payload = {
        "series": series,
        "smoothing": _normalize_smoothing(smoothing, smoothing_window),
        "peak_params": {
            "min_height": peak_min_height,
            "min_distance": peak_min_distance,
            "max_peaks": max_peaks,
        },
    }
    return JSONResponse(payload)
