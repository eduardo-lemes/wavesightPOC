# Estado Atual (Snapshot)

## Infra e Execução
- Stack principal dockerizada com `docker-compose.yml`:
  - `frontend` (nginx, porta 8080)
  - `api` (FastAPI, porta 8000)
  - `db` (Postgres 16, volume persistente)
- Frontend usa proxy `/api` para backend
- Fallback de banco para SQLite local (`wavesight.db`) quando `DATABASE_URL` não definida

## Backend
- Endpoints de autenticação:
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /auth/me`
- Health check: `GET /health`
- Persistência de usuários no Postgres (`users`)
- Hash de senha com `pbkdf2_sha256` (passlib)
- Endpoints de processamento protegidos por JWT Bearer:
  - `POST /upload`
  - `POST /upload-multi`
- Processamento EMC:
  - Leitura CSV com delimitador flexível
  - Suavização: `none`, `moving`, `savgol`
  - Detecção de picos configurável
  - Detecção de padrões (harmônicos e espaçamento)

## Frontend
- Tela dedicada de autenticação (overlay) com login/cadastro
- Header com sessão do usuário logado e botão de logout
- Token JWT salvo em `localStorage`
- Upload/processamento habilitado apenas para usuário autenticado
- Upload múltiplo + seleção por eixo (X/Y/Z)
- Overlay 2D e 3D (linhas/superfície)
- Baseline e comparação automática
- Filtro de faixa e segmentação por bandas
- Curva limite por CSV/preset/norma
- Import JSON de normas
- Exportação de imagem (resolução/tema)
- Relatório HTML/PDF
- Relatório JLR RE310 (PASS/FAIL por banda)

## Assets
- `logo.png` (raiz) — logo 2000×2000, diz "WaveInsight" (nome diverge do produto)
- `frontend/assets/wavesight-logo.svg` — wordmark SVG "WaveSight" (980×280, não utilizado)

## Arquivos de referência
- Contexto geral: `PROJECT_CONTEXT.md`
- Contrato de entrada: `INPUT_CONTRACT.md`
- Roadmap: `ROADMAP.md`
- Normas exemplo: `samples/norms_example.json`
- Context pack: `contexts/README.md`

## Lacunas atuais
- Logo `logo.png` com nome errado ("WaveInsight" em vez de "WaveSight")
- Logo com tamanho bugado (quadrado forçado em container retangular)
- SVG correto existe mas não é usado no HTML
- Sem `.gitignore` (`.db`, `__pycache__`, `.venv` podem ser commitados)
- `wavesight.db` na raiz do repo (resíduo de dev local)
- Pasta `api/api/` contém apenas `.venv` (provável resíduo)
- `@app.on_event("startup")` depreciado no FastAPI
- Frontend monolítico (4681 linhas em um único HTML)
- Sem rate limiting nos endpoints de auth
- Sem testes automatizados
- Sem classificação oficial validada por tabelas licenciadas
- FFT (domínio do tempo) ainda não implementada
- Sem histórico persistente de análises por usuário
