# Corrigir cadastro/login e preparar a integração do jogo

## 1. Cadastro e login funcionando hoje

- Ativar **confirmação automática de e-mail** no backend: quem se cadastra já entra logado, sem depender de e-mail.
- Ajustar a tela de cadastro: remover a etapa "Confirme seu e-mail" e redirecionar direto para `/painel` após o cadastro.
- Garantir que o perfil do jogador (nome, telefone, CPF, código de afiliado) é criado no cadastro e que o vínculo com o afiliado do link `?ref=` é gravado.
- Melhorar as mensagens de erro do login (conta inexistente vs. senha errada) e manter o fluxo de recuperação de senha.

Observação: envio real de e-mail (domínio próprio) fica para uma etapa futura, quando você quiser verificação de e-mail de verdade.

## 2. Backend do jogo (pronto antes dos arquivos chegarem)

Rotas/servidor com as mesmas assinaturas que o `api.js` do jogo espera:

- `panda-config` — RTP e aposta mínima/máxima lidos de `game_settings`.
- `panda-bet` — valida aposta, debita saldo, cria registro em `game_sessions`.
- `panda-result` — credita ganho, grava `game_history`, encerra a sessão.
- `user/balance` — saldo atual do jogador.
- Depósito, saque, afiliado e histórico reaproveitam as funções já existentes.

Regras: toda a lógica de saldo e sorteio roda no servidor (o cliente nunca decide quanto ganhou); cada aposta é atômica e idempotente por sessão.

## 3. OnixPay (Pix)

- Guardar `ONIXPAY_CLIENT_ID`, `ONIXPAY_CLIENT_SECRET`, `ONIXPAY_WEBHOOK_SECRET` como segredos.
- `src/lib/onixpay.server.ts`: autenticação, geração de QR Pix, consulta de status e transferência (saque).
- Webhook público com verificação de assinatura e crédito idempotente (mesmo evento recebido duas vezes não credita duas vezes).
- Depósito passa a exibir QR Pix real; saque envia transferência após aprovação no painel.

## 4. Arquivos do jogo (quando você enviar o .zip)

- Publicar `index.html`, `game.js`, `includes/style.css`, imagens e áudios em `public/game/` — todo o PHP é descartado.
- Reescrever `api.js` como um shim que lê o token de sessão e chama as rotas acima, mantendo nomes e formatos de retorno idênticos.
- Trocar o placeholder de `/jogo` por um iframe do jogo (somente cliente), mantendo saldo e histórico na página.

## 5. Validação ponta a ponta

Teste no navegador de: cadastro (com e sem código de afiliado), login, depósito, saque, comissão de afiliado, todas as telas do painel admin e — após o envio do .zip — o jogo do panda.

## Ordem de execução

1. Cadastro/login (agora)
2. Backend do jogo + OnixPay
3. Assets do jogo e shim quando o .zip chegar
4. Testes ponta a ponta
