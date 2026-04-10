# WaveSight EMC — Análise Técnica & Roadmap de Comercialização

**Data:** 2026-04-09 | **Atualizado:** 2026-04-10  
**Posicionamento:** Ferramenta de pre-compliance — preparação para certificação, não certificação em si.  
**Objetivo:** Mapear o estado técnico atual, identificar gaps, e definir um roadmap priorizado para preparar o produto para precificação e venda.

---

## 1. Estado técnico atual — Inventário

### Backend (FastAPI + Python 3.12)
| Componente | Status | Notas |
|---|---|---|
| Auth (register/login/me/logout) | ✅ Funcional | JWT httpOnly cookie + Bearer header, rate limit em auth |
| Upload CSV (single/multi) | ✅ Funcional | Delimitador flexível, header opcional |
| Upload DFL (R&S) | ✅ Funcional | Parser OLE com detecção de trace |
| Upload imagem (screenshot) | ✅ Funcional | OCR + extração de trace por cor |
| Processamento (peaks, stats, smoothing) | ✅ Funcional | scipy.signal.find_peaks, savgol/moving |
| Classificação de emissão | ✅ Funcional | narrowband/broadband/mixed/indeterminate |
| Detecção de padrões (harmônicos) | ✅ Funcional | GCD de frequências, espaçamento |
| Comparação entre revisões | ✅ Funcional | new/removed/significant_deltas |
| CRUD Projetos | ✅ Funcional | Create/list/get/delete |
| CRUD Análises | ✅ Funcional | Save/list/get/delete + filtro por projeto |
| Reprocessamento IA | ✅ Funcional | Re-executa IA em dados salvos |
| IA (OpenAI/Anthropic/Gemini) | ✅ Funcional | Adapter pattern, nunca bloqueia |
| Storage S3 | ✅ Funcional | Fallback gracioso se não configurado |
| Migrations (Alembic) | ✅ Funcional | Migration inicial gerada (users, projects, analyses) |
| Logging estruturado | ✅ Funcional | structlog configurado (JSON em prod, console em dev) |
| Rate limiting | ✅ Funcional | Auth + uploads (30/min single, 20/min multi e image) |
| Healthcheck | ✅ Completo | Verifica DB, IA, S3, versão, uptime |

### Frontend (React 18 + Vite + Tailwind)
| Componente | Status | Notas |
|---|---|---|
| Auth overlay (login/register) | ✅ Funcional | |
| Dashboard com stats | ✅ Funcional | Contagem de projetos/análises |
| Upload wizard (3 steps) | ✅ Funcional | Drag-and-drop, CSV/DFL/imagem |
| Gráfico 2D (Plotly) | ✅ Funcional | Overlay, picos, bandas, limites, harmônicos |
| Gráfico 3D | ✅ Funcional | Scatter3D / surface colorida |
| Margem ao limite | ✅ Funcional | Gráfico de margem com fill |
| Waterfall (heatmap) | ✅ Funcional | Multi-série |
| Histograma | ✅ Funcional | Distribuição de amplitudes |
| Tabela RE310 | ✅ Funcional | PASS/FAIL por banda, margens, top picos |
| Relatório HTML | ✅ Funcional | Capa + RE310 + resumo + gráfico |
| Relatório PDF | ✅ Nativo | WeasyPrint no backend — capa, RE310, picos, IA, disclaimer pre-compliance |
| Projetos CRUD | ✅ Funcional | Criar/listar/deletar |
| Relatórios CRUD | ✅ Funcional | Listar/buscar/deletar |
| Settings | ✅ Funcional | Perfil + info do sistema |
| Presets de parâmetros | ✅ Funcional | lowband/highband/aggressive/manual |
| Presets de limite | ✅ Funcional | 12 normas: CISPR 25 (Classes 1-5), CISPR 32 (A/B), FCC Part 15 (A/B), IEC 61000-6-3/6-4 |
| Seleção de norma no wizard | ✅ Funcional | 13 opções com cards visuais + disclaimer pre-compliance |
| Associação upload→projeto | ✅ Funcional | Dropdown no wizard + criar novo inline |
| Dashboard KPIs reais | ❌ Falta | Só mostra contagem |

