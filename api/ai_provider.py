"""
AI Provider — adapter pattern for LLM integration.

Supports: openai | anthropic | gemini | none
If AI_API_KEY is not set or provider is 'none', returns None (never blocks).
"""
import json
import logging
import os

import httpx

logger = logging.getLogger(__name__)

AI_PROVIDER = os.getenv("AI_PROVIDER", "none")
AI_API_KEY = os.getenv("AI_API_KEY", "")
AI_MODEL = os.getenv("AI_MODEL", "gpt-4o-mini")
AI_TIMEOUT = int(os.getenv("AI_TIMEOUT", "30"))

SYSTEM_PROMPT = """Você é um engenheiro EMC sênior analisando dados de espectro de emissões
conduzidas e radiadas. Receba os resultados de medição e forneça:

1. DIAGNÓSTICO: Identifique a causa provável das emissões
   - Harmônicos regulares → clock/oscilador (identifique frequência base)
   - Broadband elevado → chaveamento, digital noise
   - Picos isolados → ressonâncias, acoplamento

2. RISCO: Classifique como BAIXO / MÉDIO / ALTO / CRÍTICO

3. AÇÕES RECOMENDADAS: Liste 3-5 ações concretas de mitigação
   - Filtros (tipo, localização)
   - Blindagem
   - Layout/roteamento
   - Componentes

4. CONTEXTO NORMATIVO: Se houver dados de compliance, comente sobre
   margens e bandas críticas.

Responda em português. Seja técnico mas acessível. Use bullet points.
Mantenha a resposta em no máximo 400 palavras."""


def _is_configured() -> bool:
    return AI_PROVIDER != "none" and bool(AI_API_KEY)


def build_emc_prompt(data: dict) -> str:
    """Convert analysis results dict into a structured text prompt."""
    lines = ["Resultados da análise EMC:"]

    if "files" in data:
        lines.append(f"Arquivos: {', '.join(data['files'])}")

    if "stats" in data:
        for fname, s in data["stats"].items():
            lines.append(f"\n{fname}: min={s.get('min'):.1f} max={s.get('max'):.1f} média={s.get('mean'):.1f} desvio={s.get('std'):.1f} ({s.get('samples', '?')} amostras)")

    if "peaks" in data and data["peaks"]:
        lines.append("\nTop picos:")
        for p in data["peaks"][:15]:
            lines.append(f"  {p.get('freq_mhz', '?'):.2f} MHz → {p.get('intensity_dbuv', '?'):.1f} dBµV")

    if "patterns" in data:
        pat = data["patterns"]
        if pat.get("harmonics"):
            h = pat["harmonics"]
            lines.append(f"\nHarmônicos: fundamental {h.get('fundamental_mhz', '?')} MHz, {h.get('count', '?')} harmônicos detectados")
        if pat.get("spacing"):
            s = pat["spacing"]
            lines.append(f"Espaçamento dominante: Δ {s.get('delta_mhz', '?')} MHz, {s.get('count', '?')} ocorrências")

    if "emission_type" in data:
        lines.append(f"\nTipo de emissão classificado: {data['emission_type']}")

    if "compliance" in data:
        c = data["compliance"]
        lines.append(f"\nCompliance: {c.get('status', 'N/A')}")
        if c.get("exceedances"):
            lines.append(f"  Excedências: {c['exceedances']}")
        if c.get("worst_margin_db") is not None:
            lines.append(f"  Pior margem: {c['worst_margin_db']:.1f} dB")
        if c.get("worst_band"):
            lines.append(f"  Banda crítica: {c['worst_band']}")

    if "revision_comparison" in data and data["revision_comparison"]:
        rc = data["revision_comparison"]
        lines.append("\nComparação entre revisões:")
        if rc.get("new_emissions"):
            lines.append(f"  Novas emissões: {len(rc['new_emissions'])}")
        if rc.get("removed_emissions"):
            lines.append(f"  Emissões removidas: {len(rc['removed_emissions'])}")
        if rc.get("significant_deltas"):
            lines.append(f"  Deltas significativos (>6dB): {len(rc['significant_deltas'])}")

    return "\n".join(lines)


async def analyze(analysis_data: dict) -> str | None:
    """
    Call AI provider. Returns insight text or None.
    NEVER raises — always returns gracefully.
    """
    if not _is_configured():
        return None

    try:
        prompt = build_emc_prompt(analysis_data)

        if AI_PROVIDER == "openai":
            return await _call_openai(prompt)
        elif AI_PROVIDER == "anthropic":
            return await _call_anthropic(prompt)
        elif AI_PROVIDER == "gemini":
            return await _call_gemini(prompt)
        else:
            logger.warning(f"Unknown AI_PROVIDER: {AI_PROVIDER}")
            return None

    except Exception:
        logger.exception("AI analysis failed — continuing without AI insights")
        return None


async def _call_openai(user_prompt: str) -> str:
    async with httpx.AsyncClient(timeout=AI_TIMEOUT) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {AI_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": AI_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                "max_tokens": 1200,
                "temperature": 0.3,
            },
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


async def _call_anthropic(user_prompt: str) -> str:
    async with httpx.AsyncClient(timeout=AI_TIMEOUT) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": AI_API_KEY,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json={
                "model": AI_MODEL or "claude-3-5-haiku-latest",
                "max_tokens": 1200,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": user_prompt}],
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["content"][0]["text"]


async def _call_gemini(user_prompt: str) -> str:
    model = AI_MODEL or "gemini-2.0-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={AI_API_KEY}"
    async with httpx.AsyncClient(timeout=AI_TIMEOUT) as client:
        resp = await client.post(
            url,
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": f"{SYSTEM_PROMPT}\n\n{user_prompt}"}]}],
                "generationConfig": {"maxOutputTokens": 1200, "temperature": 0.3},
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
