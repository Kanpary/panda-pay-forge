<?php
// Proteção de acesso ao arquivo
if (!isset($pdo)) { die("Acesso restrito."); }

$mensagem = "";

// --- 1. PROCESSAMENTO DE AÇÕES (POST) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    try {
        switch ($_POST['action']) {
            case 'create_demo':
                $stmt = $pdo->prepare("INSERT INTO users (nome, email, telefone, senha, tipo_conta, is_demo, balance, created_at) VALUES (?, ?, ?, ?, 'DEMO', 1, ?, NOW())");
                $stmt->execute([
                    $_POST['nome'], 
                    $_POST['email'], 
                    $_POST['telefone'], // O telefone é obrigatório no seu banco
                    password_hash($_POST['senha'], PASSWORD_DEFAULT), 
                    $_POST['balance']
                ]);
                $mensagem = "Conta Demo criada com sucesso!";
                break;

            case 'update_balance':
                $stmt = $pdo->prepare("UPDATE users SET balance = ? WHERE id = ? AND tipo_conta = 'DEMO'");
                $stmt->execute([$_POST['balance'], $_POST['user_id']]);
                $mensagem = "Saldo fictício atualizado!";
                break;

            case 'delete_demo':
                $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND tipo_conta = 'DEMO'");
                $stmt->execute([$_POST['user_id']]);
                $mensagem = "Conta demo removida com sucesso.";
                break;
                
            // case 'update_rtp' removido — config de RTP Demo movida para "Dificuldade e RTP".

        }
    } catch (Exception $e) {
        $mensagem = "Erro: " . $e->getMessage();
    }
}

// --- 2. LÓGICA DE BUSCA E ESTATÍSTICAS ---
$stats = $pdo->query("SELECT COUNT(*) as total, SUM(balance) as saldo_total FROM users WHERE tipo_conta = 'DEMO'")->fetch(PDO::FETCH_ASSOC);

// RTP Demo removido desta tela — agora configurado em "Dificuldade e RTP".


$search = $_GET['search'] ?? '';
$where = $search ? "AND (nome LIKE :s OR email LIKE :s OR telefone LIKE :s)" : "";

$sql = "SELECT * FROM users WHERE tipo_conta = 'DEMO' $where ORDER BY created_at DESC";
$stmt = $pdo->prepare($sql);
if ($search) $stmt->bindValue(':s', "%$search%");
$stmt->execute();
$demos = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet">