### Infra & DevOps
| Componente | Status | Notas |
|---|---|---|
| Docker Compose (dev) | ✅ Funcional | api + frontend + postgres |
| Dockerfile API | ✅ Funcional | Python 3.12-slim + tesseract |
| Dockerfile Frontend | ✅ Funcional | Build React + nginx |
| Nginx proxy | ✅ Funcional | Gzip, cache, proxy /api |
| CI (GitHub Actions) | ✅ Funcional | Lint (ruff) + tests + docker build |
| .gitignore | ✅ Funcional | Cobre .env, .db, __pycache__, node_modules |
| Docker Compose (prod) | ✅ Funcional | restart, resource limits, healthchecks, .env.prod.example |
| CD (deploy automático) | ❌ Falta | |
| SSL/HTTPS | ❌ Falta | |
| Monitoramento | ❌ Falta | |
| Backup automatizado | ❌ Falta | |

### Testes
| Componente | Status | Notas |
|---|---|---|
| test_auth (10 testes) | ✅ | Register, login, validações, me |
| test_upload (8 testes) | ✅ | CSV ok/inválido, multi, health expandido, demo |
| test_crud (11 testes) | ✅ | Projetos, análises, filtros |
| test_processing (9 testes) | ✅ | Stats, peaks, smoothing, patterns, classify (com freq) |
| Testes de RE310 | ✅ Funcional | 7 testes: FM/GPS pass/fail, multi-axis, narrowband/broadband |
| Testes de DFL parser | ❌ Falta | |
| Testes de image parser | ❌ Falta | |
| Testes de frontend | ❌ Falta | |

### Segurança
| Item | Status | Risco |
|---|---|---|
| JWT em httpOnly cookie | ✅ | Seguro — cookie httpOnly + secure + sameSite=lax |
| JWT secret hardcoded no .env | ⚠️ | .env.prod.example orienta gerar com openssl rand |
| CORS | ⚠️ | Configurável via env, mas default permissivo |
| Rate limiting global | ✅ | Auth + uploads cobertos |
| Input validation (upload size) | ⚠️ | nginx limita a 10MB, API não valida |
| Password policy | ✅ | Mínimo 8 chars |
| SQL injection | ✅ | SQLAlchemy ORM previne |
| CSRF | ⚠️ | Sem proteção (JWT mitiga parcialmente) |

---

## 2. Problemas técnicos identificados

### Críticos (bloqueiam comercialização)
1. ~~**Sem PDF nativo**~~ ✅ RESOLVIDO — WeasyPrint no backend, endpoint GET /analyses/{id}/pdf
2. ~~**JWT em localStorage**~~ ✅ RESOLVIDO — migrado pra httpOnly cookie
3. ~~**Sem migrations geradas**~~ ✅ RESOLVIDO — migration inicial gerada
4. ~~**Health check incompleto**~~ ✅ RESOLVIDO — verifica DB, S3, IA, versão, uptime
5. **Sem HTTPS** — obrigatório pra qualquer produto web (depende de deploy)

### Importantes (afetam percepção de qualidade)
6. ~~**Upload desconectado de projeto**~~ ✅ RESOLVIDO — dropdown no wizard + criar novo
7. ~~**Sem seleção de norma no wizard**~~ ✅ RESOLVIDO — 13 opções com cards visuais
8. **Dashboard sem KPIs reais** — não mostra valor pro gestor
9. **Sem suporte a múltiplos detectores** — assume tudo como PK
10. ~~**structlog importado mas não configurado**~~ ✅ RESOLVIDO — JSON em prod, console em dev

