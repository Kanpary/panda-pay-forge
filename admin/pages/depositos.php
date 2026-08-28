<?php
// Proteção de acesso ao arquivo
if (!isset($pdo)) { die("Acesso restrito."); }

// --- BUSCA E ESTATÍSTICAS ---
$search = $_GET['search'] ?? '';
// Ajustado para buscar também por telefone, já que o e-mail pode ser nulo
$where = $search ? "WHERE (u.nome LIKE :s OR u.email LIKE :s OR u.telefone LIKE :s OR d.transaction_id LIKE :s)" : "";

// Estatísticas Rápidas (Baseado na tabela deposits)
$total_pago = $pdo->query("SELECT SUM(amount) FROM deposits WHERE status IN ('completed', 'paid')")->fetchColumn() ?: 0;
$total_pendente = $pdo->query("SELECT SUM(amount) FROM deposits WHERE status = 'pending'")->fetchColumn() ?: 0;

// Lista de Depósitos com Join na tabela users
$sql = "SELECT d.*, u.nome, u.email, u.telefone 
        FROM deposits d 
        LEFT JOIN users u ON d.user_id = u.id 
        $where 
        ORDER BY d.created_at DESC";

$stmt = $pdo->prepare($sql);
if ($search) $stmt->bindValue(':s', "%$search%");
$stmt->execute();
$depositos = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<div class="space-y-8 animate-fade-in pb-12">
    
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
            <h2 class="text-3xl font-black text-white tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Fluxo de Depósitos</h2>
            <p class="text-zinc-500 text-sm">Monitore as entradas financeiras do PandaPix.</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
            <form method="GET" class="relative group">
                <input type="hidden" name="page" value="depositos">
                <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-green-500 transition-colors"></i>
                <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" 
                    placeholder="Nome, tel ou ID Transação..." 
                    class="bg-dark-900 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:border-green-500/50 outline-none w-full sm:w-64 transition-all shadow-inner">
            </form>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="p-8 rounded-[2.5rem] bg-dark-900 border border-white/5 relative overflow-hidden group">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all"></div>
            <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1"><i class="fas fa-check-circle text-green-500 mr-1"></i> Total Recebido (Pago)</p>
            <h3 class="text-3xl font-black text-white italic text-green-500">R$ <?= number_format($total_pago, 2, ',', '.') ?></h3>
        </div>

        <div class="p-8 rounded-[2.5rem] bg-dark-900 border border-white/5 relative overflow-hidden group">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
            <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1"><i class="fas fa-clock text-amber-500 mr-1"></i> Aguardando Pagamento</p>
            <h3 class="text-3xl font-black text-white italic text-amber-500">R$ <?= number_format($total_pendente, 2, ',', '.') ?></h3>
        </div>
    </div>

    <div class="bg-dark-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] bg-white/[0.02]">
                        <th class="py-6 px-8">Jogador</th>
                        <th class="py-6 px-4">ID Transação</th>
                        <th class="py-6 px-4 text-center">Valor / Bônus</th>
                        <th class="py-6 px-4 text-center">Status</th>
                        <th class="py-6 px-4 text-right">Ação</th>
                        <th class="py-6 px-8 text-right">Data/Hora</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    <?php foreach ($depositos as $d): 
                        // Mapeamento de cores baseado nos status do banco u868110474_panda22
                        $status_str = strtolower($d['status']);
                        if ($status_str === 'completed' || $status_str === 'paid') {
                            $status_class = 'bg-green-500/10 text-green-500 border-green-500/20';
                            $status_label = 'PAGO';
                        } elseif ($status_str === 'pending') {
                            $status_class = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                            $status_label = 'PENDENTE';
                        } else {
                            $status_class = 'bg-red-500/10 text-red-500 border-red-500/20';
                            $status_label = strtoupper($status_str);
                        }
                    ?>
                    <tr class="group hover:bg-white/[0.01] transition-colors">
                        <td class="py-5 px-8">
                            <div class="flex flex-col">
                                <span class="text-sm font-bold text-white"><?= htmlspecialchars($d['nome'] ?? 'Desconhecido') ?></span>
                                <span class="text-[10px] text-zinc-500 tracking-wider">
                                    <?= htmlspecialchars($d['telefone'] ?? '---') ?> 
                                    <?= $d['email'] ? ' | ' . htmlspecialchars($d['email']) : '' ?>
                                </span>
                            </div>
                        </td>
                        <td class="py-5 px-4">
                            <span class="text-[10px] font-mono text-zinc-500 uppercase"><?= htmlspecialchars($d['transaction_id']) ?></span>
                        </td>
                        <td class="py-5 px-4 text-center">
                            <div class="flex flex-col items-center">
                                <span class="text-sm font-black text-white italic">R$ <?= number_format($d['amount'], 2, ',', '.') ?></span>
                                <?php if ($d['bonus_amount'] > 0): ?>
                                    <span class="text-[9px] font-bold text-yellow-500 uppercase">+ R$ <?= number_format($d['bonus_amount'], 2, ',', '.') ?> Bônus</span>
                                <?php endif; ?>
                            </div>
                        </td>
                        <td class="py-5 px-4 text-center">
                            <span class="text-[9px] font-black px-2 py-1 rounded-md <?= $status_class ?> border tracking-widest">
                                <?= $status_label ?>
                            </span>
                        </td>
                        <td class="py-5 px-4 text-right">
                            <?php if ($status_str === 'pending'): ?>
                                <button onclick="aprovarDeposito('<?= $d['transaction_id'] ?>')" class="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold rounded-lg transition-all shadow-lg active:scale-95">
                                    APROVAR
                                </button>
                            <?php endif; ?>
                        </td>
                        <td class="py-5 px-8 text-right text-[11px] font-medium text-zinc-500">
                            <?= date('d/m/Y', strtotime($d['created_at'])) ?>
                            <span class="block opacity-50 text-[9px]"><?= date('H:i:s', strtotime($d['created_at'])) ?></span>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        
        <?php if(empty($depositos)): ?>
            <div class="py-20 text-center">
                <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-600">
                    <i class="fas fa-receipt text-2xl"></i>
                </div>
                <p class="text-zinc-500 text-sm font-bold uppercase tracking-widest">Nenhum depósito encontrado.</p>
            </div>
        <?php endif; ?>
    </div>
</div>

<script>
async function aprovarDeposito(txId) {
    if (!confirm('Deseja realmente aprovar este depósito manualmente? Isso creditará o saldo ao jogador e pagará as comissões de CPA aos afiliados.')) return;

    try {
        const result = await adminApiRequest('admin/deposit/approve', {
            method: 'POST',
            body: JSON.stringify({ transaction_id: txId })
        });
        if (result.success) {
            alert(result.message || 'Depósito aprovado com sucesso!');
            location.reload();
        } else {
            alert(result.error || 'Erro ao aprovar depósito.');
        }
    } catch (e) {
        alert('Erro na requisição.');
    }
}
</script>
