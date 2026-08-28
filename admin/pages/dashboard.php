<?php
// Garante acesso apenas através do index.php
if (!isset($pdo)) {
    die("Acesso direto não permitido.");
}

// ==========================================================
// 1. LÓGICA DO FILTRO DE DATAS
// ==========================================================
$data_inicio = $_GET['start'] ?? date('Y-m-d');
$data_fim = $_GET['end'] ?? date('Y-m-d');

// Validação de data (Formato YYYY-MM-DD)
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data_inicio)) {
    $data_inicio = date('Y-m-d');
}
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data_fim)) {
    $data_fim = date('Y-m-d');
}

$start_param = $data_inicio . ' 00:00:00';
$end_param = $data_fim . ' 23:59:59';

// ==========================================================
// 2. BUSCA DE DADOS COM FILTRO APLICADO (PREPARED STATEMENTS)
// ==========================================================
try {
    // 1. Usuários (Tabela: users)
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE created_at >= :start AND created_at <= :end");
    $stmt->execute(['start' => $start_param, 'end' => $end_param]);
    $total_usuarios = $stmt->fetchColumn() ?: 0;

    $stmt = $pdo->prepare("SELECT COUNT(DISTINCT referred_by) FROM users WHERE referred_by IS NOT NULL AND created_at >= :start AND created_at <= :end");
    $stmt->execute(['start' => $start_param, 'end' => $end_param]);
    $total_afiliados = $stmt->fetchColumn() ?: 0;

    // 2. Depósitos (Tabela: deposits | Coluna: amount)
    $stmt = $pdo->prepare("SELECT SUM(amount) as total, COUNT(*) as qtd FROM deposits WHERE created_at >= :start AND created_at <= :end");
    $stmt->execute(['start' => $start_param, 'end' => $end_param]);
    $dep_gerados = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("SELECT SUM(amount) as total, COUNT(*) as qtd FROM deposits WHERE status IN ('completed', 'paid') AND created_at >= :start AND created_at <= :end");
    $stmt->execute(['start' => $start_param, 'end' => $end_param]);
    $dep_pagos = $stmt->fetch(PDO::FETCH_ASSOC);

    $total_dep_gerados = $dep_gerados['total'] ?? 0;
    $qtd_dep_gerados = $dep_gerados['qtd'] ?? 0;
    $total_dep_pagos = $dep_pagos['total'] ?? 0;
    $qtd_dep_pagos = $dep_pagos['qtd'] ?? 0;

    // Ticket Médio
    $ticket_medio = $qtd_dep_pagos > 0 ? ($total_dep_pagos / $qtd_dep_pagos) : 0;

    // 3. Saques (Tabela: withdrawals | Coluna: amount)
    $stmt = $pdo->prepare("SELECT SUM(amount) as total, COUNT(*) as qtd FROM withdrawals WHERE created_at >= :start AND created_at <= :end");
    $stmt->execute(['start' => $start_param, 'end' => $end_param]);
    $saq_gerados = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("SELECT SUM(amount) as total, COUNT(*) as qtd FROM withdrawals WHERE status = 'completed' AND created_at >= :start AND created_at <= :end");
    $stmt->execute(['start' => $start_param, 'end' => $end_param]);
    $saq_aprovados = $stmt->fetch(PDO::FETCH_ASSOC);

    $total_saq_gerados = $saq_gerados['total'] ?? 0;
    $qtd_saq_gerados = $saq_gerados['qtd'] ?? 0;
    $total_saq_aprovados = $saq_aprovados['total'] ?? 0;
    $qtd_saq_aprovados = $saq_aprovados['qtd'] ?? 0;

    // 4. Lucro Líquido (Entradas - Saídas)
    $lucro_liquido = $total_dep_pagos - $total_saq_aprovados;

    // 5. Primeiro Depósito (FTD) no período selecionado
    // Query corrigida para ONLY_FULL_GROUP_BY e Prepared Statements
    $query_ftd = "
        SELECT SUM(d.amount) as ftd_valor, COUNT(d.user_id) as ftd_qtd
        FROM deposits d
        INNER JOIN (
            SELECT user_id, MIN(id) as first_id
            FROM deposits
            WHERE status IN ('completed', 'paid')
            GROUP BY user_id
        ) first_dep ON d.id = first_dep.first_id
        WHERE d.created_at >= :start
          AND d.created_at <= :end
    ";
    $stmt = $pdo->prepare($query_ftd);
    $stmt->execute(['start' => $start_param, 'end' => $end_param]);
    $ftd_data = $stmt->fetch(PDO::FETCH_ASSOC);
    $ftd_qtd = $ftd_data['ftd_qtd'] ?? 0;
    $ftd_valor = $ftd_data['ftd_valor'] ?? 0;

    // 6. Comissões (CPA e REVSHARE) - Baseado em saques de afiliados já pagos
    $stmt = $pdo->prepare("SELECT SUM(amount) FROM withdrawals WHERE type = 'affiliate' AND status = 'completed' AND created_at >= :start AND created_at <= :end");
    $stmt->execute(['start' => $start_param, 'end' => $end_param]);
    $comissoes_pagas = $stmt->fetchColumn() ?: 0;

    // 7. Estatísticas dos Jogos (Tabela: game_history)
    $stmt = $pdo->prepare("
        SELECT
            SUM(bet_amount) as apostado,
            SUM(win_amount) as ganhos
        FROM game_history
        WHERE created_at >= :start AND created_at <= :end
    ");
    $stmt->execute(['start' => $start_param, 'end' => $end_param]);
    $stats_jogo = $stmt->fetch(PDO::FETCH_ASSOC);

    $total_arrecadado_jogos = $stats_jogo['apostado'] ?? 0;
    $total_premios_pagos = $stats_jogo['ganhos'] ?? 0;
} catch (Exception $e) {
    error_log("Erro no Dashboard: " . $e->getMessage());
}

// Formatador
if (!function_exists('formatarBRL')) {
    function formatarBRL($valor) {
        return 'R$ ' . number_format((float)$valor, 2, ',', '.');
    }
}
?>

<div class="w-full flex-1 space-y-6 bg-transparent text-white">

    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
            <h1 class="text-2xl font-bold">Dashboard PandaPix</h1>
            <p class="text-zinc-500 text-sm">
                Relatório de <strong><?= date('d/m/Y', strtotime($data_inicio)) ?></strong> até <strong><?= date('d/m/Y', strtotime($data_fim)) ?></strong>
            </p>
        </div>

        <form method="GET" class="flex flex-wrap items-center gap-2 bg-dark-900 border border-white/5 px-3 py-2 rounded-xl shadow-sm">
            <input type="hidden" name="page" value="dashboard">
            <i class="far fa-calendar-alt text-zinc-500"></i>
            <input type="date" name="start" value="<?= htmlspecialchars($data_inicio) ?>" class="bg-transparent text-sm text-white border-none outline-none">
            <span class="text-zinc-600 text-xs uppercase font-bold">até</span>
            <input type="date" name="end" value="<?= htmlspecialchars($data_fim) ?>" class="bg-transparent text-sm text-white border-none outline-none">
            <button type="submit" class="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg text-sm transition-colors ml-2 font-bold">
                Filtrar
            </button>
        </form>
    </div>

    

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">

        <div class="bg-dark-900 border border-white/5 p-6 rounded-2xl hover:border-green-500/30 transition-all">
            <div class="flex justify-between items-center mb-4">
                <span class="text-xs font-bold text-zinc-500 uppercase tracking-widest">Novos Usuários</span>
                <div class="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500"><i class="fas fa-users"></i></div>
            </div>
            <h2 class="text-3xl font-black"><?= $total_usuarios ?></h2>
            <p class="text-[10px] text-zinc-500 mt-1">Sendo <?= $total_afiliados ?> com indicações ativas</p>
        </div>

        <div class="bg-dark-900 border border-white/5 p-6 rounded-2xl hover:border-green-500/30 transition-all">
            <div class="flex justify-between items-center mb-4">
                <span class="text-xs font-bold text-zinc-500 uppercase tracking-widest">Depósitos Pagos</span>
                <div class="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500"><i class="fas fa-hand-holding-usd"></i></div>
            </div>
            <h2 class="text-3xl font-black"><?= formatarBRL($total_dep_pagos) ?></h2>
            <p class="text-[10px] text-zinc-500 mt-1"><?= $qtd_dep_pagos ?> transações aprovadas</p>
        </div>

        <div class="bg-dark-900 border border-white/5 p-6 rounded-2xl hover:border-red-500/30 transition-all">
            <div class="flex justify-between items-center mb-4">
                <span class="text-xs font-bold text-zinc-500 uppercase tracking-widest">Saques Concluídos</span>
                <div class="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500"><i class="fas fa-external-link-alt"></i></div>
            </div>
            <h2 class="text-3xl font-black text-red-400"><?= formatarBRL($total_saq_aprovados) ?></h2>
            <p class="text-[10px] text-zinc-500 mt-1"><?= $qtd_saq_aprovados ?> saques pagos</p>
        </div>

        <div class="bg-dark-900 border border-white/5 p-6 rounded-2xl border-l-4 border-l-green-600 shadow-xl shadow-green-500/5">
            <div class="flex justify-between items-center mb-4">
                <span class="text-xs font-bold text-green-500 uppercase tracking-widest">Lucro Líquido</span>
                <div class="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400"><i class="fas fa-chart-line"></i></div>
            </div>
            <h2 class="text-3xl font-black <?= $lucro_liquido >= 0 ? 'text-white' : 'text-red-500' ?>">
                <?= formatarBRL($lucro_liquido) ?>
            </h2>
            <p class="text-[10px] text-zinc-500 mt-1">Balanço Financeiro</p>
        </div>

        <div class="bg-dark-900 border border-white/5 p-6 rounded-2xl">
            <div class="flex justify-between items-center mb-4">
                <span class="text-xs font-bold text-zinc-500 uppercase tracking-widest">Volume FTD</span>
                <i class="fas fa-user-check text-green-500"></i>
            </div>
            <h2 class="text-2xl font-bold"><?= formatarBRL($ftd_valor) ?></h2>
            <p class="text-[10px] text-zinc-500 mt-1"><?= $ftd_qtd ?> primeiros depósitos</p>
        </div>

        <div class="bg-dark-900 border border-white/5 p-6 rounded-2xl">
            <div class="flex justify-between items-center mb-4">
                <span class="text-xs font-bold text-zinc-500 uppercase tracking-widest">Comissões Pagas</span>
                <i class="fas fa-bullhorn text-orange-500"></i>
            </div>
            <h2 class="text-2xl font-bold"><?= formatarBRL($comissoes_pagas) ?></h2>
            <p class="text-[10px] text-zinc-500 mt-1">Total de saques de afiliados</p>
        </div>

        <div class="bg-dark-900 border border-white/5 p-6 rounded-2xl">
            <div class="flex justify-between items-center mb-4">
                <span class="text-xs font-bold text-zinc-500 uppercase tracking-widest">Volume de Apostas</span>
                <i class="fas fa-gamepad text-yellow-500"></i>
            </div>
            <h2 class="text-2xl font-bold"><?= formatarBRL($total_arrecadado_jogos) ?></h2>
            <p class="text-[10px] text-zinc-500 mt-1">Giro total no Panda</p>
        </div>

        <div class="bg-dark-900 border border-white/5 p-6 rounded-2xl">
            <div class="flex justify-between items-center mb-4">
                <span class="text-xs font-bold text-zinc-500 uppercase tracking-widest">Prêmios Pagos</span>
                <i class="fas fa-gift text-pink-500"></i>
            </div>
            <h2 class="text-2xl font-bold text-pink-400"><?= formatarBRL($total_premios_pagos) ?></h2>
            <p class="text-[10px] text-zinc-500 mt-1">Retorno aos jogadores</p>
        </div>

    </div>

    <?php
        $ggr = $total_arrecadado_jogos - $total_premios_pagos;
        $edge = ($total_arrecadado_jogos > 0) ? ($ggr / $total_arrecadado_jogos) * 100 : 0;
    ?>
    <div class="bg-green-600/10 border border-green-500/20 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="flex items-center gap-4 text-center md:text-left">
            <div class="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-xl shadow-lg shadow-green-500/20"><i class="fas fa-vault"></i></div>
            <div>
                <h3 class="font-black text-xl">GGR do Panda: <span class="text-green-400"><?= formatarBRL($ggr) ?></span></h3>
                <p class="text-zinc-500 text-xs">Diferença bruta entre o apostado e os prêmios coletados.</p>
            </div>
        </div>
        <div class="bg-dark-950/50 px-6 py-3 rounded-xl border border-white/5 text-center">
            <span class="block text-[10px] font-bold text-zinc-500 uppercase">Margem da Casa (Edge)</span>
            <span class="text-2xl font-black text-green-500"><?= number_format($edge, 2) ?>%</span>
        </div>
    </div>

</div>