### Dívidas técnicas (acumulam custo)
11. ~~**Frontend antigo (frontend/) ainda no repo**~~ ✅ RESOLVIDO — arquivado em _archive/
12. **wavesight.db na raiz** — resíduo de dev (está no .gitignore mas pode ter sido commitado antes)
13. ~~**Logo "WaveInsight" vs "WaveSight"**~~ ✅ RESOLVIDO — SVG correto em uso
14. ~~**Sem connection pooling configurado**~~ ✅ RESOLVIDO — pool_size, max_overflow, pool_timeout, pool_recycle
15. **Sem paginação real no frontend** — carrega até 100 análises de uma vez

---

## 3. Roadmap de comercialização

### Fase 0 — Higiene ✅ CONCLUÍDA
> Limpar o que atrapalha antes de construir.

| # | Tarefa | Status |
|---|--------|--------|
| 0.1 | Gerar migration inicial com Alembic | ✅ Feito |
| 0.2 | Configurar structlog no app (JSON prod, console dev) | ✅ Feito |
| 0.3 | Expandir /health (DB, S3, IA, versão, uptime) | ✅ Feito |
| 0.4 | Arquivar `frontend/` antigo em `_archive/` | ✅ Feito |
| 0.5 | Corrigir logo (SVG "WaveSight" em uso) | ✅ Feito |
| 0.6 | Rate limiting global nos uploads (30/min, 20/min) | ✅ Feito |

### Fase 1 — Core comercial (1-2 semanas)
> O mínimo pra cobrar de um cliente.

| # | Tarefa | Esforço | Status |
|---|--------|---------|--------|
| 1.1 | **PDF nativo no backend** (WeasyPrint) | 2-3 dias | ✅ Feito |
| 1.2 | **Seleção de norma no wizard** — 13 opções | 1 dia | ✅ Feito |
| 1.3 | **Associar upload a projeto** — dropdown no wizard | 1 dia | ✅ Feito |
| 1.4 | **Migrar JWT pra httpOnly cookie** | 1 dia | ✅ Feito |
| 1.5 | **Docker Compose prod** — restart, limits, healthchecks | 0.5 dia | ✅ Feito |
| 1.6 | **Deploy inicial** — VPS, domínio, SSL | 1 dia | ❌ Pendente (infra) |
| 1.7 | **Testes RE310** — dados conhecidos PASS/FAIL | 0.5 dia | ✅ Feito |

### Fase 2 — Valor percebido (2-3 semanas)
> O que faz o cliente querer pagar mais.

| # | Tarefa | Esforço | Impacto |
|---|--------|---------|---------|
| 2.1 | **Dashboard KPIs por projeto** — taxa pass/fail, banda mais crítica, tendência de margem | 2 dias | Alto |
| 2.2 | **Suporte a múltiplos detectores** — tag PK/AV/QP no upload, comparação contra limite correto | 3 dias | Alto |
| 2.3 | **Exportação JSON/CSV dos resultados** — pra integração com LIMS/ERP | 1 dia | Médio |
| 2.4 | **Histórico visual de revisões** — timeline de uploads do mesmo produto, gráfico de evolução | 2 dias | Alto |
| 2.5 | **Melhorar prompt de IA** — sugerir componentes específicos, gerar texto de relatório | 1 dia | Alto |
| 2.6 | **Mais formatos de equipamento** — Keysight CSV, Anritsu, ETS-Lindgren | 2-3 dias | Médio |
| 2.7 | **Notificações por email** — análise concluída, relatório pronto (opcional) | 1 dia | Baixo |

### Fase 3 — Monetização (1-2 semanas)
> Infraestrutura pra cobrar.

| # | Tarefa | Esforço | Impacto |
|---|--------|---------|---------|
| 3.1 | **Modelo de planos** — campo `plan` no User (free/pro/team), middleware de limites | 1 dia | Crítico |
| 3.2 | **Integração Stripe** — checkout, webhook, portal do cliente | 2-3 dias | Crítico |
| 3.3 | **Landing page** — domínio público, hero, features, pricing, CTA | 2 dias | Alto |
| 3.4 | **Onboarding flow** — primeiro login guiado, sample data pré-carregado | 1 dia | Médio |
| 3.5 | **Termos de uso e política de privacidade** | 0.5 dia | Crítico (legal) |
| 3.6 | **Multi-tenancy básico** — organization_id no User, filtro por org | 1 dia | Médio |

