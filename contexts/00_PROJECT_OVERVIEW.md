# Projeto - Visão Geral

## Nome
- WaveSight EMC POC

## Problema que resolve
- Recebe CSV de medição EMC (frequência x intensidade) e transforma em análise visual e técnica.
- Reduz leitura manual de gráficos brutos.
- Ajuda pré-compliance e priorização de correções.

## Público alvo
- Engenharia elétrica/EMC
- Times de validação e qualidade
- Gestores técnicos que precisam de relatório claro

## Stack
- Backend: FastAPI (`api/main.py`)
- Frontend: HTML/JS + Plotly (`frontend/index.html`)
- Banco: Postgres (Docker), fallback SQLite local
- Orquestração local: Docker Compose (`docker-compose.yml`)

## Escopo atual
- Login/cadastro de usuários
- Upload de CSV(s) com seleção por eixo (X/Y/Z)
- Processamento de espectro (suavização, picos, padrões)
- Comparação entre medições
- Curvas de limite (CSV/preset/norma JSON)
- Relatório HTML/PDF (incluindo formato JLR RE310)
- Contrato de entrada documentado (`INPUT_CONTRACT.md`)

## Fora de escopo atual
- Multiempresa/multi-tenant
- Tabelas normativas oficiais completas/licenciadas
- Motor normativo formal com audit trail completo
- FFT para dados no domínio do tempo
- Testes automatizados
