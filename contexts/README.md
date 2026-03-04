# Context Pack

Esta pasta centraliza o contexto para uso em multiplos chats.

## Ordem recomendada de leitura
1. `contexts/00_PROJECT_OVERVIEW.md`
2. `contexts/10_CURRENT_STATE.md`
3. `contexts/20_RECENT_CHANGES.md`
4. `contexts/30_OPEN_DECISIONS.md`
5. `contexts/40_GENERAL_INSTRUCTIONS.md`

## Como usar em um novo chat
Use esta mensagem inicial:

```text
Leia primeiro os arquivos:
- contexts/00_PROJECT_OVERVIEW.md
- contexts/10_CURRENT_STATE.md
- contexts/20_RECENT_CHANGES.md
- contexts/30_OPEN_DECISIONS.md
- contexts/40_GENERAL_INSTRUCTIONS.md

Depois continue o trabalho sem recomeçar do zero.
```

## Regra de manutencao
- Ao finalizar uma mudanca relevante:
- atualizar `contexts/20_RECENT_CHANGES.md`
- atualizar `contexts/10_CURRENT_STATE.md` se houve alteracao funcional
- atualizar `contexts/30_OPEN_DECISIONS.md` se houve nova decisao pendente
- seguir `contexts/40_GENERAL_INSTRUCTIONS.md`
- opcional: registrar resumo rapido em `contexts/99_SESSION_TEMPLATE.md`
