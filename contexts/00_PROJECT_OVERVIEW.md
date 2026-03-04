# Projeto - Visao Geral

## Nome
- WaveSight EMC POC

## Problema que resolve
- Recebe CSV de medicao EMC (frequencia x intensidade) e transforma em analise visual e tecnica.
- Reduz leitura manual de graficos brutos.
- Ajuda pre-compliance e priorizacao de correcoes.

## Publico alvo
- Engenharia eletrica/EMC
- Times de validacao e qualidade
- Gestores tecnicos que precisam de relatorio claro

## Stack
- Backend: FastAPI (`api/main.py`)
- Frontend: HTML/JS + Plotly (`frontend/index.html`)
- Banco: Postgres (Docker)
- Orquestracao local: Docker Compose (`docker-compose.yml`)

## Escopo atual
- Login/cadastro de usuarios
- Upload de CSV(s)
- Processamento de espectro
- Comparacao entre medicoes
- Curvas de limite
- Relatorio HTML/PDF

## Fora de escopo atual
- Multiempresa/multi-tenant
- Tabelas normativas oficiais completas/licenciadas
- Motor normativo formal com audit trail completo
