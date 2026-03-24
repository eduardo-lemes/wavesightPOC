# Mudanças Recentes

## Revisão geral do projeto (2026-03-24)
- Revisão completa de todos os arquivos do projeto (docs, backend, frontend, infra)
- Atualização dos docs:
  - `README.md` — reescrito: paths genéricos, seções novas (health, INPUT_CONTRACT, dev local)
  - `PROJECT_CONTEXT.md` — reescrito: assets, context pack, pendências novas
  - `contexts/00_PROJECT_OVERVIEW.md` — escopo atualizado com itens faltantes
  - `contexts/10_CURRENT_STATE.md` — lacunas completas (logo, gitignore, API depreciada, etc.)
  - `contexts/30_OPEN_DECISIONS.md` — 3 novas decisões (logo/branding, frontend monolítico, JWT storage)
  - `contexts/40_GENERAL_INSTRUCTIONS.md` — removida linha PowerShell perdida (Test-Path)
- Gerado relatório completo de revisão com 24 itens categorizados

## Bloco anterior: Dockerização + Autenticação
- Dockerização completa do ambiente local:
  - `db` Postgres em container
  - `api` FastAPI em container
  - `frontend` servido por nginx em container
  - Proxy frontend -> backend via `/api`
- Inclusão de autenticação e usuários:
  - cadastro (`/auth/register`)
  - login (`/auth/login`)
  - sessão atual (`/auth/me`)
  - persistência da tabela `users` no Postgres
  - proteção dos endpoints `/upload` e `/upload-multi` com JWT
- Frontend atualizado com tela de login/cadastro/logout

## Novos artefatos (originais)
- `docker-compose.yml`
- `.env.example`
- `.dockerignore`
- `api/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `api/database.py`
- `api/models.py`
- `api/security.py`
- `api/__init__.py`

## Observação importante
- Segredo JWT em `docker-compose.yml` está em modo desenvolvimento.
- Para uso real, trocar por segredo forte e gerenciado por ambiente seguro.
