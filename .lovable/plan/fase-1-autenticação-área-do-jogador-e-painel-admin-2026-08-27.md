# Fase 1 — Autenticação, área do jogador e painel admin

O banco, o tema, o `useAuth` e o layout do jogador já estão prontos. Esta fase entrega todas as telas que faltam para o app ficar navegável de ponta a ponta, sem o gateway Pix (que fica para a Fase 2).

## 1. Autenticação

- `/login` — e-mail e senha, link para cadastro e recuperação.
- `/register` — nome, e-mail, telefone, CPF, senha e captura do código de afiliado (`?ref=` na URL ou digitado); o código vai no metadata do cadastro e o trigger já vincula o indicador.
- `/forgot-password` — envio de e-mail com retorno para `/reset-password`.
- `/reset-password` — define nova senha para sessões de recuperação.
- `/` passa a ser uma porta de entrada: visitante vê a apresentação PandaPix com botões Entrar/Cadastrar; usuário logado é levado à home do jogador.
- Gate de rotas autenticadas: subárvore protegida que redireciona para `/login` quando não há sessão, usada pelo jogador e pelo admin (o admin ganha uma camada extra que exige o papel `admin`).
- Header já mostra saldo e botão sair; o sair limpa o cache e volta para `/login`.

## 2. Área do jogador

- Home (`/painel`): saldo, saldo bônus, atalhos (Depositar, Sacar, Jogar), últimos depósitos, saques e rodadas.
- `/deposito`: valores rápidos e campo livre, respeitando os limites de `app_settings`; cria o depósito pendente e mostra a área do QR Code, com aviso de que o Pix automático entra na Fase 2.
- `/saque`: chave Pix (tipo + chave), valor, taxa e limites calculados, saldo disponível e histórico com status.
- `/afiliado`: link e código de indicação com copiar/compartilhar, contadores de indicados e depósitos, comissões por status e saldo de comissão.
- `/jogo`: tela reservada com saldo e histórico integrados, aguardando os arquivos do jogo do panda.

## 3. Painel admin (15 rotas)

Layout próprio com menu lateral/inferior e as rotas:
`/admin` (visão geral: usuários, depósitos, saques, GGR), `/admin/usuarios`, `/admin/depositos`, `/admin/financeiro`, `/admin/saques-jogadores`, `/admin/saques-afiliados`, `/admin/afiliados`, `/admin/agentes`, `/admin/acessos`, `/admin/contas-demo`, `/admin/gateway`, `/admin/config-jogo`, `/admin/aparencia`, `/admin/pixel`, `/admin/senha`.

Cada tela com busca, filtros por status e paginação simples. Ações de dinheiro (aprovar/rejeitar depósito e saque, liberar comissão, ajustar saldo, bloquear usuário, criar conta demo) passam por funções de servidor que verificam o papel admin antes de escrever, com registro de auditoria.

## 4. Ajustes de banco necessários

Uma migração complementar antes das telas:

- Políticas de escrita que hoje faltam: inserir saque próprio, inserir/atualizar sessões e histórico de jogo, escrita de `app_settings` e `game_settings` restrita a admin, atualização de depósitos/saques restrita a admin.
- Índices por `user_id`/`status`/`created_at` nas tabelas de listagem do admin.
- Função de estatísticas agregadas para o painel (`admin_overview`), com verificação de papel.
- Semear as chaves de `app_settings` que ainda não existirem (gateway, aparência, pixel, afiliados, limites de depósito/saque) e os `game_settings` globais (RTP, aposta mínima e máxima).

## Detalhes técnicos

- TanStack Start: rotas em `src/routes`, subárvore `_authenticated` para jogador e `_authenticated/_admin` para o painel.
- Leituras via TanStack Query com o cliente do navegador (RLS já cobre "meus dados" e "admin vê tudo"); escritas sensíveis em `createServerFn` com `requireSupabaseAuth` + checagem `has_role`.
- Sem chamadas ao OnixPay nesta fase: os depósitos ficam pendentes e a aprovação manual do admin credita o saldo, fallback que continua útil depois.
- Mobile-first, sem rolagem horizontal, usando os tokens do tema já definidos.
- Ao final: typecheck e navegação real pelas telas (cadastro, login, depósito manual, saque, comissão, todas as telas do admin).

## Fora desta fase

- OnixPay (QR Code, status, transferência, webhook) e as credenciais pelo formulário seguro — Fase 2.
- Arquivos do jogo do panda — entram quando o .zip chegar.
