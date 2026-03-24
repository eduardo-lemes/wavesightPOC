# Decisões em Aberto

## 1) Logo / Branding
- `logo.png` diz "WaveInsight", todo o resto do projeto diz "WaveSight"
- SVG correto `frontend/assets/wavesight-logo.svg` existe mas não é utilizado
- Decidir: corrigir o PNG ou trocar todos os refs para usar o SVG

## 2) FFT (domínio do tempo)
- Opções discutidas:
  - `domain` explícito (`frequency` ou `time`) — recomendado
  - `domain=auto` por heurística — mais prático, menos confiável
- Falta decidir implementação oficial no backend/frontend

## 3) Normas oficiais
- Integração depende de dados licenciados (CISPR/IEC/JLR etc.)
- Falta definir pipeline de ingestão oficial:
  - JSON manual
  - Conversor de planilha/PDF para JSON validado

## 4) Validação normativa formal
- Avaliação básica RE310 (PASS/FAIL por banda) já implementada
- Falta validação normativa formal com audit trail
- Falta definir versão normativa por mercado (edição, ano, classe)

## 5) Autorização
- Hoje existe autenticação (login) mas sem papéis/permissões
- Falta decidir modelo inicial:
  - Simples (`admin`, `analyst`)
  - Ou controle mais granular por ação/projeto

## 6) Persistência funcional
- Usuários já persistem no banco
- Falta definir modelo de dados para histórico de análises e relatórios

## 7) Frontend monolítico
- 4681 linhas em um único `index.html`
- Decidir se refatora para arquivos separados (CSS, JS, HTML) ou mantém como está para a POC

## 8) Segurança do JWT
- Token armazenado em `localStorage` (vulnerável a XSS)
- Decidir: aceitar risco na POC ou migrar para `httpOnly` cookie
