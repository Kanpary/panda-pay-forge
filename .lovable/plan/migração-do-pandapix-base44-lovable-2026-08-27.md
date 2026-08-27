# Migração do PandaPix (Base44 → Lovable)

Clone completo do app `pixpanda2026.base44.app` rodando no Lovable, com Lovable Cloud (Postgres + Auth + funções de servidor) no lugar das entidades e funções da Base44. Entrega em 3 fases; o jogo do panda entra depois, quando você enviar o .zip.

## Estrutura confirmada do site original

Rotas extraídas do bundle do site:

```text
Público:   /login  /register  /forgot-password  /reset-password
Jogador:   /  /deposito  /saque  /jogo
Afiliado:  /afiliado
Admin:     /admin  /admin/usuarios  /admin/depositos  /admin/financeiro
           /admin/saques-jogadores  /admin/saques-afiliados  /admin/afiliados
           /admin/agentes  /admin/acessos  /admin/contas-demo
           /admin/gateway  /admin/config-jogo  /admin/aparencia
           /admin/pixel  /admin/senha
Gateway:   /onixpay/qrcode  /onixpay/status  /onixpay/transfer  + webhook
```

Entidades identificadas: User, Deposit, Withdrawal, AffiliateCommission, GameSession, GameHistory, GameSetting, GatewayWebhook, Acesso (logs de acesso), além de configurações (gateway, aparência, pixel, contas demo).

## Fase 1 — Base, autenticação e admin

- Ativar Lovable Cloud (banco + auth) e criar o schema completo com RLS e GRANTs:
  `profiles` (saldo, bônus, dados Pix, código de afiliado, referido_por, demo flag),
  `user_roles` (admin/agente/afiliado/user em tabela separada, com função `has_role`),
  `deposits`, `withdrawals`, `affiliate_commissions`, `game_sessions`, `game_history`,
  `game_settings`, `gateway_webhooks`, `access_logs`, `app_settings` (gateway, aparência, pixel).
- Login, cadastro (com captura de código de afiliado), recuperação e redefinição de senha.
- `detroit.system@gmail.com` recebe papel `admin` automaticamente no primeiro cadastro/login (trigger + seed do papel).
- Layout, tema e navegação replicando o original (mobile-first, sem overflow horizontal).
- Painel admin com todas as telas listadas acima, começando por usuários, financeiro, acessos, contas demo, aparência, pixel e senha.

## Fase 2 — Pix / OnixPay (depósitos e saques)

- Cliente OnixPay dentro do servidor do Lovable (server functions), nunca no frontend:
  geração de QR Code Pix, consulta de status, transferência (saque) e webhook em
  `/api/public/onixpay/webhook` com `urlnoty` por transação.
- Credenciais salvas apenas via formulário seguro de secrets: `ONIXPAY_CLIENT_ID`,
  `ONIXPAY_CLIENT_SECRET`, `ONIXPAY_WEBHOOK_SECRET`. (As que você colou no chat não serão usadas — recomendo rotacionar no painel OnixPay.)
- Webhook idempotente: confirma depósito, credita saldo + bônus e gera comissão CPA/revshare como `pending` para liberação do admin.
- Telas `/deposito`, `/saque`, `/admin/depositos`, `/admin/saques-jogadores`, `/admin/saques-afiliados`, `/admin/gateway` (com toggles, limites, taxas e teste de conexão).
- Consulta da documentação em `onixpay.space/docs` para confirmar paths e formato de validação do webhook.

## Fase 3 — Afiliados, jogo e validação

- Área do afiliado: link/código de indicação, cliques, cadastros, depósitos, comissões, saldo e saque de comissão.
- `/admin/afiliados` e `/admin/agentes` (comissões CPA/revshare, aprovações, hierarquia).
- `/jogo` + `/admin/config-jogo`: RTP, aposta mín/máx, controle por usuário, contas demo, histórico e sessões. A rota fica pronta com a integração de saldo/histórico; os arquivos originais do jogo do panda são instalados sem alterações quando o .zip chegar.
- Typecheck completo e testes ponta a ponta via navegador: cadastro, login, depósito (QR + webhook simulado), saque, comissões, todas as telas do admin e o jogo.

## Detalhes técnicos

- Stack: TanStack Start + React 19 + Tailwind v4 + Lovable Cloud (Supabase gerenciado).
- Sem servidor externo (nada de Render): a lógica que na Base44 exigia plano pago roda nas server functions do Lovable, com service role no servidor — logo, não é necessário "conta admin dedicada" nem chaves no frontend.
- Toda operação de dinheiro (crédito de saldo, aprovação de saque, liberação de comissão) só em server function com verificação de papel; RLS em todas as tabelas com políticas por `auth.uid()` e `has_role`.
- Saldos movimentados por transações no banco com registro de auditoria, evitando crédito duplicado.
- Fallback manual de saque preservado caso o gateway esteja indisponível.

## Pontos em aberto

- .zip do jogo do panda: pendente de envio (Fase 3).
- Confirmação com sua conta OnixPay real do endpoint de status e do formato de assinatura do webhook — ambos centralizados em um único módulo para ajuste rápido.