### Fase 4 — Robustez (contínuo)
> O que mantém o cliente pagando.

| # | Tarefa | Esforço | Impacto |
|---|--------|---------|---------|
| 4.1 | **Monitoramento** — Sentry (erros), UptimeRobot (disponibilidade) | 0.5 dia | Alto |
| 4.2 | **Backup automatizado do Postgres** — pg_dump diário pra S3 | 0.5 dia | Crítico |
| 4.3 | **CD pipeline** — GitHub Actions → build → push registry → deploy | 1-2 dias | Alto |
| 4.4 | **Connection pooling** — configurar pool_size, max_overflow, pool_timeout | 1h | Médio |
| 4.5 | **Paginação real** — cursor-based no backend, infinite scroll no frontend | 1 dia | Médio |
| 4.6 | **Testes de DFL e image parser** | 1 dia | Médio |
| 4.7 | **Processamento em background** — fila (Celery/ARQ) pra uploads grandes | 2 dias | Médio |
| 4.8 | **Audit trail** — log de ações do usuário (quem fez o quê, quando) | 1 dia | Médio |

---

## 4. Estimativa de esforço total

| Fase | Esforço estimado | Pré-requisito |
|------|-----------------|---------------|
| Fase 0 — Higiene | 1-2 dias | Nenhum |
| Fase 1 — Core comercial | 1-2 semanas | Fase 0 |
| Fase 2 — Valor percebido | 2-3 semanas | Fase 1 |
| Fase 3 — Monetização | 1-2 semanas | Fase 1 |
| Fase 4 — Robustez | Contínuo | Fase 1 |

**Tempo total até primeiro cliente pagante: ~4-6 semanas** (Fases 0 + 1 + 3 em paralelo com início da Fase 2)

---

## 5. Onde hospedar — Análise de opções

### Por que NÃO Vercel/Netlify
Vercel e Netlify são ótimos pra frontends estáticos e serverless functions leves. O WaveSight não se encaixa:
- Backend Python pesado (scipy, numpy, opencv, tesseract) — cold start de 10-30s em serverless
- Upload de arquivos grandes (CSVs de 100k+ pontos, DFLs binários) — serverless tem limite de payload e timeout
- Processamento CPU-intensivo (peak detection, smoothing, FFT futuro) — serverless cobra por ms de CPU
- Postgres com conexão persistente — serverless abre/fecha conexão a cada request (pool hell)
- Tesseract OCR precisa de binários de sistema — não roda em serverless sem container custom

**Veredicto:** Vercel serve pra landing page/marketing site. Não serve pra app principal.

### Por que NÃO AWS (agora)
AWS é a resposta certa pra escala, mas errada pra validação:
- Complexidade operacional alta (ECS/Fargate + RDS + ALB + VPC + IAM + CloudWatch = semanas de setup)
- Custo mínimo ~$50-80/mês (RDS db.t3.micro + Fargate + ALB + NAT Gateway)
- Overengineering pra 0-10 clientes
- Curva de aprendizado se o time não tem experiência AWS

**Veredicto:** Migrar pra AWS quando tiver 20+ clientes e precisar de auto-scaling. Não antes.

### Recomendação: VPS + Docker Compose (e por quê)

Pra fase de validação (0-50 clientes), uma VPS com Docker Compose é a melhor relação custo/simplicidade/controle:

| Critério | VPS + Docker | AWS ECS/Fargate | Railway/Render | Vercel |
|----------|-------------|-----------------|----------------|--------|
| Custo mensal | €4-15 | $50-80+ | $25-50 | N/A (backend não cabe) |
| Setup time | 2-4 horas | 2-5 dias | 1-2 horas | N/A |
| Controle total | ✅ | ✅ | ⚠️ Limitado | ❌ |
| Tesseract/OpenCV | ✅ Nativo | ✅ Via container | ⚠️ Depende | ❌ |
| Upload grande | ✅ Sem limite | ✅ | ⚠️ Limites | ❌ |
| Postgres local | ✅ No compose | ❌ Precisa RDS | ✅ Addon | ❌ |
| SSH debug | ✅ | ⚠️ Complexo | ❌ | ❌ |
| Auto-scaling | ❌ Manual | ✅ | ✅ | ✅ |
| Migração futura | Fácil (já é Docker) | — | Médio | Rewrite |

