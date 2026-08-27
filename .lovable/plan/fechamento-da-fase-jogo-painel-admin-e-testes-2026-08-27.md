# Fechamento da fase: jogo, painel admin e testes

## O que já está pronto
Banco (políticas, índices, `admin_overview` restrita, configurações semeadas), landing e telas de autenticação, gate de área logada, `/painel`, `/deposito`, `/saque`, `/afiliado`, e todas as funções de servidor de jogador e de administração.

## O que este plano entrega

### 1. Tela `/jogo` (reservada)
Rota protegida com:
- Saldo real e saldo bônus no topo, com aviso de que o jogo entra em breve.
- Botão de aposta desativado com selo "Em breve" (placeholder do motor de jogo).
- Histórico das últimas rodadas do usuário (aposta, ganho, resultado, data) lido de `game_history`, com estado vazio amigável.

### 2. Área administrativa
Layout `_authenticated/_admin` com verificação de papel de admin (bloqueia e redireciona quem não é admin), menu lateral no desktop e menu compacto no celular.

15 telas em `/admin/*`, cada uma consumindo as funções de servidor já escritas:
1. Visão geral (indicadores de `admin_overview`)
2. Depósitos (aprovar/recusar, com bônus e comissões)
3. Saques (aprovar/pagar/recusar com devolução de saldo)
4. Comissões (liberar/rejeitar)
5. Usuários (busca e listagem)
6. Detalhe/edição de usuário (saldos, bloqueio, percentuais)
7. Papéis de acesso (admin, agente, afiliado, usuário)
8. Contas demo (criar e listar)
9. Afiliados (rede e desempenho)
10. Histórico de jogo (auditoria de rodadas)
11. Configurações do gateway de pagamento
12. Aparência (marca, cores, textos)
13. Pixel e rastreamento
14. Regras de afiliados e bônus
15. RTP e limites de aposta + troca de senha do admin

### 3. Navegação inferior
"Início" passa a apontar para `/painel` (hoje aponta para `/`), com destaque de item ativo correto; logo do topo também vai para `/painel` quando logado.

### 4. Verificação
- Typecheck do projeto.
- Teste ponta a ponta no navegador: cadastro com `?ref=`, login, criação de depósito, aprovação manual do depósito pelo admin (checando bônus e comissão), pedido de saque, decisão do saque, liberação de comissão e abertura de todas as telas do admin.

## Notas técnicas
- Rotas novas: `src/routes/_authenticated/jogo.tsx`, `src/routes/_authenticated/_admin/route.tsx` e 15 arquivos `_admin/admin.*.tsx` seguindo a convenção de arquivos do roteador.
- Leituras de listagens do admin via novas funções de servidor `list*` em `src/lib/admin.functions.ts`, todas com `requireSupabaseAuth` + checagem de `has_role(admin)`; nada de acesso privilegiado sem validar o chamador.
- Dados carregados com TanStack Query (`useQuery`/`useServerFn`) e invalidação após cada ação; ações mostram toast de sucesso/erro via sonner.
- Reuso de `AppLayout`, `StatusBadge` e `brl` para manter o visual atual; sem cores fixas no código, apenas tokens do tema.
- Cada rota de conteúdo recebe `head()` própria com título e descrição; telas de admin marcadas como `noindex`.
