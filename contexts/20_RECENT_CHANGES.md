# Mudancas Recentes

## Ultimo bloco implementado
- Dockerizacao completa do ambiente local:
- `db` Postgres em container
- `api` FastAPI em container
- `frontend` servido por nginx em container
- Proxy frontend -> backend via `/api`
- Inclusao de autenticacao e usuarios:
- cadastro (`/auth/register`)
- login (`/auth/login`)
- sessao atual (`/auth/me`)
- persistencia da tabela `users` no Postgres
- protecao dos endpoints `/upload` e `/upload-multi` com JWT
- Frontend atualizado com tela de login/cadastro/logout
- Refino de UX de autenticacao no frontend:
- login/cadastro em card dedicado (overlay)
- app bloqueado visualmente ate autenticacao
- cabecalho com sessao limpa apos login
- Ajustes de documentacao para novo fluxo dockerizado

## Novos artefatos
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

## Arquivos atualizados
- `api/main.py`
- `api/requirements.txt`
- `frontend/index.html`
- `README.md`
- `ROADMAP.md`
- `PROJECT_CONTEXT.md`

## Observacao importante
- Segredo JWT em `docker-compose.yml` esta em modo desenvolvimento.
- Para uso real, trocar por segredo forte e gerenciado por ambiente seguro.
