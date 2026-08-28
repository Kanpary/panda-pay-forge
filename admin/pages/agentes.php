<?php
// Proteção de acesso
if (!isset($pdo)) { die("Acesso restrito."); }

$mensagem = "";

// --- 1. PROCESSAMENTO DE AÇÕES (POST) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    try {
        if ($_POST['action'] === 'create_agent') {
            // Removemos a comissao_revshare da inserção
            $stmt = $pdo->prepare("INSERT INTO users (nome, email, senha, tipo_conta, comissao_cpa, tipo_cpa, comissao_disponivel, telefone) VALUES (?, ?, ?, 'AGENTE', ?, ?, 0, ?)");
            $stmt->execute([
                $_POST['usuario'], 
                $_POST['email'], 
                password_hash($_POST['senha'], PASSWORD_DEFAULT), 
                $_POST['comissao_cpa'] ?? 0,
                $_POST['tipo_cpa'] ?? 'PRIMEIRO',
                $_POST['telefone'] ?? 'AGENT_' . bin2hex(random_bytes(4))
            ]);
            $mensagem = "Agente Master criado com sucesso!";
        } 
        elseif ($_POST['action'] === 'edit_agent') {
            // Removemos a comissao_revshare da atualização
            $stmt = $pdo->prepare("UPDATE users SET nome = ?, email = ?, comissao_disponivel = ?, comissao_cpa = ?, tipo_cpa = ? WHERE id = ?");
            $stmt->execute([
                $_POST['usuario'], 
                $_POST['email'], 
                $_POST['saldo_comissao'],
                $_POST['comissao_cpa'],
                $_POST['tipo_cpa'],
                $_POST['user_id']
            ]);
            $mensagem = "Dados do agente atualizados!";
        }
    } catch (Exception $e) {
        $mensagem = "Erro: " . $e->getMessage();
    }
}

// --- 2. LÓGICA DE BUSCA E ESTATÍSTICAS ---
$search = $_GET['search'] ?? '';
$where = $search ? "AND (u.nome LIKE :s OR u.email LIKE :s)" : "";

