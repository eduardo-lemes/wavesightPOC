# Decisoes em Aberto

## 1) FFT (dominio do tempo)
- Opcoes discutidas:
- `domain` explicito (`frequency` ou `time`) - recomendado
- `domain=auto` por heuristica - mais pratico, menos confiavel
- Falta decidir implementacao oficial no backend/frontend.

## 2) Normas oficiais
- Integracao depende de dados licenciados (CISPR/IEC/JLR etc.)
- Falta definir pipeline de ingestao oficial:
- JSON manual
- conversor de planilha/PDF para JSON validado

## 3) Validacao normativa formal
- Falta definir regra de pass/fail por detector/faixa com audit trail
- Falta definir versao normativa por mercado (edicao, ano, classe)

## 4) Autorizacao
- Hoje existe autenticacao (login) mas sem papeis/permissoes
- Falta decidir modelo inicial:
- simples (`admin`, `analyst`)
- ou controle mais granular por acao/projeto

## 5) Persistencia funcional
- Usuarios ja persistem no banco
- Falta definir modelo de dados para historico de analises e relatorios
