# OnixPay API v2 — notas de integração

Fonte: https://onixpay.space/docs/

A API usa a base `https://onixpay.space/api/v2/` e recebe `client_id` e `client_secret` nos parâmetros das requisições server-side. A criação de cobrança é `POST /pix/qrcode.php`, com `nome`, `cpf`, `valor`, `descricao` opcional e `urlnoty` opcional. A resposta de sucesso HTTP 200 fornece `qrcode`, `transactionId`, `reference_code` e `gateway: Onix Pay`.

A transferência PIX usa `POST /pix/payment.php` com `client_id`, `client_secret`, `nome`, `cpf`, `valor`, `chave_pix`, `descricao` opcional e `urlnoty`. A resposta fornece `transactionId`, `external_id` e `status`, podendo ser `PAID` ou `PENDING`.

A consulta usa `GET /pix/status.php` com `client_id`, `client_secret` e pelo menos um entre `transaction_id` e `reference_code`. Os status são `PENDING`, `PAID`, `FAILED` e `CANCELLED`; tipos `DEPOSIT` e `WITHDRAW`.

O webhook de depósito envia `transactionType: RECEIVEPIX`, `transactionId`, `amount`, `paymentType: PIX` e `status: PAID`; deve retornar HTTP 200. O webhook de transferência envia `transactionType: PAYMENT`, `transactionId`, `amount` e `statusCode.statusId`: 1 concluída, 2 processando, 3 falhou.

A assinatura opcional usa o header `X-OnixPay-Signature: sha256=...`, calculado com HMAC-SHA256 sobre o corpo bruto. O segredo é `webhook_secret`; sem segredo configurado o webhook continua sem validação HMAC.
