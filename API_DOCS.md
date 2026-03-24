# WaveSight API — Documentação

**Base URL:** `http://localhost:8000`

## Resumo dos Endpoints

| Método | Endpoint | Auth? | O que faz |
|--------|----------|-------|-----------|
| `GET` | `/health` | ❌ | Verifica se a API está no ar |
| `GET` | `/demo` | ❌ | Retorna dados de exemplo pra testar sem conta |
| `POST` | `/auth/register` | ❌ | Cria conta nova (nome, email, senha) e retorna token |
| `POST` | `/auth/login` | ❌ | Faz login (email, senha) e retorna token |
| `GET` | `/auth/me` | ✅ | Retorna dados do usuário logado |
| `POST` | `/upload` | ✅ | Envia **1 CSV** e retorna: picos, stats, padrões, tipo de emissão |
| `POST` | `/upload-multi` | ✅ | Envia **2+ CSVs**, retorna tudo acima + comparação entre revisões + insights IA (se configurada) |
| `POST` | `/analyze` | ✅ | Envia dados já processados pra IA avaliar (retorna `null` se IA não configurada) |
| `POST` | `/analyses` | ✅ | **Salva** uma análise no banco (pra consultar depois) |
| `GET` | `/analyses` | ✅ | **Lista** análises salvas do usuário (paginado, filtrável por projeto) |
| `GET` | `/analyses/{id}` | ✅ | **Busca** uma análise específica com todos os dados |
| `DELETE` | `/analyses/{id}` | ✅ | **Deleta** uma análise salva |
| `POST` | `/analyses/{id}/reprocess` | ✅ | **Reprocessa** análise com IA (atualiza ai_insights) |
| `POST` | `/projects` | ✅ | **Cria** um projeto/campanha pra agrupar análises |
| `GET` | `/projects` | ✅ | **Lista** projetos do usuário (com contagem de análises) |
| `GET` | `/projects/{id}` | ✅ | **Busca** projeto com lista de análises associadas |
| `DELETE` | `/projects/{id}` | ✅ | **Deleta** projeto e todas análises associadas |

> **Auth?** = precisa do header `Authorization: Bearer <token>`

## Autenticação

Todos os endpoints (exceto `/health`, `/demo`, `/auth/*`) exigem header:
```
Authorization: Bearer <token>
```

### Registrar
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "João", "email": "joao@email.com", "password": "minhasenha123"}'
```
**Resposta:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { "id": 1, "name": "João", "email": "joao@email.com", "is_active": true }
}
```

### Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "joao@email.com", "password": "minhasenha123"}'
```

### Dados do usuário logado
```bash
curl http://localhost:8000/auth/me -H "Authorization: Bearer <token>"
```

---

## Upload & Processamento

### Upload único
```bash
curl -X POST http://localhost:8000/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@meu_scan.csv" \
  -F "smoothing=moving" \
  -F "smoothing_window=5" \
  -F "max_peaks=100"
```
**Resposta:** frequências, intensidades, picos, stats, padrões, tipo de emissão.

### Upload múltiplo (com IA e comparação)
```bash
curl -X POST http://localhost:8000/upload-multi \
  -H "Authorization: Bearer <token>" \
  -F "files=@scan_v1.csv" \
  -F "files=@scan_v2.csv" \
  -F "smoothing=none" \
  -F "max_peaks=200"
```
**Resposta:**
```json
{
  "series": [ { "filename": "...", "peaks": [...], "stats": {...}, "emission_type": "narrowband" } ],
  "ai_insights": "Diagnóstico: harmônicos de 50 MHz..." | null,
  "revision_comparison": {
    "new_emissions": [...],
    "removed_emissions": [...],
    "significant_deltas": [...]
  },
  "report_id": 42
}
```
> `ai_insights` = `null` se IA não configurada. **Nunca bloqueia o processamento.**
>
> `report_id` = ID do relatório salvo automaticamente. Use para consultar depois em `GET /analyses/{id}`.

### Parâmetros de upload

| Parâmetro | Tipo | Default | Descrição |
|-----------|------|---------|-----------|
| `smoothing` | string | `none` | `none`, `moving`, `savgol` |
| `smoothing_window` | int | 5/11 | Tamanho da janela (ímpar p/ savgol) |
| `peak_min_height` | float | — | Altura mínima para detectar pico |
| `peak_min_distance` | int | — | Distância mínima entre picos |
| `max_peaks` | int | 200 | Máximo de picos retornados |

---

## Análises (CRUD)

### Salvar análise
```bash
curl -X POST http://localhost:8000/analyses \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"filename": "scan_x.csv", "results_json": "{...}", "project_id": 1}'
```

### Listar análises
```bash
curl "http://localhost:8000/analyses?limit=20&offset=0" \
  -H "Authorization: Bearer <token>"

# Filtrar por projeto:
curl "http://localhost:8000/analyses?project_id=1" \
  -H "Authorization: Bearer <token>"
```

### Ver análise
```bash
curl http://localhost:8000/analyses/1 -H "Authorization: Bearer <token>"
```

### Deletar análise
```bash
curl -X DELETE http://localhost:8000/analyses/1 -H "Authorization: Bearer <token>"
```

### Reprocessar análise (IA)
```bash
curl -X POST http://localhost:8000/analyses/1/reprocess \
  -H "Authorization: Bearer <token>"
```
**Resposta:**
```json
{
  "id": 1,
  "ai_insights": "Novo diagnóstico..." | null,
  "emission_type": "narrowband",
  "message": "Reprocessado com sucesso"
}
```
> Re-executa a análise de IA nos dados salvos. Útil se IA foi configurada **depois** do upload original.

---

## Projetos (CRUD)

### Criar projeto
```bash
curl -X POST http://localhost:8000/projects \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Campanha RE310", "description": "Testes março 2026"}'
```

### Listar projetos
```bash
curl http://localhost:8000/projects -H "Authorization: Bearer <token>"
```
**Resposta:** lista com `analysis_count` por projeto.

### Ver projeto (com análises)
```bash
curl http://localhost:8000/projects/1 -H "Authorization: Bearer <token>"
```

### Deletar projeto
```bash
curl -X DELETE http://localhost:8000/projects/1 -H "Authorization: Bearer <token>"
```
> Deletar projeto **remove todas as análises** associadas.

---

## IA (opcional)

### Análise standalone
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"data": {"files": ["scan.csv"], "stats": {...}, "peaks": [...]}}'
```
**Resposta:** `{"ai_insights": "..." | null}`

### Configurar IA
No `.env` ou `docker-compose.yml`:
```env
AI_PROVIDER=openai      # openai | anthropic | gemini | none
AI_API_KEY=sk-...        # sua API key
AI_MODEL=gpt-4o-mini    # modelo a usar
```

---

## Outros

### Health check
```bash
curl http://localhost:8000/health
# {"status": "ok"}
```

### Demo (sem autenticação)
```bash
curl http://localhost:8000/demo
```

---

## Rate Limits

| Endpoint | Limite |
|----------|--------|
| `/auth/register` | 3 req/min por IP |
| `/auth/login` | 5 req/min por IP |
| Demais endpoints | Sem limite |

## Swagger automático

FastAPI gera documentação interativa automaticamente:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
