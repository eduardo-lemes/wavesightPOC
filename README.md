# WaveSight EMC POC

POC para upload de CSV (frequencia x intensidade em dBuV), processamento em Python e visualizacao 2D/3D no navegador.

## Estrutura
- `api/` Backend FastAPI
- `frontend/` HTML/JS com Plotly
- `scripts/` Scripts PowerShell
- `docker-compose.yml` Stack dockerizada (`frontend + api + postgres`)

## Rodando com Docker (recomendado)
```powershell
cd c:\Users\eduardo\Documents\wavesight
# opcional: Copy-Item .env.example .env
docker compose up --build
```

Acessos:
- Frontend: `http://localhost:8080`
- API (direto): `http://localhost:8000`
- API via frontend proxy: `http://localhost:8080/api`

Parar stack:
```powershell
docker compose down
```

Resetar tambem o volume do banco:
```powershell
docker compose down -v
```

## Autenticacao
Agora o uso do processamento exige login.

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
- Login e cadastro de usuarios
- Upload multiplo de CSV e overlay das medicoes
- Curva de referencia (limite) via CSV, presets e normas (exemplo)
- Presets e filtros de faixa
- Relatorio HTML/PDF
- 3D em linhas ou superficie (waterfall)
- Comparacao automatica entre medicoes
- Exportacao de imagem com resolucao/tema

## Endpoints de processamento
- `POST /upload` (um CSV) - protegido por token
- `POST /upload-multi` (varios CSVs) - protegido por token

Parametros (query):
- `smoothing`: `none` | `moving` | `savgol`
- `smoothing_window`: tamanho da janela
- `peak_min_height`: limiar minimo do pico
- `peak_min_distance`: distancia minima entre picos (em amostras)
- `max_peaks`: maximo de picos retornados

## Formato do CSV
- Duas colunas: frequencia e intensidade (dBuV)
- Cabecalho opcional
- Delimitador automatico (virgula, ponto e virgula, tab)
- Curva de limite usa o mesmo formato (freq, limite)

## Normas (JSON)
Voce pode carregar tabelas de normas via `Norma JSON` no frontend.

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

Obs: os presets embutidos sao apenas exemplos. Para tabelas oficiais, carregue JSON licenciado.
Exemplo: `samples/norms_example.json`.