// Estatísticas Globais dos Agentes (Apenas CPA)
$stats = $pdo->query("SELECT 
    COUNT(id) as total_agentes,
    SUM(indicados_count) as total_indicados,
    SUM(comissao_disponivel) as comissao_pendente,
    SUM(cpa_total) as comissao_paga
FROM users WHERE tipo_conta = 'AGENTE'")->fetch(PDO::FETCH_ASSOC);

// Lista de Agentes
$sql = "SELECT u.*, 
        (SELECT COUNT(DISTINCT d.user_id) 
         FROM deposits d 
         JOIN users u_ind ON d.user_id = u_ind.id 
         WHERE u_ind.referred_by = u.id AND d.status = 'paid') as total_depositantes
        FROM users u 
        WHERE u.tipo_conta = 'AGENTE' $where 
        ORDER BY u.comissao_disponivel DESC, u.indicados_count DESC";
        
$stmt = $pdo->prepare($sql);
if ($search) $stmt->bindValue(':s', "%$search%");
$stmt->execute();
$agentes = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<div class="space-y-8 animate-fade-in pb-12">
    
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
            <h2 class="text-3xl font-black text-white tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600">Gestão de Agentes</h2>
            <p class="text-zinc-500 text-sm">Controle de Agentes Master (Sub-afiliados) focado em comissionamento por CPA.</p>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-3">
            <form method="GET" class="relative">
                <input type="hidden" name="page" value="agentes">
                <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"></i>
                <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="Nome ou Email..." 
                    class="bg-dark-900 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:border-indigo-500/50 outline-none w-full sm:w-64 transition-all shadow-inner">
            </form>
            <button onclick="openModal('modalCreate')" class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 transform active:scale-95">
                <i class="fas fa-plus-circle text-lg"></i> Criar Agente
            </button>
        </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div class="p-6 rounded-[2rem] bg-dark-900 border border-white/5 relative overflow-hidden group">
            <div class="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
            <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total de Agentes</p>
            <h3 class="text-3xl font-black text-white"><?= number_format($stats['total_agentes'] ?? 0, 0, ',', '.') ?></h3>
        </div>
        <div class="p-6 rounded-[2rem] bg-dark-900 border border-white/5 relative overflow-hidden group">
            <div class="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
            <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Cadastros Gerados</p>
            <h3 class="text-3xl font-black text-white"><?= number_format($stats['total_indicados'] ?? 0, 0, ',', '.') ?></h3>
        </div>
        <div class="p-6 rounded-[2rem] bg-dark-900 border border-indigo-500/20 relative overflow-hidden group shadow-[0_0_30px_rgba(99,102,241,0.05)]">
            <div class="absolute -right-4 -top-4 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
            <p class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Comissões a Pagar</p>
            <h3 class="text-3xl font-black text-indigo-400">R$ <?= number_format($stats['comissao_pendente'] ?? 0, 2, ',', '.') ?></h3>
        </div>
        <div class="p-6 rounded-[2rem] bg-dark-900 border border-white/5 relative overflow-hidden group">
            <div class="absolute -right-4 -top-4 w-20 h-20 bg-zinc-500/10 rounded-full blur-2xl group-hover:bg-zinc-500/20 transition-all"></div>
            <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">CPA Histórico</p>
            <h3 class="text-3xl font-black text-zinc-300">R$ <?= number_format($stats['comissao_paga'] ?? 0, 2, ',', '.') ?></h3>
        </div>
    </div>

    <?php if($mensagem): ?>
        <div class="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 p-4 rounded-2xl text-sm font-bold flex items-center gap-3">
            <i class="fas fa-check-circle text-lg"></i> <?= htmlspecialchars($mensagem) ?>
        </div>
    <?php endif; ?>

    <div class="bg-dark-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] bg-white/[0.02]">
                        <th class="py-6 px-8">Agente Master</th>
                        <th class="py-6 px-4">Performance</th>
                        <th class="py-6 px-4">Taxa de CPA</th>
                        <th class="py-6 px-4">Saldo a Sacar</th>
                        <th class="py-6 px-8 text-right">Gerenciar</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    <?php foreach ($agentes as $a): ?>
                    <tr class="group hover:bg-white/[0.01] transition-colors">
                        <td class="py-5 px-8">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-black">
                                    <?= strtoupper(substr($a['nome'], 0, 1)) ?>
                                </div>
                                <div>
                                    <p class="text-sm font-bold text-white"><?= htmlspecialchars($a['nome']) ?></p>
                                    <p class="text-[10px] text-zinc-500 tracking-wider"><?= htmlspecialchars($a['email']) ?></p>
                                </div>
                            </div>
                        </td>
                        <td class="py-5 px-4">
                            <div class="flex flex-col gap-1">
                                <span class="text-xs font-bold text-white"><i class="fas fa-users text-zinc-500 mr-1"></i> <?= $a['indicados_count'] ?> Cadastros</span>
                                <span class="text-[10px] font-bold text-indigo-400"><i class="fas fa-money-bill-wave mr-1"></i> <?= $a['total_depositantes'] ?> Depositantes</span>
                            </div>
                        </td>
                        <td class="py-5 px-4">
                            <div class="flex gap-2">
                                <span class="text-[9px] font-black px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">CPA: <?= number_format($a['comissao_cpa'], 0) ?>%</span>
                                <?php if($a['tipo_cpa'] === 'RECORRENTE'): ?>
                                    <span class="text-[9px] font-black px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><i class="fas fa-sync-alt"></i> REC</span>
                                <?php endif; ?>
                            </div>
                        </td>
                        <td class="py-5 px-4">
                            <span class="text-sm font-black text-indigo-400">R$ <?= number_format($a['comissao_disponivel'], 2, ',', '.') ?></span>
                        </td>
                        <td class="py-5 px-8 text-right">
                            <button onclick='openManageModal(<?= json_encode($a) ?>)' class="bg-white/5 hover:bg-indigo-600 border border-white/5 text-zinc-300 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg flex items-center gap-2 ml-auto">
                                <i class="fas fa-cog"></i> Perfil VIP
                            </button>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php if(empty($agentes)): ?>
            <div class="py-16 text-center">
                <i class="fas fa-user-tie text-4xl text-zinc-800 mb-4"></i>
                <p class="text-zinc-500 text-sm font-medium">Nenhum Agente Master cadastrado.</p>
            </div>
        <?php endif; ?>
    </div>
</div>

<div id="modalCreate" class="fixed inset-0 z-[100] hidden items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="bg-dark-900 border border-indigo-500/20 rounded-[2.5rem] w-full max-w-md p-8 shadow-[0_0_50px_rgba(99,102,241,0.1)] animate-zoom-in">
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-black text-white uppercase italic">Novo Agente</h3>
            <button onclick="closeModals()" class="text-zinc-500 hover:text-red-500 transition-colors"><i class="fas fa-times text-xl"></i></button>
        </div>
        
        <form method="POST" class="space-y-4">
            <input type="hidden" name="action" value="create_agent">
            
            <div>
                <label class="text-[10px] font-bold text-zinc-500 uppercase ml-2 mb-1 block">Login do Agente</label>
                <input type="text" name="usuario" required class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none focus:border-indigo-500/50">
            </div>
            <div>
                <label class="text-[10px] font-bold text-zinc-500 uppercase ml-2 mb-1 block">Email Oficial</label>
                <input type="email" name="email" required class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none focus:border-indigo-500/50">
            </div>
            <div>
                <label class="text-[10px] font-bold text-zinc-500 uppercase ml-2 mb-1 block">Senha do Painel</label>
                <input type="password" name="senha" required class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none focus:border-indigo-500/50">
            </div>
            
            <div class="pt-2">
                <label class="text-[10px] font-bold text-blue-400 uppercase ml-2 mb-1 block">Teto de CPA (%)</label>
                <input type="number" step="0.01" name="comissao_cpa" placeholder="Ex: 50" class="w-full bg-black/40 border border-blue-500/20 rounded-2xl px-5 py-3 text-white outline-none focus:border-blue-500">
            </div>

            <div class="pt-2">
                <label class="text-[10px] font-bold text-emerald-400 uppercase ml-2 mb-1 block">Modelo de Pagamento (CPA)</label>
                <select name="tipo_cpa" required class="w-full bg-black/40 border border-emerald-500/20 rounded-2xl px-5 py-3 text-emerald-400 outline-none focus:border-emerald-500">
                    <option value="PRIMEIRO">Apenas no Primeiro Depósito</option>
                    <option value="RECORRENTE">Recorrente (Paga em todos os depósitos)</option>
                </select>
            </div>

            <button type="submit" class="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-95">Registrar Agente</button>
        </form>
    </div>
</div>

<div id="modalManage" class="fixed inset-0 z-[100] hidden items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
    <div class="bg-dark-900 border border-white/10 rounded-[2.5rem] w-full max-w-2xl p-8 my-auto animate-zoom-in">
        <div class="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
            <h3 class="text-xl font-black text-white uppercase italic flex items-center gap-3">
                <i class="fas fa-crown text-indigo-500"></i> Painel do Agente
            </h3>
            <button onclick="closeModals()" class="text-zinc-500 hover:text-red-500 transition-colors"><i class="fas fa-times text-xl"></i></button>
        </div>

        <div class="grid grid-cols-3 gap-3 mb-8">
            <div class="bg-black/30 p-4 rounded-2xl border border-white/5 text-center">
                <i class="fas fa-users text-zinc-500 text-lg mb-1"></i>
                <p class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Cadastros</p>
                <h4 class="text-lg font-black text-white" id="view_cadastros">0</h4>
            </div>
            <div class="bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10 text-center">
                <i class="fas fa-money-bill-wave text-indigo-500 text-lg mb-1"></i>
                <p class="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Depositantes</p>
                <h4 class="text-lg font-black text-indigo-400" id="view_deps">0</h4>
            </div>
            <div class="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10 text-center">
                <i class="fas fa-bullseye text-blue-500 text-lg mb-1"></i>
                <p class="text-[9px] font-bold text-blue-500 uppercase tracking-widest">CPA Realizado</p>
                <h4 class="text-lg font-black text-blue-400" id="view_cpa">R$ 0,00</h4>
            </div>
        </div>

        <form method="POST" class="space-y-5 bg-white/[0.02] p-6 rounded-3xl border border-white/5">
            <h4 class="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4"><i class="fas fa-pen text-[10px] mr-1"></i> Editar Dados e Taxas</h4>
            <input type="hidden" name="action" value="edit_agent">
            <input type="hidden" name="user_id" id="edit_id">
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="text-[10px] font-bold text-zinc-500 uppercase ml-2 mb-1 block">Nome do Agente</label>
                    <input type="text" name="usuario" id="edit_user" required class="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 text-sm">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-zinc-500 uppercase ml-2 mb-1 block">Email de Contato</label>
                    <input type="email" name="email" id="edit_email" required class="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 text-sm">
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="text-[10px] font-bold text-blue-400 uppercase ml-2 mb-1 block">CPA VIP (%)</label>
                    <input type="number" step="0.01" name="comissao_cpa" id="edit_cpa_perc" class="w-full bg-black/40 border border-blue-500/20 rounded-2xl px-4 py-3 text-white outline-none focus:border-blue-500 text-sm">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-indigo-400 uppercase ml-2 mb-1 block">Saldo Manual (R$)</label>
                    <input type="number" step="0.01" name="saldo_comissao" id="edit_com" required class="w-full bg-black/40 border border-indigo-500/30 rounded-2xl px-4 py-3 text-indigo-400 font-bold outline-none focus:border-indigo-500 text-sm shadow-inner">
                </div>
            </div>

            <div class="pt-2">
                <label class="text-[10px] font-bold text-emerald-400 uppercase ml-2 mb-1 block">Modelo de Pagamento (CPA)</label>
                <select name="tipo_cpa" id="edit_tipo_cpa" required class="w-full bg-black/40 border border-emerald-500/20 rounded-2xl px-5 py-3 text-emerald-400 outline-none focus:border-emerald-500 text-sm">
                    <option value="PRIMEIRO">Apenas no Primeiro Depósito</option>
                    <option value="RECORRENTE">Recorrente (Paga em todos os depósitos)</option>
                </select>
            </div>

            <div class="pt-4">
                <button type="submit" class="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex justify-center items-center gap-2">
                    <i class="fas fa-save"></i> Atualizar Agente
                </button>
            </div>
        </form>
    </div>
</div>

<script>
function openModal(id) { document.getElementById(id).classList.replace('hidden', 'flex'); }
function closeModals() {
    ['modalCreate', 'modalManage'].forEach(id => document.getElementById(id).classList.replace('flex', 'hidden'));
}

// Preenche o Modal de Gestão com os dados do Agente
function openManageModal(p) {
    document.getElementById('view_cadastros').innerText = p.indicados_count;
    document.getElementById('view_deps').innerText = p.total_depositantes || 0;
    document.getElementById('view_cpa').innerText = "R$ " + parseFloat(p.cpa_total).toFixed(2).replace('.', ',');

    document.getElementById('edit_id').value = p.id;
    document.getElementById('edit_user').value = p.nome;
    document.getElementById('edit_email').value = p.email;
    document.getElementById('edit_cpa_perc').value = p.comissao_cpa;
    document.getElementById('edit_tipo_cpa').value = p.tipo_cpa || 'PRIMEIRO';
    document.getElementById('edit_com').value = p.comissao_disponivel;
    
    openModal('modalManage');
}
</script>

<style>
@keyframes zoom-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
.animate-zoom-in { animation: zoom-in 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
</style>