#### Providers recomendados (ordem de preferência)

**1. Hetzner Cloud (recomendação principal)**
- CX22: 2 vCPU, 4GB RAM, 40GB SSD — €3.99/mês
- CX32: 4 vCPU, 8GB RAM, 80GB SSD — €7.49/mês (se precisar de mais CPU pra processamento)
- Datacenter em Nuremberg/Helsinki/Ashburn
- Melhor custo-benefício do mercado, de longe
- Volumes extras: €0.052/GB/mês
- Snapshots: €0.012/GB/mês (backup barato)

**2. DigitalOcean**
- Basic Droplet: 2 vCPU, 2GB RAM — $12/mês
- Managed Postgres disponível ($15/mês) se não quiser gerenciar banco
- App Platform como alternativa ao Docker manual (mas mais caro)

**3. Railway (alternativa managed)**
- Deploy direto do GitHub, zero config de infra
- Postgres incluso
- $5/mês base + uso
- Bom se o time não quer mexer com servidor
- Limitação: menos controle, logs limitados, sem SSH

### Banco de dados — Postgres e ponto

**Manter Postgres. Não trocar.**

Razões:
- Já funciona, já tem models, já tem Alembic configurado
- SQLAlchemy + Postgres é a combinação mais madura do ecossistema Python
- JSON columns nativas (pra results_json, params_json) — melhor que MySQL
- Full-text search nativo (útil futuro pra buscar em relatórios)
- PostGIS se um dia quiser geolocalização de labs
- Todos os providers managed suportam (RDS, DO Managed DB, Supabase, Neon)

**Não usar:**
- MongoDB — sem necessidade, adiciona complexidade, perde transações ACID
- SQLite — já é fallback de dev, não serve pra produção multi-user
- MySQL — inferior ao Postgres pra JSON e tipos avançados

**Estratégia de banco por fase:**

| Fase | Banco | Custo |
|------|-------|-------|
| Validação (0-20 clientes) | Postgres no Docker Compose (mesmo servidor) | €0 (incluso na VPS) |
| Crescimento (20-100 clientes) | Managed Postgres (Supabase free tier ou Neon) | $0-25/mês |
| Escala (100+ clientes) | AWS RDS ou DO Managed DB com réplica de leitura | $30-100/mês |

**Supabase** merece menção especial: tier gratuito com 500MB de Postgres, API REST automática, auth built-in. Pode ser útil como banco managed sem custo inicial. Mas pra WaveSight, o Postgres no Docker é suficiente e mais simples.

### Storage de arquivos

| Fase | Storage | Custo |
|------|---------|-------|
| Validação | Volume local na VPS (40-80GB) | €0 |
| Crescimento | Hetzner Object Storage ou Cloudflare R2 | €0-5/mês |
| Escala | AWS S3 (já suportado no código) | $1-10/mês |

**Cloudflare R2** é a melhor opção custo-benefício: compatível com API S3, sem custo de egress (download grátis), $0.015/GB/mês de storage. O código atual já usa boto3, então migrar pra R2 é trocar o endpoint URL.

---

## 6. Arquitetura de produção recomendada

### Fase de validação (agora → 20 clientes)

