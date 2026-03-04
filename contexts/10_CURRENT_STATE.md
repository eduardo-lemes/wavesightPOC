# Estado Atual (Snapshot)

## Infra e Execucao
- Stack principal dockerizada com `docker-compose.yml`:
- `frontend` (nginx, porta 8080)
- `api` (FastAPI, porta 8000)
- `db` (Postgres 16, volume persistente)
- Frontend usa proxy `/api` para backend

## Backend
- Endpoints de autenticacao:
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- Persistencia de usuarios no Postgres (`users`)
- Endpoints de processamento protegidos por JWT Bearer:
- `POST /upload`
- `POST /upload-multi`
- Mantido processamento EMC existente:
- leitura CSV com delimitador flexivel
- suavizacao: `none`, `moving`, `savgol`
- deteccao de picos configuravel
- deteccao de padroes (harmonicos e espacamento)

## Frontend
- Tela dedicada de autenticacao (overlay) com login/cadastro
- Header com sessao do usuario logado e botao de logout
- Token JWT salvo em `localStorage`
- Upload/processamento habilitado apenas para usuario autenticado
- Recursos anteriores mantidos:
- overlay 2D e 3D
- baseline e comparacao automatica
- filtro de faixa
- segmentacao por bandas
- curva limite por CSV/preset/norma
- import JSON de normas
- exportacao de imagem
- relatorio HTML/PDF

## Arquivos de referencia
- Contexto geral: `PROJECT_CONTEXT.md`
- Contrato de entrada: `INPUT_CONTRACT.md`
- Roadmap: `ROADMAP.md`
- Normas exemplo: `samples/norms_example.json`

## Lacunas atuais
- Sem classificacao oficial validada por tabelas licenciadas
- FFT (dominio do tempo) ainda nao implementada
- Sem historico persistente de analises por usuario
