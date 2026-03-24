# Instrucoes Gerais para Qualquer Chat/IA

Se voce estiver continuando este projeto, siga estas regras antes de responder:

## 1) Leitura minima obrigatoria
- `contexts/00_PROJECT_OVERVIEW.md`
- `contexts/10_CURRENT_STATE.md`
- `contexts/20_RECENT_CHANGES.md`
- `contexts/30_OPEN_DECISIONS.md`

## 2) Nao recomece do zero
- Preserve o que ja foi implementado.
- Nao substituir fluxos existentes sem justificativa tecnica.
- Priorize evolucao incremental.

## 3) Atualizacao obrigatoria de contexto apos mudanca relevante
- Sempre atualizar `contexts/20_RECENT_CHANGES.md`.
- Atualizar `contexts/10_CURRENT_STATE.md` se houve alteracao funcional.
- Atualizar `contexts/30_OPEN_DECISIONS.md` se abriu/fechou decisao.
- Se a sessao foi grande, registrar resumo em `contexts/99_SESSION_TEMPLATE.md`.

## 4) Higiene de documentacao
- Se alterar comportamento do produto, atualizar tambem:
- `README.md`
- `ROADMAP.md`
- `PROJECT_CONTEXT.md` (quando a mudanca for estrutural)

## 5) Normas e compliance
- Presets embutidos sao exemplos.
- Nao tratar presets como tabela oficial.
- Se usar norma oficial, explicitar origem/licenca dos dados.

## 6) Entrega minima esperada por tarefa de implementacao
- Codigo alterado
- Validacao executada (quando possivel)
- Resumo curto de impacto
- Lista de arquivos alterados
