# Fechamento do painel admin — PandaPix

## Contexto

A base do jogador e a autenticação já estão prontas. O admin tem:

- `AdminShell` com menu de 14 itens.
- `AdminSettingsForm` reutilizável para configurações.
- Funções de servidor em `src/lib/admin-lists.functions.ts` (listagens) e `src/lib/admin.functions.ts` (ações).
- Apenas `/admin` (visão geral) existe hoje.

## Objetivo

Entregar as 13 telas administrativas que faltam, fazer o typecheck e validar a navegação ponta a ponta.

## Escopo

### 1. Rotas admin restantes

Criar em `src/routes/_authenticated/_admin/`:

- `admin.depositos.tsx` — listar depósitos com filtros de status, aprovar/cancelar.
- `admin.saques.tsx` — listar saques, aprovar/pagar/rejeitar com devolução de saldo.
- `admin.comissoes.tsx` — listar comissões, liberar/rejeitar.
- `admin.usuarios.tsx` — busca e listagem de usuários.
- `admin.usuarios.$id.tsx` — detalhe/edição de usuário (saldos, bloqueio, percentuais).
- `admin.papeis.tsx` — gerenciar papéis de acesso (admin, agente, afiliado, user).
- `admin.demo.tsx` — criar e listar contas demo.
- `admin.afiliados.tsx` — rede de afiliados e desempenho.
- `admin.historico.tsx` — histórico de rodadas do jogo.
- `admin.gateway.tsx` — configurações do gateway de pagamento.
- `admin.aparencia.tsx` — marca, cores e textos.
- `admin.pixel.tsx` — pixel e rastreamento.
- `admin.regras.tsx` — regras de afiliados e bônus.
- `admin.rtp.tsx` — RTP/limites de aposta e troca de senha do admin.

Cada rota terá:

- `head()` próprio com título, descrição e `noindex`.
- Layout `AdminShell` com título e ações.
- Busca/filtros simples quando aplicável.
- Estados vazio, carregando e erro amigáveis.
- Ações via `useServerFn` + invalidação de cache + toast do sonner.

### 2. Ajustes de suporte

- Garantir que `AdminSettingsForm` suporte as chaves usadas em gateway, aparencia, pixel, afiliados, bonus e regras.
- Adicionar ao `admin-lists.functions.ts` qualquer listagem auxiliar que falte (ex: detalhe de afiliado, histórico por usuário) sem duplicar o que já existe.
- Verificar se `admin.functions.ts` cobre todas as ações das telas acima; complementar se necessário.

### 3. Validação

- `bunx tsc --noEmit` ou `tsgo` para typecheck.
- Navegação real no preview: login como admin, abrir cada tela do menu, testar aprovação de depósito e liberação de comissão.

## Fora deste plano

- Integração real com OnixPay (Fase 2).
- Arquivos do jogo do panda (quando o .zip chegar).
- Refinamentos visuais não essenciais.
