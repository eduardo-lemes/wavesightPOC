# WaveSight EMC POC

POC para upload de CSV (frequência x intensidade em dBµV), processamento em Python e visualização 2D/3D no navegador.

## Estrutura
- `api/` — Backend FastAPI (Python)
- `frontend/` — HTML/JS com Plotly (servido por nginx)
- `contexts/` — Context pack para continuidade entre chats/IAs
- `scripts/` — Scripts PowerShell auxiliares
- `samples/` — CSVs de exemplo e normas JSON
- `docker-compose.yml` — Stack dockerizada (`frontend + api + postgres`)
- `INPUT_CONTRACT.md` — Contrato de entrada v1 (campos obrigatórios/opcionais)

## Rodando com Docker (recomendado)
```bash
# Clone e entre no diretório do projeto
docker compose up --build
```

Acessos:
- Frontend: `http://localhost:8080`
- API (direto): `http://localhost:8000`
- API via frontend proxy: `http://localhost:8080/api`
- Health check: `GET http://localhost:8000/health`

Parar stack:
```bash
docker compose down
```

Resetar também o volume do banco:
```bash
docker compose down -v
```

## Autenticação
O uso do processamento exige login.

Endpoints:
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

Payloads:
```json
{
  "name": "Seu Nome",
  "email": "voce@empresa.com",
  "password": "senha-com-8-ou-mais"
}
```

```json
{
  "email": "voce@empresa.com",
  "password": "senha-com-8-ou-mais"
}
```

Resposta (register/login):
```json
{
  "access_token": "...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Seu Nome",
    "email": "voce@empresa.com",
    "is_active": true
  }
}
```

## Recursos no frontend
- Login e cadastro de usuários
- Upload múltiplo de CSV e overlay das medições
- Seleção explícita de até 3 arquivos por eixos (X/Y/Z)
- Curva de referência (limite) via CSV, presets e normas (exemplo)
- Presets e filtros de faixa
- Relatório HTML/PDF
- Relatório no formato JLR RE310 (Tabela 7-2) com avaliação automática por banda (PASS/FAIL)
- 3D em linhas ou superfície (waterfall)
- Comparação automática entre medições
- Exportação de imagem com resolução/tema

## Endpoints de processamento
- `POST /upload` (um CSV) — protegido por token
- `POST /upload-multi` (vários CSVs) — protegido por token

Parâmetros (query):
- `smoothing`: `none` | `moving` | `savgol`
- `smoothing_window`: tamanho da janela
- `peak_min_height`: limiar mínimo do pico
- `peak_min_distance`: distância mínima entre picos (em amostras)
- `max_peaks`: máximo de picos retornados

## Formato do CSV
- Duas colunas: frequência e intensidade (dBµV)
- Cabeçalho opcional
- Delimitador automático (vírgula, ponto e vírgula, tab)
- Curva de limite usa o mesmo formato (freq, limite)

## Normas (JSON)
Você pode carregar tabelas de normas via `Norma JSON` no frontend.

Estrutura esperada (exemplo simplificado):
```json
{
  "cispr32": {
    "label": "CISPR 32",
    "classes": {
      "A": {
        "label": "Classe A",
        "bands": [
          { "label": "0-300", "min": 0, "max": 300, "points": [[0, 30], [300, 24]] }
        ]
      }
    }
  }
}
```

Obs: os presets embutidos são apenas exemplos. Para tabelas oficiais, carregue JSON licenciado.
Exemplo: `samples/norms_example.json`.

## Desenvolvimento local (sem Docker)
O `Makefile` tem targets `venv`, `install`, `run` e `test-upload` — configurado para Windows.
Para Linux, rode diretamente:
```bash
python -m venv api/.venv
source api/.venv/bin/activate
pip install -r api/requirements.txt
uvicorn api.main:app --reload --port 8000
```
