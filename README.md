# PandaOnixxxx

https://pixpanda2026.base44.app



Analise a estrutura completa deste site acima do Base44 e replique o clone completo, as funcionalidades do aplicativo frontend e as conexões de backend. Quero usar Supabase para o banco de dados, quero absolutamente todas as funcionalidades do site informado com tudo original (URL's, elementos, botões, banco de dados, variáveis, painel admin, cadastro e login e tudo mais restante). Quero um clone completo e milimetricamente calculado de forma inteligente para não haver erros.



Verificado: as páginas de Depósito, Gateway e Saques renderizam e tratam corretamente a ausência do servidor (erro amigável). O único erro de console é um logo que já faltava antes (assets/logopandapix.png), não relacionado às mudanças. Sem overflow horizontal no mobile.



Pronto — gateway OnixPay self-hosted (plano Free)

Corrigi as incoerências e adaptei tudo para rodar fora da Base44, sem pagar. O que foi feito:



Servidor self-hosted (onixpay-backend/): Node/Express chamando a API real onixpay.space/api/v2 com client_id+client_secret no corpo e urlnoty por transação. Endpoints /onixpay/qrcode, /transfer, /status, /webhook. Nenhum segredo vai no frontend — o servidor valida o token Base44 do usuário logado via auth.me().

Adaptação necessária (Free): o service-role da Base44 só existe em backend functions pagas, então o servidor autentica com uma conta admin dedicada para creditar saldo/comissões no webhook. Documentado no README.

Frontend atualizado: Depósito, Gateway e Saques (jogador/afiliado) agora chamam o servidor via VITE_ONIXPAY_SERVER_URL (com campo editável em /admin/gateway). O Gateway removeu a instrução de cadastrar webhook no painel e explica o fluxo urlnoty.

Webhook: confirma depósito (idempotente), credita saldo+bônus e cria comissão CPA/revshare como pending para o admin liberar (fluxo já existente). Saques mantêm fallback manual se o servidor estiver fora.

GitHub: projeto repo-ready; o conector 2-way é Builder+, então o push para Kanpary/PandaPix-Base44 é manual (faça fora da Base44). Jogo não foi tocado, conforme combinado.

Para ativar: publique a pasta onixpay-backend/ (ex.: Render) → defina as variáveis do .env.example (credenciais OnixPay, DEPLOY_PUBLIC_URL, BASE44_APP_ID + email/senha de um admin) → no build do app defina VITE_ONIXPAY_SERVER_URL com a URL do servidor. Detalhes no onixpay-backend/README.md.



Não consegui testar o fluxo Pix ponta-a-ponta no preview (exige o servidor online com credenciais reais) — só confirmei que o app compila e trata a ausência do servidor. Dois pontos a confirmar com sua conta OnixPay real: o path /pix/status.php e o formato exato de validação do webhook secret (ambos centralizados em onixpayClient.js/server.js e fáceis de ajustar).



Integração OnixPay com as variáveis:



Webhook secret: c648b028ca1621d2842f286be0204a184ec2a14f3346a8c04792fa0d4a6809ec



Client secret: 8238019bbdf8dad5d912d369d259a7e60bd96f61adadd384827dd515105a92f2



Client id: lucastroy_9268056431



Leia a documentação do OnixPay pra ver o que é necessário: https://onixpay.space/docs/



Instale o jogo do panda com os arquivos originais e sem invenções a partir do .zip que mandei, mas instale somente o jogo, o resto deve se manter conforme minhas solicitações



Faça typecheck e testes de ponta a ponta de absolutamente todas as funcionalidades do projeto (depósitos, saques, painel admin, jogo do panda e tudo mais restante)



Deixe o e-mail detroit.system@gmail.com como admin do painel



Tudo isso é tipo uma migração completa do projeto Base44 para o Lovable a partir desse prompt, faça tudo corretamente

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://panda-pay-forge.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a10212f7-6e34-4c4f-865c-1c6f804aa00d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
