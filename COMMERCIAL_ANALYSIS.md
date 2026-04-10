# WaveSight EMC — Análise Comercial

**Data:** 2026-04-09 | **Atualizado:** 2026-04-10

## Posicionamento: Pre-Compliance, não Certificação

O WaveSight não é um lab de certificação. É uma **ferramenta de preparação** que ajuda o engenheiro a chegar no lab sem surpresa. O pitch:

> "Suba seus CSVs, veja onde tá falhando, entenda por quê, e saiba o que corrigir — antes de gastar $5-15k num dia de lab."

Isso resolve o problema legal das normas licenciadas (usamos valores de referência públicos com disclaimer) e expande o público: não é só lab de teste, é todo time de engenharia que quer testar internamente antes de mandar pro lab.

**Disclaimer padrão em todos os relatórios:**
> "Valores de referência para pre-compliance. Para certificação formal, consulte a norma oficial vigente."

---

## Onde estamos

POC funcional com valor técnico real:
- Upload CSV/DFL/screenshot, processamento de espectro, detecção de picos, classificação de emissão
- Avaliação RE310 Level 2 com PASS/FAIL por banda (24 bandas)
- 12 normas de referência pre-compliance: CISPR 25 (Classes 1-5), CISPR 32 (A/B), FCC Part 15 (A/B), IEC 61000-6-3/6-4, RE310
- Seleção de norma no wizard com cards visuais
- Upload associado a projeto
- PDF nativo profissional (WeasyPrint) com capa, RE310, picos, IA
- Comparação entre revisões, IA opcional (OpenAI/Anthropic/Gemini)
- Auth JWT httpOnly cookie, rate limiting, logging estruturado
- 48 testes automatizados passando, CI com GitHub Actions
- Stack dockerizada (dev + prod)

## O que falta para comercializar

### Prioridade alta
1. **Deploy em domínio real** — VPS + SSL + domínio (~€5-10/mês)
2. **Stripe** — planos free/pro/team, checkout, webhook
3. **Landing page** — hero, features, pricing, CTA
4. **Feedback de 3-5 engenheiros reais** — validar valor e preço

### Prioridade média
5. Dashboard KPIs por projeto (taxa pass/fail, tendência)
6. Suporte a múltiplos detectores (PK/AV/QP por arquivo)
7. Exportação JSON/CSV dos resultados
8. Mais formatos de equipamento (Keysight, Anritsu)

### Pode esperar
9. Multi-tenancy (organization_id básico)
10. FFT (domínio do tempo)
11. Mobile/responsive
12. Normas licenciadas oficiais (só quando tiver receita)

## Modelo de negócio

**Precificação sugerida (SaaS):**
- Free: 5 análises/mês, 1 projeto, sem IA, sem PDF
- Pro ($99/mês por usuário): ilimitado, IA, PDF, 5 projetos
- Team ($249/mês, 5 usuários): tudo do Pro + projetos compartilhados + export
- Enterprise (sob consulta): SSO, on-premise, normas customizadas, SLA

**Alternativa:** pay-per-report ($2-5 por relatório) — menor barreira de entrada.

**Não precisa de investidor agora.** Custo operacional ~€10-20/mês. Valide com 3-5 clientes pagantes primeiro.

## Diferenciação competitiva

1. **IA como diagnóstico** — nenhum concorrente oferece análise automática com LLM
2. **Parser de screenshot** — engenheiro tira foto do analisador e já tem análise
3. **12 normas pre-compliance** — CISPR 25 (5 classes), CISPR 32, FCC, IEC, RE310
4. **PDF profissional** — relatório pronto pra mandar pro cliente
5. **Suporte a DFL (R&S)** — integração direta com equipamentos Rohde & Schwarz

## Público-alvo

1. **Times de engenharia de produto** — testam internamente antes de mandar pro lab (maior volume)
2. **Labs de teste terceirizados** — automatizam relatórios (maior ticket)
3. **Gestores técnicos** — querem visibilidade de pass/fail por projeto (decisor de compra)

## Contexto de mercado

O mercado de ferramentas EMC é carente de software moderno. A maioria dos labs ainda usa Excel e relatórios manuais. O WaveSight se posiciona como ferramenta de preparação que reduz o risco de falha no lab — onde cada dia custa $5-15k.