<div class="space-y-8 animate-fade-in pb-12 font-sans">
    
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
            <h2 class="text-3xl font-black text-white tracking-tighter uppercase italic" style="font-family: 'Montserrat', sans-serif;">Contas Demo</h2>
            <p class="text-zinc-500 text-sm font-medium">Contas para influenciadores com saldo fictício e facilidade aumentada.</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
            <form method="GET" class="relative group">
                <input type="hidden" name="page" value="demo">
                <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"></i>
                <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" 
                    placeholder="Buscar conta..." 
                    class="bg-dark-900 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:border-amber-500/50 outline-none w-full sm:w-64 transition-all shadow-inner">
            </form>
            <button onclick="openCreateDemoModal()" class="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2 transform active:scale-95 uppercase tracking-widest">
                <i class="fas fa-plus"></i> Nova Demo
            </button>
        </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">

        <div class="group relative p-6 rounded-[2rem] bg-dark-900 border border-white/5 overflow-hidden transition-all hover:border-amber-500/30 shadow-xl">
            <div class="relative z-10 flex items-center gap-4">
                <div class="w-14 h-14 rounded-2xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-xl">
                    <i class="fas fa-users-viewfinder"></i>
                </div>
                <div>
                    <p class="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Contas Demo</p>
                    <h3 class="text-3xl font-black text-white italic"><?= $stats['total'] ?></h3>
                </div>
            </div>
        </div>

        <div class="group relative p-6 rounded-[2rem] bg-dark-900 border border-white/5 overflow-hidden transition-all hover:border-emerald-500/30 shadow-xl">
            <div class="relative z-10 flex items-center gap-4">
                <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-xl">
                    <i class="fas fa-coins"></i>
                </div>
                <div>
                    <p class="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Saldo Fictício</p>
                    <h3 class="text-2xl font-black text-emerald-400 italic">R$ <?= number_format($stats['saldo_total'] ?? 0, 2, ',', '.') ?></h3>
                </div>
            </div>
        </div>
    </div>

    <?php if($mensagem): ?>
        <div class="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-4 rounded-xl text-sm font-bold flex items-center gap-3">
            <i class="fas fa-check-circle text-lg"></i> <?= htmlspecialchars($mensagem) ?>
        </div>
    <?php endif; ?>

    <div class="bg-dark-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] bg-white/[0.02] border-b border-white/5">
                        <th class="py-6 px-8">Usuário / Email</th>
                        <th class="py-6 px-4 text-center">Saldo Demo</th>
                        <th class="py-6 px-4 text-center">Criado em</th>
                        <th class="py-6 px-8 text-right">Ação</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    <?php if(empty($demos)): ?>
                        <tr><td colspan="4" class="py-10 text-center text-zinc-600 italic">Nenhuma conta demo cadastrada.</td></tr>
                    <?php endif; ?>

                    <?php foreach ($demos as $d): ?>
                    <tr class="group hover:bg-white/[0.01] transition-colors">
                        <td class="py-5 px-8">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
                                    <?= strtoupper(substr($d['nome'], 0, 1)) ?>
                                </div>
                                <div>
                                    <p class="text-sm font-black text-white"><?= htmlspecialchars($d['nome']) ?></p>
                                    <p class="text-[10px] font-bold text-zinc-500"><?= htmlspecialchars($d['email'] ?? $d['telefone']) ?></p>
                                </div>
                            </div>
                        </td>
                        <td class="py-5 px-4 text-center">
                            <span class="font-black text-emerald-400">R$ <?= number_format($d['balance'], 2, ',', '.') ?></span>
                        </td>
                        <td class="py-5 px-4 text-center text-[10px] font-bold text-zinc-500">
                            <?= date('d/m/Y H:i', strtotime($d['created_at'])) ?>
                        </td>
                        <td class="py-5 px-8 text-right">
                            <div class="flex items-center justify-end gap-2">
                                <button onclick='openBalanceModal(<?= json_encode($d) ?>)' class="h-9 px-4 rounded-xl bg-white/5 border border-white/10 text-amber-500 hover:bg-amber-500 hover:text-black font-black text-[10px] uppercase transition-all flex items-center gap-2">
                                    <i class="fas fa-coins text-xs"></i> Saldo
                                </button>
                                <form method="POST" onsubmit="return confirm('Remover conta demo?')" class="inline">
                                    <input type="hidden" name="action" value="delete_demo">
                                    <input type="hidden" name="user_id" value="<?= $d['id'] ?>">
                                    <button type="submit" class="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                                        <i class="fas fa-trash text-xs"></i>
                                    </button>
                                </form>
                            </div>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<div id="modalCreate" class="fixed inset-0 z-[100] hidden items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="bg-dark-900 border border-amber-500/30 rounded-[2.5rem] w-full max-w-md p-10 animate-zoom-in">
        <h3 class="text-2xl font-black text-amber-500 uppercase italic mb-8 text-center">Nova Conta Demo</h3>
        <form method="POST" class="space-y-4">
            <input type="hidden" name="action" value="create_demo">
            <input type="text" name="nome" placeholder="Nome do Influencer" required class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none focus:border-amber-500 font-bold">
            <input type="text" name="telefone" placeholder="Telefone (Obrigatório)" required class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none focus:border-amber-500 font-bold">
            <input type="email" name="email" placeholder="E-mail de Acesso (Opcional)" class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none focus:border-amber-500 font-bold">
            <input type="password" name="senha" placeholder="Senha" required class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none focus:border-amber-500 font-bold">
            <input type="number" step="0.01" name="balance" value="10000.00" required class="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-5 py-3 text-emerald-400 font-black text-lg">
            <div class="flex gap-3 pt-6">
                <button type="button" onclick="closeModals()" class="flex-1 py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-bold uppercase text-xs">Cancelar</button>
                <button type="submit" class="flex-1 py-4 bg-amber-600 text-black rounded-2xl font-black uppercase text-xs">Criar Conta</button>
            </div>
        </form>
    </div>
</div>

<div id="modalBalance" class="fixed inset-0 z-[100] hidden items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="bg-dark-900 border border-emerald-500/30 rounded-[2.5rem] w-full max-w-md p-10 animate-zoom-in text-center">
        <h3 class="text-xl font-black text-white uppercase italic mb-8">Editar Saldo Demo</h3>
        <form method="POST" class="space-y-4">
            <input type="hidden" name="action" value="update_balance">
            <input type="hidden" name="user_id" id="bal_id">
            <input type="number" step="0.01" name="balance" id="bal_input" required class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-5 text-center text-3xl font-black text-emerald-400 outline-none focus:border-emerald-500">
            <div class="flex gap-3 pt-6 text-left">
                <button type="button" onclick="closeModals()" class="flex-1 py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-bold uppercase text-xs">Voltar</button>
                <button type="submit" class="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs">Atualizar</button>
            </div>
        </form>
    </div>
</div>

<script>
function openCreateDemoModal() { document.getElementById('modalCreate').classList.replace('hidden', 'flex'); }
function openBalanceModal(user) {
    document.getElementById('bal_id').value = user.id;
    document.getElementById('bal_input').value = user.balance; // Usando balance em vez de saldo
    document.getElementById('modalBalance').classList.replace('hidden', 'flex');
}
function closeModals() {
    ['modalCreate', 'modalBalance'].forEach(id => document.getElementById(id).classList.replace('flex', 'hidden'));
}
</script>

<style>
@keyframes zoom-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
.animate-zoom-in { animation: zoom-in 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
</style>