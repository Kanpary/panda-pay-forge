# Fase de fechamento: validação, jogo e Pix OnixPay

Estado atual: perfis são criados no cadastro, vínculo de afiliado funciona, login/admin abre e as 14 telas do painel existem. Esta fase termina o que falta: corrigir warnings de UX, validar as ações de dinheiro no admin, integrar o .zip do jogo do panda e ligar o gateway Pix OnixPay.

## 1. Correções rápidas de UX

### 1.1 Aviso de estado no /saque
- O componente `SaquePage` usa `useState` inicializado com valores de `profile` antes do carregamento. Quando o usuário desloga ou a rota desmonta, atualizações de estado podem disparar após o desmonte.
- Solução: inicializar os estados de forma neutra e aplicar `useEffect` com flag de montado, ou usar valores controlados só após `profile` estar disponível. Garantir que nenhum `setState` execute após `unmount`.

### 1.2 Mensagem de senha fraca no cadastro
- Hoje o cadastro mostra "Não foi possível cadastrar" para erros do Supabase Auth.
- Mapear erros comuns: senha muito fraca, e-mail inválido, e-mail já cadastrado, e exibir mensagens em português claras.

## 2. Validação e ajustes do fluxo admin

### 2.1 Aprovar depósito e conferir crédito
- Testar fluxo: jogador cria depósito em `/deposito` → admin aprova em `/admin/depositos`.
- Verificar se saldo é creditado, bônus de primeiro depósito é aplicado quando ativo, e comissão CPA/revshare é gerada para o afiliador.
- Ajustar `decideDeposit` se houver erro de arredondamento, concorrência ou falta de auditoria.

### 2.2 Aprovar/pagar/rejeitar saque
- Testar: jogador solicita saque em `/saque` → admin aprova/paga/rejeita em `/admin/saques`.
- Se rejeitado, saldo deve voltar para o jogador. Se pago, saldo já foi debitado na solicitação.
- Verificar status exibidos e mensagens.

### 2.3 Liberar/rejeitar comissão
- Testar: comissão gerada automaticamente → admin libera em `/admin/comissoes`.
- Verificar se `saldo_comissao` do afiliado é creditado corretamente.

### 2.4 Telas de gestão
- `/admin/usuarios/$id`: salvar saldos, percentuais, bloqueio, tipo de conta e demo.
- `/admin/papeis`: conceder/revogar papéis e refletir imediatamente.
- `/admin/demo`: criar conta demo com saldo inicial.
- `/admin/regras`, `/admin/aparencia`, `/admin/pixel`, `/admin/gateway`, `/admin/rtp`: salvar configurações e invalidar cache.

## 3. Integração do jogo do panda (.zip)

- Receber o arquivo .zip do jogo (upload pelo usuário ou link seguro).
- Extrair em `public/game/` ou `src/game/` conforme a estrutura do arquivo.
- Substituir a tela `/jogo` do placeholder pela implementação real, mantendo:
  - Exibição de saldo e bônus.
  - Controle de aposta mínima/máxima e RTP vindos de `game_settings`.
  - Registro de sessão e histórico em `game_sessions` / `game_history`.
  - Suporte a contas demo.
- Garantir que o jogo não dependa de bibliotecas incompatíveis com Worker/SSR; usar `<ClientOnly>` se necessário.

## 4. Integração OnixPay Pix

### 4.1 Credenciais e configuração
- As credenciais do OnixPay serão salvas via formulário seguro de secrets:
  - `ONIXPAY_CLIENT_ID`
  - `ONIXPAY_CLIENT_SECRET`
  - `ONIXPAY_WEBHOOK_SECRET`
- Configurações comerciais (sandbox, limites, taxas) continuam em `app_settings` (chave `gateway`).

### 4.2 Cliente OnixPay no servidor
- Criar módulo server-only em `src/lib/onixpay.server.ts` com:
  - Autenticação (client credentials).
  - Geração de QR Code Pix para depósito.
  - Consulta de status de transação.
  - Transferência Pix para saque (quando aprovado).
- Usar `fetch` nativo, compatível com Worker.

### 4.3 Webhook OnixPay
- Criar rota pública `src/routes/api/public/onixpay/webhook.ts`.
- Verificar assinatura do webhook com `ONIXPAY_WEBHOOK_SECRET`.
- Confirmar depósito, creditar saldo + bônus e gerar comissões (idempotente via `external_id`).
- Registrar payload em `gateway_webhooks`.

### 4.4 Fluxo de depósito com QR Code
- Em `/deposito`, após criar o depósito, chamar server function para gerar QR Code via OnixPay.
- Exibir QR Code, copia-e-cola e timer de expiração.
- Consultar status periodicamente ou aguardar webhook.

### 4.5 Fluxo de saque
- Ao aprovar saque no admin, opcionalmente executar transferência OnixPay.
- Se o gateway falhar, manter saque como `approved` para fallback manual.

## 5. Fechamento

- Typecheck limpo (`bunx tsc --noEmit` ou `tsgo`).
- Testes ponta a ponta no navegador: cadastro com afiliado, depósito, jogo, saque, comissão, todas as telas admin.
- Revisar metadados de cabeçalho das rotas públicas.
- Resumo do que foi validado e do que ficou pendente.

## Fora desta fase

- Refino visual não essencial.
- Novos gateways além do OnixPay.
