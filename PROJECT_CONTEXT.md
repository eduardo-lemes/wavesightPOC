# WaveSight EMC POC - Contexto de Trabalho

Este arquivo mantém continuidade entre chats.

## Objetivo da POC
- Sistema web para analise EMC.
- Entrada principal: CSV de espectro (frequencia x intensidade em dBuV).
- Foco atual: upload, processamento, visualizacao, comparacao, relatorio e autenticacao.

## Stack
- Backend: Python + FastAPI (`api/main.py`)
- Frontend: HTML/CSS/JS + Plotly (`frontend/index.html`)
- Banco: Postgres (via Docker)
- Infra local: Docker Compose (`docker-compose.yml`)

## Estado atual (implementado)
- Upload de 1 ou varios CSVs (`/upload`, `/upload-multi`)
- Parsing de CSV com delimitador flexivel e cabecalho opcional
- Estatisticas basicas e deteccao de picos
- Suavizacao configuravel (`none`, `moving`, `savgol`)
- Deteccao de padroes (harmonicos e espacamento dominante)
- 2D overlay + 3D (linhas/superficie)
- Curvas de limite (CSV, preset, norma/classe/faixa)
- Import de normas via JSON
- Relatorio HTML + impressao PDF
- Autenticacao:
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- Persistencia de usuarios no Postgres
- Endpoints de processamento exigem token JWT

## Decisoes importantes ja tomadas
- Banco inicial: Postgres em container Docker
- Fluxo inicial de identidade: email + senha + JWT bearer
- FFT segue adiada (decisao ainda aberta de `domain` explicito vs `auto`)
- Presets normativos continuam como exemplo; oficial depende de licenca

## Arquivos principais
- Backend: `api/main.py`
- Models/DB/Auth: `api/models.py`, `api/database.py`, `api/security.py`
- Frontend: `frontend/index.html`
- Infra Docker: `docker-compose.yml`, `api/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf`
- Roadmap: `ROADMAP.md`
- Guia de uso: `README.md`

## Como rodar
```powershell
cd c:\Users\eduardo\Documents\wavesight
docker compose up --build
```

Acesse `http://localhost:8080`.

## Pendencias prioritarias
- Integrar tabelas oficiais licenciadas (CISPR/IEC)
- Validacao normativa formal por faixa/detector
- Persistencia do historico de analises por usuario
- FFT para dominio do tempo