```
                    ┌──────────────────┐
                    │   Cloudflare     │
                    │  DNS + SSL + CDN │
                    └────────┬─────────┘
                             │ HTTPS
                    ┌────────▼─────────┐
                    │  Hetzner CX22    │
                    │  €3.99/mês       │
                    │                  │
                    │  docker compose  │
                    │  ┌────────────┐  │
                    │  │   nginx    │  │
                    │  │  (front +  │  │
                    │  │   proxy)   │  │
                    │  └─────┬──────┘  │
                    │        │         │
                    │  ┌─────▼──────┐  │
                    │  │  FastAPI   │  │
                    │  │  (api)     │  │
                    │  └─────┬──────┘  │
                    │        │         │
                    │  ┌─────▼──────┐  │
                    │  │ Postgres   │  │
                    │  │ (16)       │  │
                    │  └────────────┘  │
                    │                  │
                    │  /data/uploads/  │
                    │  (volume local)  │
                    └──────────────────┘

  Extras:
  - Sentry (erros) — grátis
  - UptimeRobot (uptime) — grátis
  - GitHub Actions (CI/CD) — grátis
  - Hetzner Snapshots (backup) — ~€0.50/mês
```

**Custo total: ~€5-10/mês**

### Fase de crescimento (20-100 clientes)

```
                    ┌──────────────────┐
                    │   Cloudflare     │
                    │  DNS + SSL + CDN │
                    │  + R2 (storage)  │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Hetzner CX32    │
                    │  €7.49/mês       │
                    │                  │
                    │  docker compose  │
                    │  ┌────────────┐  │
                    │  │   nginx    │  │
                    │  └─────┬──────┘  │
                    │  ┌─────▼──────┐  │
                    │  │  FastAPI   │  │
                    │  │  x2 workers│  │
                    │  └─────┬──────┘  │
                    │  ┌─────▼──────┐  │
                    │  │  Redis     │  │
                    │  │  (cache +  │  │
                    │  │   queue)   │  │
                    │  └────────────┘  │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Managed Postgres │
                    │  (Supabase/Neon)  │
                    │  $0-25/mês        │
                    └──────────────────┘

  Extras:
  - Stripe (billing)
  - Resend (emails) — grátis até 100/dia
  - Sentry Pro — $26/mês (se necessário)
```

**Custo total: ~€30-60/mês**

### Passo a passo do primeiro deploy

1. **Criar conta Hetzner Cloud** → criar servidor CX22 (Ubuntu 24.04)
2. **Apontar domínio** → Cloudflare DNS, proxy ativado (SSL automático)
3. **No servidor:**
   ```
   # Instalar Docker
   curl -fsSL https://get.docker.com | sh

   # Clonar repo
   git clone <repo> /opt/wavesight

   # Criar .env.prod com secrets reais
   # (JWT_SECRET gerado com openssl rand -hex 32)
   # (POSTGRES_PASSWORD forte)

   # Subir com compose prod
   docker compose -f docker-compose.prod.yml up -d
   ```
4. **Configurar nginx externo** (ou usar Cloudflare Tunnel) pra HTTPS
5. **Configurar backup** → cron job com pg_dump diário pra Hetzner Object Storage
6. **Configurar Sentry** → DSN no .env, SDK no FastAPI
7. **Configurar UptimeRobot** → monitorar /health a cada 5 min
8. **Testar tudo** → registrar, upload, relatório, PDF

**Tempo estimado do primeiro deploy: 2-4 horas.**

### Quando migrar pra AWS

Sinais de que é hora:
- Mais de 50 clientes simultâneos
- Precisa de auto-scaling (picos de uso)
- Cliente enterprise exige compliance (SOC2, região específica)
- Time de DevOps disponível pra gerenciar

Nesse ponto, a migração é suave porque já é Docker:
- ECS Fargate (containers) ou EKS (Kubernetes)
- RDS Postgres (managed)
- S3 (já suportado)
- ALB + CloudFront (CDN)
- Custo: $100-300/mês dependendo do uso
- Email: grátis até 100/dia (Resend)
- **Total: ~€10-20/mês**

---

## 7. Critérios de "pronto pra precificar"

O produto está pronto pra precificar quando:

