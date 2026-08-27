# Próxima fase: validação ponta a ponta do painel e do fluxo do jogador

As 14 telas do admin estão criadas e o typecheck passa. A próxima fase é provar que tudo funciona de verdade no navegador antes de partir para a integração real do Pix (OnixPay), que fica para a fase seguinte.

## O que será feito

### 1. Teste guiado no navegador (admin)

Login como admin e percorrer cada item do menu, registrando o que quebra:

- Visão geral, Depósitos, Saques, Comissões
- Usuários (lista + detalhe/edição), Papéis, Contas demo
- Afiliados, Histórico de rodadas
- Gateway, Aparência, Pixel, Regras, RTP

Para cada tela: carregamento, estado vazio, filtros/busca e ao menos uma ação (aprovar depósito, pagar saque, liberar comissão, salvar configuração).

### 2. Teste do fluxo do jogador

- Cadastro com código de afiliado, login, painel.
- Depósito: validação de mínimo/máximo e criação do registro pendente.
- Aprovação do depósito no admin e conferência do saldo creditado.
- Jogo: aposta respeitando limites, registro em histórico e atualização de saldo.
- Saque: chave Pix, saldo insuficiente, criação do pedido e aprovação no admin.
- Comissão de afiliado gerada a partir do depósito do indicado.

### 3. Correções

Corrigir os defeitos encontrados nos passos acima: consultas erradas, permissões (RLS/GRANT), invalidação de cache, estados vazios, mensagens de erro e rótulos em português.

### 4. Fechamento

- Typecheck limpo.
- Metadados de cabeçalho (título/descrição) revisados nas rotas públicas.
- Resumo do que foi validado e do que ficou pendente.

## Detalhes técnicos

- Testes conduzidos com Playwright headless contra o servidor local, com sessão Supabase restaurada, capturando screenshots e erros de console.
- Dados de teste criados pelo próprio fluxo do app (sem inserts manuais), exceto quando faltar um usuário admin/afiliado — nesse caso ajuste pontual de papel.
- Correções ficam restritas às rotas em `src/routes` e às funções em `src/lib/*.functions.ts`; mudanças de schema só se um erro real exigir.

## Fora desta fase

- Integração real com OnixPay (webhook de confirmação, geração de QR Code) — próxima fase.
- Substituição dos assets do jogo do panda.
- Refino visual não essencial.
