# WaveSight EMC POC - Contexto de Trabalho

Este arquivo mantém continuidade entre chats.

## Objetivo da POC
- Sistema web para análise EMC.
- Entrada principal: CSV de espectro (frequência x intensidade em dBµV).
- Foco atual: upload, processamento, visualização, comparação, relatório e autenticação.

## Stack
- Backend: Python + FastAPI (`api/main.py`)
- Frontend: HTML/CSS/JS + Plotly (`frontend/index.html`)
- Banco: Postgres (via Docker)
- Infra local: Docker Compose (`docker-compose.yml`)

## Estado atual (implementado)
- Upload de 1 ou vários CSVs (`/upload`, `/upload-multi`)
- Frontend suporta seleção explícita de até 3 arquivos por eixos (X/Y/Z)
- Parsing de CSV com delimitador flexível e cabeçalho opcional
- Estatísticas básicas e detecção de picos
- Suavização configurável (`none`, `moving`, `savgol`)
- Detecção de padrões (harmônicos e espaçamento dominante)
- 2D overlay + 3D (linhas/superfície)
- Curvas de limite (CSV, preset, norma/classe/faixa)
- Import de normas via JSON
- Relatório HTML + impressão PDF
- Relatório no formato JLR RE310 (Tabela 7-2) com avaliação automática por banda a partir do CSV (PASS/FAIL, margem, excedências e top picos)
- Endpoint de health check (`GET /health`)
- Autenticação:
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /auth/me`
  - Persistência de usuários no Postgres
  - Endpoints de processamento exigem token JWT

## Decisões importantes já tomadas
- Banco inicial: Postgres em container Docker (SQLite como fallback local)
- Fluxo inicial de identidade: email + senha + JWT bearer
- Hash de senha usa `pbkdf2_sha256` (passlib)
- FFT segue adiada (decisão ainda aberta de `domain` explícito vs `auto`)
- Presets normativos continuam como exemplo; oficial depende de licença
- No relatório RE310, o PASS/FAIL por banda usa como referência o primeiro detector disponível na ordem: PK -> AV -> QP
- Quando o cliente envia múltiplos arquivos (ex.: eixos X/Y/Z), a avaliação considera o pior caso entre os arquivos na mesma banda
- CORS permissivo (`allow_origins=["*"]`) — aceitável em dev, restringir em produção

## Arquivos principais
- Backend: `api/main.py`
- Models/DB/Auth: `api/models.py`, `api/database.py`, `api/security.py`
- Frontend: `frontend/index.html`
- Assets: `frontend/assets/wavesight-logo.svg` (SVG do wordmark), `logo.png` (logo na raiz)
- Infra Docker: `docker-compose.yml`, `api/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf`
- Contrato de entrada: `INPUT_CONTRACT.md`
- Context pack: `contexts/` (veja `contexts/README.md`)
- Roadmap: `ROADMAP.md`
- Guia de uso: `README.md`
- CSVs de exemplo: `samples/sample_re310_full_{x,y,z}.csv` e outros em `samples/`

## Como rodar
```bash
docker compose up --build
```

Acesse `http://localhost:8080`.

## Pendências prioritárias
- Integrar tabelas oficiais licenciadas (CISPR/IEC)
- Validação normativa formal por faixa/detector
- Persistência do histórico de análises por usuário
- FFT para domínio do tempo
- Criar `.gitignore` (evitar commitar `.db`, `.venv`, `__pycache__`)
- Corrigir logo (nome "WaveInsight" no `logo.png` diverge do produto "WaveSight")
