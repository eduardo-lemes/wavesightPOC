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
- Exportacao de imagem configuravel (resolucao/tema)
- Stack dockerizada completa (`frontend + api + postgres`)
- Autenticacao com usuario/senha (cadastro, login, token JWT)
- Persistencia de usuarios no Postgres
- Endpoints de processamento protegidos por autenticacao

## PROXIMOS PASSOS (curto prazo)
- Integrar tabelas oficiais licenciadas (CISPR/IEC)
- Validacao automatica por norma (pass/fail por faixa)
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