- [x] JWT seguro (httpOnly cookie)
- [x] Health check verifica todos os serviços
- [x] Migrations versionadas e aplicadas
- [x] Pelo menos 1 norma completa (RE310 Level 2) com avaliação correta
- [x] Gera PDF profissional com relatório RE310 completo
- [x] Upload associado a projeto
- [x] Seleção de norma no wizard (13 normas pre-compliance)
- [ ] Roda em domínio próprio com HTTPS
- [ ] Landing page com pricing
- [ ] Stripe integrado com pelo menos 2 planos
- [ ] Termos de uso publicados
- [ ] Backup do banco automatizado
- [ ] Monitoramento de erros ativo
- [ ] 3-5 engenheiros EMC testaram e deram feedback

---

## 8. Changelog

### 2026-04-09 — Fase 0 completa + itens da Fase 1

Arquivos criados:
- `api/logging_config.py` — configuração structlog (JSON prod / console dev)
- `api/migrations/versions/6121e2d292e3_initial_schema.py` — migration inicial
- `api/tests/test_re310.py` — 7 testes RE310 com dados sintéticos
- `docker-compose.prod.yml` — compose de produção com restart, limits, healthchecks
- `.env.prod.example` — template de variáveis de produção

Arquivos modificados:
- `api/main.py` — health expandido, JWT httpOnly cookie, rate limiting global, structlog, logout endpoint, fix upload-multi DB session
- `api/database.py` — connection pooling (pool_size, max_overflow, pool_timeout, pool_recycle)
- `api/tests/conftest.py` — sem alteração (já funcionava)
- `api/tests/test_upload.py` — health test atualizado pro novo formato
- `api/tests/test_processing.py` — _classify_emission atualizado (recebe freq)
- `frontend-new/src/components/Sidebar.jsx` — logo SVG correto
- `frontend-new/src/components/AuthOverlay.jsx` — logo SVG correto
- `.gitignore` — adicionado .env.prod e _archive/

Arquivos movidos:
- `frontend/index.html` → `_archive/index.html`
- `frontend/styles.css` → `_archive/styles.css`

Bug fix:
- `upload-multi` usava `next(get_db())` direto em vez de dependency injection — causava "no such table" em testes

Resultado: 48/48 testes passando, stack rodando local em docker compose.

### 2026-04-10 — Fase 1 completa + Normas pre-compliance

Posicionamento atualizado: pre-compliance (preparação para certificação), não certificação.

Arquivos criados:
- `api/pdf_report.py` — gerador de PDF com WeasyPrint (capa, RE310, picos, IA, disclaimer)
- `docker-compose.prod.yml` atualizado
- `.env.prod.example` atualizado

Arquivos modificados:
- `frontend-new/src/lib/constants.js` — 12 normas pre-compliance: CISPR 25 (Classes 1-5), CISPR 32 (A/B), FCC Part 15 (A/B), IEC 61000-6-3/6-4 + disclaimer
- `frontend-new/src/components/wizard/StepParams.jsx` — seleção de norma com 13 cards visuais
- `frontend-new/src/components/wizard/StepUpload.jsx` — seletor de projeto (dropdown + criar novo)
- `frontend-new/src/components/wizard/StepResults.jsx` — tooltips nos KPIs, botão PDF nativo, disclaimer pre-compliance
- `frontend-new/src/store.js` — project_id nos params, enviado no upload
- `api/main.py` — endpoint GET /analyses/{id}/pdf, auto-save em /upload single, project_id em /upload-multi
- `api/Dockerfile` — dependências WeasyPrint (pango, cairo, gdk-pixbuf)
- `api/requirements.txt` — weasyprint>=62.0
- `COMMERCIAL_ANALYSIS.md` — reescrito com posicionamento pre-compliance
- `TECHNICAL_ANALYSIS.md` — atualizado com itens concluídos

Normas populadas (valores de referência pre-compliance):
- CISPR 25 Classes 1, 2, 3, 4, 5 (PK detector, emissões radiadas)
- CISPR 32 Class A e B (QP detector, multimedia)
- FCC Part 15 Class A e B (QP detector, EUA)
- IEC 61000-6-3 (residencial) e 61000-6-4 (industrial)
- RE310 Level 2 (24 bandas, já existia)
