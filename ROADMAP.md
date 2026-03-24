# Roadmap - WaveSight EMC POC

## FEITO
- Backend FastAPI com endpoints `/upload` e `/upload-multi`
- Upload de CSV com leitura flexivel de delimitador e cabecalho opcional
- Processamento basico: estatisticas (min, max, media, desvio)
- Deteccao de picos configuravel (limiar e distancia)
- Suavizacao configuravel (media movel, Savitzky-Golay)
- Frontend com Plotly para grafico 2D com overlay e picos destacados
- Visualizacao 3D (linhas e superficie com interpolacao)
- Curvas de limite por CSV, preset e norma/classe/faixa
- Import de normas via JSON no frontend
- Comparacao automatica entre medicoes (baseline, delta, RMS)
- Relatorio HTML e impressao PDF
- Relatorio no formato JLR RE310 (Tabela 7-2) com avaliacao automatica por banda (PASS/FAIL, margem, excedencias e top picos) a partir do CSV
- Upload de ate 3 CSVs por eixos (X/Y/Z) no frontend (pior caso por banda no relatorio)
- Exportacao de imagem configuravel (resolucao/tema)
- Stack dockerizada completa (`frontend + api + postgres`)
- Autenticacao com usuario/senha (cadastro, login, token JWT)
- Persistencia de usuarios no Postgres
- Endpoints de processamento protegidos por autenticacao
- CSVs de exemplo (eixos X/Y/Z) cobrindo ate ~6 GHz (`samples/sample_re310_full_x.csv`, `samples/sample_re310_full_y.csv`, `samples/sample_re310_full_z.csv`)

## PROXIMOS PASSOS (curto prazo)
- Integrar tabelas oficiais licenciadas (CISPR/IEC)
- Validacao automatica por norma (pass/fail por faixa)
- Selecao de padrao/norma no UI (ex.: RE310, CISPR etc.) e nao apenas presets embutidos
- Suporte a multiplos detectores (PK/AV/QP) por medicao/banda (ex.: upload 1 arquivo por detector ou metadados no input)
- Definir controle de acesso por papel (admin/analista)
- Persistir historico de execucoes e relatorios por usuario

## EVOLUCOES (medio prazo)
- Transformada de Fourier/FFT para dados no dominio do tempo
- Deteccao de anomalias e clustering de padroes
- Auto-rotulagem de picos (harmonicos vs ruido de chaveamento)
- Alinhamento e calibracao entre instrumentos

## ESTRUTURA (longo prazo)
- Processamento em background (fila de jobs)
- Gestao de projetos e compartilhamento entre usuarios
- Trilha de auditoria normativa
- Pipeline de QA para validacao de dados e alertas
