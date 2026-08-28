<?php
// Proteção de acesso
if (!isset($pdo)) { die("Acesso restrito."); }

$mensagem = "";
$msg_type = "success";

function normalizeAffiliateCommissionModeAdmin($mode) {
    $mode = (string)$mode;
    return in_array($mode, ['first_deposit_only', 'all_deposits'], true) ? $mode : 'first_deposit_only';
}

// --- 1. PROCESSAMENTO DE AÇÕES (POST) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    try {
        if ($_POST['action'] === 'update_commission_mode') {
            $mode = normalizeAffiliateCommissionModeAdmin($_POST['affiliate_commission_mode'] ?? 'first_deposit_only');
            $skipCount = isset($_POST['pular_cpa']) ? (int)$_POST['pular_cpa'] : 0;
            if ($skipCount < 0) $skipCount = 0;
            if ($skipCount > 10) $skipCount = 10;

            $stmt = $pdo->prepare("
                INSERT INTO game_settings (slug, value, description)
                VALUES ('affiliate_commission_mode', 0, ?)
                ON DUPLICATE KEY UPDATE value = 0, description = VALUES(description)
            ");
            $stmt->execute([$mode]);

            $stmt = $pdo->prepare("
                INSERT INTO game_settings (slug, value, description)
                VALUES ('pular_cpa', ?, 'Quantidade de depÃ³sitos que contam antes de pular o prÃ³ximo')
                ON DUPLICATE KEY UPDATE value = VALUES(value), description = VALUES(description)
            ");
            $stmt->execute([$skipCount]);

            $mensagem = "ConfiguraÃ§Ã£o de CPA atualizada!";
        }
        elseif ($_POST['action'] === 'create_affiliate') {
            $aff_code = bin2hex(random_bytes(4));

            $nome = trim($_POST['nome'] ?? '');
            $email = trim($_POST['email'] ?? '');
            $telefone = trim($_POST['telefone'] ?? '');
            $senha = $_POST['senha'] ?? '';

            $comissao_cpa = isset($_POST['comissao_cpa']) && $_POST['comissao_cpa'] !== ''
                ? (float)$_POST['comissao_cpa']
                : 50.00; // Novo Afiliado manual: sugestão 50%

            $comissao_cpa_nivel2 = isset($_POST['comissao_cpa_nivel2']) && $_POST['comissao_cpa_nivel2'] !== ''
                ? (float)$_POST['comissao_cpa_nivel2']
                : 30.00; // Novo Afiliado manual: sugestão 30%

            $stmt = $pdo->prepare("
                INSERT INTO users 
                (
                    nome,
                    email,
                    telefone,
                    senha,
                    tipo_conta,
                    is_influencer,
                    is_demo,
                    comissao_cpa,
                    comissao_cpa_nivel2,
                    comissao_revshare,
                    affiliate_code,
                    created_at
                ) 
                VALUES (?, ?, ?, ?, 'AFILIADO', 0, 0, ?, ?, 0, ?, NOW())
            ");
            $stmt->execute([
                $nome,
                $email,
                $telefone,
                password_hash($senha, PASSWORD_DEFAULT),
                $comissao_cpa,
                $comissao_cpa_nivel2,
                $aff_code
            ]);

            $mensagem = "Afiliado criado com sucesso!";
        } 
        elseif ($_POST['action'] === 'edit_affiliate') {
            $user_id = (int)($_POST['user_id'] ?? 0);
            $stmtFetch = $pdo->prepare("SELECT comissao_cpa, comissao_cpa_nivel2 FROM users WHERE id = ?");
            $stmtFetch->execute([$user_id]);
            $u = $stmtFetch->fetch();

            $cpa1 = (isset($_POST['comissao_cpa']) && $_POST['comissao_cpa'] !== '') 
                ? (float)$_POST['comissao_cpa'] 
                : (float)($u['comissao_cpa'] ?? 50.00);

            $cpa2 = (isset($_POST['comissao_cpa_nivel2']) && $_POST['comissao_cpa_nivel2'] !== '') 
                ? (float)$_POST['comissao_cpa_nivel2'] 
                : (float)($u['comissao_cpa_nivel2'] ?? 30.00);

            $stmt = $pdo->prepare("
                UPDATE users 
                SET 
                    comissao_cpa = ?, 
                    comissao_cpa_nivel2 = ? 
                WHERE id = ?
            ");
            $stmt->execute([$cpa1, $cpa2, $user_id]);

            $mensagem = "Taxas do afiliado atualizadas!";
        }
    } catch (Exception $e) {
        $mensagem = "Erro: " . $e->getMessage();
        $msg_type = "error";
    }
}

// --- 2. ESTATÍSTICAS PARA OS CARDS ---
$stmtMode = $pdo->prepare("SELECT description FROM game_settings WHERE slug = 'affiliate_commission_mode' LIMIT 1");
$stmtMode->execute();
$affiliateCommissionMode = normalizeAffiliateCommissionModeAdmin($stmtMode->fetchColumn() ?: 'first_deposit_only');

$stmtSkipCpa = $pdo->prepare("SELECT value FROM game_settings WHERE slug = 'pular_cpa' LIMIT 1");
$stmtSkipCpa->execute();
$affiliateSkipCpa = (int)round((float)($stmtSkipCpa->fetchColumn() ?: 0));
if ($affiliateSkipCpa < 0) $affiliateSkipCpa = 0;
if ($affiliateSkipCpa > 10) $affiliateSkipCpa = 10;

$stats = $pdo->query("
    SELECT 
        COUNT(id) as total_afiliados,
        (SELECT COUNT(*) FROM users WHERE referred_by IN (SELECT id FROM users WHERE tipo_conta IN ('AFILIADO', 'DEMO')) AND (cpf IS NOT NULL AND cpf != '')) as total_indicados,
        SUM(comissao_disponivel) as comissao_pendente
    FROM users 
    WHERE tipo_conta IN ('AFILIADO', 'DEMO')
")->fetch(PDO::FETCH_ASSOC);

// --- 3. LISTAGEM DE AFILIADOS ---
$afiliados = $pdo->query("
    SELECT 
        u.*, 
        (SELECT COUNT(*) FROM users WHERE referred_by = u.id AND (cpf IS NOT NULL AND cpf != '')) as total_leads,
        (SELECT COUNT(*) FROM users WHERE referred_by IN (SELECT id FROM users WHERE referred_by = u.id) AND (cpf IS NOT NULL AND cpf != '')) as total_leads_l2
    FROM users u 
    WHERE tipo_conta IN ('AFILIADO', 'DEMO') 
    ORDER BY u.id DESC
")->fetchAll(PDO::FETCH_ASSOC);
?>

<div class="space-y-6 animate-fade-in pb-12">
    
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 class="text-2xl font-black text-white uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Gestão de Afiliados</h2>
            <p class="text-zinc-500 text-sm">Acompanhe seus parceiros e configure as taxas de CPA nível 1 e CPA nível 2 por afiliado.</p>
        </div>
        <button onclick="openModal('modalCreate')" class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-95 flex items-center gap-2">
            <i class="fas fa-user-plus text-lg"></i> Novo Afiliado
        </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div class="p-6 rounded-[2rem] bg-dark-900 border border-white/5 relative overflow-hidden group">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl"></div>
            <div class="relative z-10">
                <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1"><i class="fas fa-users text-green-500 mr-1"></i> Parceiros Ativos</p>
                <h3 class="text-3xl font-black text-white"><?= (int)($stats['total_afiliados'] ?? 0) ?></h3>
            </div>
        </div>
        <div class="p-6 rounded-[2rem] bg-dark-900 border border-white/5 relative overflow-hidden group">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
            <div class="relative z-10">
                <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1"><i class="fas fa-mouse-pointer text-blue-500 mr-1"></i> Total de Leads (Indicados)</p>
                <h3 class="text-3xl font-black text-white"><?= (int)($stats['total_indicados'] ?? 0) ?></h3>
            </div>
        </div>
        <div class="p-6 rounded-[2rem] bg-dark-900 border border-emerald-500/20 relative overflow-hidden group">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <div class="relative z-10">
                <p class="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1"><i class="fas fa-wallet mr-1"></i> Comissões Disponíveis</p>
                <h3 class="text-3xl font-black text-emerald-400">R$ <?= number_format((float)($stats['comissao_pendente'] ?? 0), 2, ',', '.') ?></h3>
            </div>
        </div>
    </div>

    <?php if($mensagem): ?>
        <div class="<?= $msg_type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400' ?> p-4 rounded-2xl text-sm font-bold flex items-center gap-3 border">
            <i class="fas <?= $msg_type === 'success' ? 'fa-check-circle' : 'fa-triangle-exclamation' ?>"></i>
            <?= htmlspecialchars($mensagem) ?>
        </div>
    <?php endif; ?>

    <div class="bg-dark-900 border border-white/5 rounded-[2rem] p-6 shadow-2xl">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
            <div>
                <h3 class="text-lg font-black text-white uppercase italic">Comissões de Afiliados</h3>
                <p class="text-zinc-500 text-xs">Defina quando os depósitos dos indicados entram nas comissões e métricas.</p>
            </div>
        </div>
        <form method="POST" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="hidden" name="action" value="update_commission_mode">
            <label class="block cursor-pointer">
                <input type="radio" name="affiliate_commission_mode" value="first_deposit_only" class="sr-only peer" <?= $affiliateCommissionMode === 'first_deposit_only' ? 'checked' : '' ?> onchange="this.form.submit()">
                <div class="h-full rounded-2xl border p-5 transition-all <?= $affiliateCommissionMode === 'first_deposit_only' ? 'border-green-500 bg-green-500/10' : 'border-white/10 bg-black/30 hover:border-green-500/40' ?>">
                    <div class="flex items-center justify-between gap-4 mb-3">
                        <span class="text-sm font-black text-white uppercase">Somente primeiro depósito</span>
                        <span class="w-5 h-5 rounded-full border flex items-center justify-center <?= $affiliateCommissionMode === 'first_deposit_only' ? 'border-green-400 bg-green-500' : 'border-zinc-600' ?>">
                            <?php if ($affiliateCommissionMode === 'first_deposit_only'): ?><i class="fas fa-check text-[10px] text-white"></i><?php endif; ?>
                        </span>
                    </div>
                    <p class="text-xs text-zinc-400 leading-relaxed">O afiliado recebe comissão apenas no primeiro depósito de cada indicado. Depósitos posteriores não geram comissão e não aparecem nas métricas financeiras.</p>
                </div>
            </label>
            <label class="block cursor-pointer">
                <input type="radio" name="affiliate_commission_mode" value="all_deposits" class="sr-only peer" <?= $affiliateCommissionMode === 'all_deposits' ? 'checked' : '' ?> onchange="this.form.submit()">
                <div class="h-full rounded-2xl border p-5 transition-all <?= $affiliateCommissionMode === 'all_deposits' ? 'border-green-500 bg-green-500/10' : 'border-white/10 bg-black/30 hover:border-green-500/40' ?>">
                    <div class="flex items-center justify-between gap-4 mb-3">
                        <span class="text-sm font-black text-white uppercase">Todos os depósitos</span>
                        <span class="w-5 h-5 rounded-full border flex items-center justify-center <?= $affiliateCommissionMode === 'all_deposits' ? 'border-green-400 bg-green-500' : 'border-zinc-600' ?>">
                            <?php if ($affiliateCommissionMode === 'all_deposits'): ?><i class="fas fa-check text-[10px] text-white"></i><?php endif; ?>
                        </span>
                    </div>
                    <p class="text-xs text-zinc-400 leading-relaxed">O afiliado recebe comissão sobre todos os depósitos dos indicados, conforme sua porcentagem de CPA configurada.</p>
                </div>
            </label>
            <div class="md:col-span-2 rounded-2xl border border-white/10 bg-black/30 p-5">
                <div class="flex flex-col md:flex-row md:items-end gap-4">
                    <div class="flex-1">
                        <label class="text-[10px] font-bold text-zinc-500 uppercase ml-2 mb-2 block">Pular CPA</label>
                        <input type="number" name="pular_cpa" min="0" max="10" step="1" value="<?= (int)$affiliateSkipCpa ?>" class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none focus:border-green-500/50">
                        <p class="text-xs text-zinc-400 mt-2 leading-relaxed">0 desativa. 1 contabiliza um depÃ³sito e pula o prÃ³ximo. 2 contabiliza dois e pula o prÃ³ximo.</p>
                    </div>
                    <button type="submit" class="md:w-auto w-full px-6 py-3 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-black uppercase text-xs shadow-lg transition-all">
                        Salvar CPA
                    </button>
                </div>
            </div>
        </form>
    </div>

    <div class="bg-dark-900 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] bg-white/[0.02]">
                        <th class="py-6 px-6">Nome / Parceiro</th>
                        <th class="py-6 px-4 text-center">Indicados</th>
                        <th class="py-6 px-4 text-center">CPA N1 / CPA N2</th>
                        <th class="py-6 px-4 text-center">Saldo</th>
                        <th class="py-6 px-6 text-right">Ação</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    <?php foreach ($afiliados as $a): ?>
                    <tr class="hover:bg-white/[0.01] transition-colors">
                        <td class="py-4 px-6">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center font-black">
                                    <?= htmlspecialchars(strtoupper(substr($a['nome'], 0, 1))) ?>
                                </div>
                                <div>
                                    <div class="text-sm font-bold text-white"><?= htmlspecialchars($a['nome']) ?></div>
                                    <div class="text-[10px] text-zinc-500"><?= htmlspecialchars($a['telefone']) ?></div>
                                </div>
                            </div>
                        </td>
                        <td class="py-4 px-4 text-center text-zinc-300 font-bold whitespace-nowrap">
                            <span class="text-blue-400">L1: <?= (int)$a['total_leads'] ?></span><br>
                            <span class="text-purple-400">L2: <?= (int)($a['total_leads_l2'] ?? 0) ?></span>
                        </td>
                        <td class="py-4 px-4 text-center">
                            <div class="space-y-1">
                                <span class="inline-block px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-black">
                                    CPA N1: <?= number_format((float)$a['comissao_cpa'], 0, ',', '.') ?>%
                                </span>
                                <span class="inline-block px-2 py-1 rounded bg-purple-500/10 text-purple-400 text-[10px] font-black">
                                    CPA N2: <?= number_format((float)($a['comissao_cpa_nivel2'] ?? 0), 0, ',', '.') ?>%
                                </span>
                            </div>
                        </td>
                        <td class="py-4 px-4 text-center font-black text-emerald-400">
                            R$ <?= number_format((float)$a['comissao_disponivel'], 2, ',', '.') ?>
                        </td>
                        <td class="py-4 px-6 text-right">
                            <div class="flex items-center justify-end gap-2">
                                <button onclick='openLeadsModal(<?= (int)$a['id'] ?>, "<?= htmlspecialchars($a['nome']) ?>")' class="text-blue-400 hover:text-white border border-blue-500/20 hover:bg-blue-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all">
                                    <i class="fas fa-eye mr-1"></i> Leads
                                </button>
                                <button onclick='openEditModal(<?= json_encode($a, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>)' class="text-zinc-400 hover:text-white border border-white/5 hover:bg-green-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all">
                                    <i class="fas fa-edit mr-1"></i> Taxas
                                </button>
                            </div>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                    <?php if (empty($afiliados)): ?>
                    <tr>
                        <td colspan="5" class="py-10 text-center text-zinc-500 italic text-sm">Nenhum afiliado cadastrado ainda.</td>
                    </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<div id="modalCreate" class="fixed inset-0 z-[100] hidden items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="bg-dark-900 border border-white/10 rounded-[2.5rem] w-full max-w-md p-8 animate-zoom-in">
        <h3 class="text-xl font-black text-white uppercase italic mb-6">Cadastrar Parceiro</h3>
        <form method="POST" class="space-y-4">
            <input type="hidden" name="action" value="create_affiliate">

            <input type="text" name="nome" placeholder="Nome Completo" required class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none focus:border-green-500/50">
            <input type="text" name="telefone" placeholder="Telefone (DD9...)" required class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none focus:border-green-500/50">
            <input type="email" name="email" placeholder="E-mail (opcional)" class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none focus:border-green-500/50">
            <input type="password" name="senha" placeholder="Senha de Acesso" required class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none focus:border-green-500/50">
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="text-[10px] font-bold text-zinc-500 uppercase ml-2 mb-1 block">CPA Nível 1 (%)</label>
                    <input type="number" step="0.01" name="comissao_cpa" placeholder="50.00" value="50.00" class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-zinc-500 uppercase ml-2 mb-1 block">CPA Nível 2 (%)</label>
                    <input type="number" step="0.01" name="comissao_cpa_nivel2" placeholder="30.00" value="30.00" class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none">
                </div>
...
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="text-[10px] font-bold text-blue-400 uppercase ml-2 mb-1 block">CPA Nível 1 (%)</label>
                    <input type="number" step="0.01" name="comissao_cpa" id="edit_cpa" class="w-full bg-black/40 border border-blue-500/30 rounded-2xl px-4 py-4 text-white font-black text-2xl text-center outline-none">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-purple-400 uppercase ml-2 mb-1 block">CPA Nível 2 (%)</label>
                    <input type="number" step="0.01" name="comissao_cpa_nivel2" id="edit_cpa_n2" class="w-full bg-black/40 border border-purple-500/30 rounded-2xl px-4 py-4 text-white font-black text-2xl text-center outline-none">
                </div>
            </div>
            
            <div class="flex gap-3 pt-6">
                <button type="button" onclick="closeModals()" class="flex-1 py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-bold uppercase text-xs hover:bg-zinc-700 transition-all">Fechar</button>
                <button type="submit" class="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-green-500 transition-all">Salvar</button>
            </div>
        </form>
    </div>
</div>

<!-- Modal de Detalhes de Leads -->
<div id="modalLeads" class="fixed inset-0 z-[100] hidden items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
    <div class="bg-dark-900 border border-white/10 rounded-[2.5rem] w-full max-w-2xl p-8 my-auto animate-zoom-in">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h3 class="text-xl font-black text-white uppercase italic">Indicados e Comissões</h3>
                <p id="leads_nome_display" class="text-blue-400 text-[10px] font-bold uppercase tracking-widest"></p>
            </div>
            <button onclick="closeModals()" class="text-zinc-500 hover:text-red-500 transition-colors"><i class="fas fa-times text-xl"></i></button>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5">
                        <th class="py-4 px-2">Indicado</th>
                        <th class="py-4 px-2 text-center">Nível</th>
                        <th class="py-4 px-2 text-center">Depósito</th>
                        <th class="py-4 px-2 text-center">Taxa (%)</th>
                        <th class="py-4 px-2 text-center">Comissão</th>
                        <th class="py-4 px-2 text-right">Data</th>
                    </tr>
                </thead>
                <tbody id="leads_table_body" class="divide-y divide-white/5">
                    <!-- Preenchido via JS -->
                </tbody>
            </table>
        </div>
        <p id="leads_empty_msg" class="hidden text-center text-zinc-500 italic py-10">Nenhuma comissão de CPA registrada para este afiliado.</p>

        <div class="flex pt-8 justify-center">
            <button type="button" onclick="closeModals()" class="px-8 py-3 bg-zinc-800 text-zinc-400 rounded-2xl font-bold uppercase text-xs hover:bg-zinc-700 transition-all">Fechar Detalhes</button>
        </div>
    </div>
</div>

<script>
function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.replace('hidden', 'flex');
}

function closeModals() {
    ['modalCreate', 'modalEdit', 'modalLeads'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.replace('flex', 'hidden');
    });
}

function openEditModal(data) {
    document.getElementById('edit_id').value = data.id;
    document.getElementById('edit_nome_display').innerText = data.nome;
    document.getElementById('edit_cpa').value = data.comissao_cpa ?? 0;
    document.getElementById('edit_cpa_n2').value = data.comissao_cpa_nivel2 ?? 0;
    openModal('modalEdit');
}

async function openLeadsModal(affId, affNome) {
    document.getElementById('leads_nome_display').innerText = 'Afiliado: ' + affNome;
    const body = document.getElementById('leads_table_body');
    const emptyMsg = document.getElementById('leads_empty_msg');
    const headers = document.querySelectorAll('#modalLeads thead th');
    const fmtMoney = (value) => Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtDate = (value) => value ? new Date(value).toLocaleString('pt-BR') : '-';

    if (headers.length >= 6) {
        headers[1].textContent = 'Status';
        headers[2].textContent = 'Confirmados';
        headers[3].textContent = 'Comissao';
        headers[4].textContent = 'Observacao';
        headers[5].textContent = 'Ultima atividade';
    }
    if (emptyMsg) {
        emptyMsg.textContent = 'Nenhum indicado encontrado para este afiliado.';
    }
    
    body.innerHTML = '<tr><td colspan="6" class="py-10 text-center"><i class="fas fa-spinner fa-spin mr-2"></i> Carregando...</td></tr>';
    emptyMsg.classList.add('hidden');
    openModal('modalLeads');

    try {
        const res = await fetch(`../api.php?route=admin/affiliate/leads&affiliate_id=${encodeURIComponent(affId)}`);
        const json = await res.json();
        const rows = json && json.success && json.data ? (json.data.lead_records || []) : [];
        
        if (rows.length > 0) {
            let html = '';
            rows.forEach((l) => {
                const reason = l.status_reason || '-';
                const confirmed = `${Number(l.confirmed_deposit_count || 0)} / R$ ${fmtMoney(l.confirmed_deposit_total || 0)}`;
                html += `
                    <tr class="text-xs hover:bg-white/5 transition-colors">
                        <td class="py-4 px-2">
                            <div class="font-bold text-white">${l.nome || '-'}</div>
                            <div class="text-[10px] text-zinc-500">${l.telefone || ''} ${l.cpf ? ' | CPF: ' + l.cpf : ''}</div>
                        </td>
                        <td class="py-4 px-2 text-center">
                            <span class="px-2 py-1 rounded bg-zinc-800 text-zinc-400 font-black text-[9px] uppercase tracking-tighter">${l.status_label || '-'}</span>
                        </td>
                        <td class="py-4 px-2 text-center text-emerald-400 font-bold">${confirmed}</td>
                        <td class="py-4 px-2 text-center text-blue-400 font-black italic">R$ ${fmtMoney(l.commission_total || 0)}</td>
                        <td class="py-4 px-2 text-zinc-400 text-[10px]">${reason}</td>
                        <td class="py-4 px-2 text-right text-zinc-600 text-[10px]">${fmtDate(l.last_activity_at || l.created_at)}</td>
                    </tr>
                `;
            });
            body.innerHTML = html;
        } else {
            body.innerHTML = '';
            emptyMsg.classList.remove('hidden');
        }
    } catch (e) {
        body.innerHTML = '<tr><td colspan="6" class="py-10 text-center text-red-500"><i class="fas fa-times mr-2"></i> Erro ao carregar dados.</td></tr>';
    }
}
</script>

<style>
@keyframes zoom-in { 
    from { opacity: 0; transform: scale(0.9); } 
    to { opacity: 1; transform: scale(1); } 
}
.animate-zoom-in { animation: zoom-in 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
</style>
