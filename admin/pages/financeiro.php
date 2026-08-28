<?php
// Impede acesso direto
if (!isset($pdo)) { die("Acesso restrito."); }

$mensagem = "";
$status_type = "success";

// --- 1. LÓGICA DE ATUALIZAÇÃO (POST) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['btn_save_financeiro'])) {
    try {
        $pdo->beginTransaction();

        $updates = [
            'min_deposito' => $_POST['min_deposito'],
            'max_deposito' => $_POST['max_deposito'],
            'min_saque' => $_POST['min_saque'],
            'max_saque' => $_POST['max_saque'],
            'rollover_multiplier' => $_POST['fator_rollover'],
            'bonus_deposito_ativo' => $_POST['bonus_deposito_ativo'],
            'card1_valor' => $_POST['card1_valor'],
            'card1_bonus' => $_POST['card1_bonus'],
            'card2_valor' => $_POST['card2_valor'],
            'card2_bonus' => $_POST['card2_bonus'],
            'card3_valor' => $_POST['card3_valor'],
            'card3_bonus' => $_POST['card3_bonus']
        ];

        $stmt = $pdo->prepare("UPDATE game_settings SET value = ? WHERE slug = ?");
        foreach ($updates as $slug => $valor) {
            $stmt->execute([$valor, $slug]);
        }

        $pdo->commit();
        $mensagem = "Configurações financeiras aplicadas com sucesso!";
        $status_type = "success";
    } catch (Exception $e) {
        $pdo->rollBack();
        $mensagem = "Erro ao atualizar: " . $e->getMessage();
        $status_type = "error";
    }
}

// --- 2. BUSCA DE DADOS ---
$stmt = $pdo->query("SELECT slug, value FROM game_settings");
$settings = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $settings[$row['slug']] = $row['value'];
}
?>

<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet">

<div class="space-y-8 animate-fade-in pb-12 font-sans text-white">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 class="text-3xl uppercase tracking-tight" style="font-family: 'Montserrat', sans-serif; font-weight: 900;">
                <i class="fas fa-hand-holding-dollar text-green-500 mr-2"></i> Global Financeiro
            </h2>
            <p class="text-zinc-400 text-sm mt-1 font-medium">Limites de transações, regras de saque e Bônus.</p>
        </div>
        
        <?php if($mensagem): ?>
            <div class="<?= $status_type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-500' ?> border px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-3 shadow-lg backdrop-blur-md">
                <i class="fas <?= $status_type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle' ?> text-lg"></i> 
                <?= htmlspecialchars($mensagem) ?>
            </div>
        <?php endif; ?>
    </div>

    <form method="POST" class="space-y-8">
        <input type="hidden" name="btn_save_financeiro" value="1">

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            <div class="bg-dark-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative overflow-hidden">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 rounded-2xl bg-green-600/10 border border-green-500/20 flex items-center justify-center text-green-500">
                        <i class="fas fa-money-bill-transfer text-xl"></i>
                    </div>
                    <h3 class="text-xl uppercase tracking-wider font-extrabold text-white">Limites de Operação</h3>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                        <label class="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Depósito Mínimo (R$)</label>
                        <input type="number" step="0.01" name="min_deposito" value="<?= $settings['min_deposito'] ?? 10.00 ?>" class="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-black outline-none focus:border-green-500 transition-all">
                    </div>
                    <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                        <label class="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Depósito Máximo (R$)</label>
                        <input type="number" step="0.01" name="max_deposito" value="<?= $settings['max_deposito'] ?? 10000.00 ?>" class="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-black outline-none focus:border-green-500 transition-all">
                    </div>
                    <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                        <label class="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Saque Mínimo (R$)</label>
                        <input type="number" step="0.01" name="min_saque" value="<?= $settings['min_saque'] ?? 20.00 ?>" class="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-black outline-none focus:border-green-500 transition-all">
                    </div>
                    <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                        <label class="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Saque Máximo (R$)</label>
                        <input type="number" step="0.01" name="max_saque" value="<?= $settings['max_saque'] ?? 5000.00 ?>" class="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-black outline-none focus:border-green-500 transition-all">
                    </div>
                </div>
            </div>

            <div class="bg-dark-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl flex flex-col justify-center space-y-6 relative overflow-hidden">
                <div class="flex items-center gap-4 mb-2">
                    <div class="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                        <i class="fas fa-sync-alt text-xl"></i>
                    </div>
                    <h3 class="text-xl uppercase tracking-wider font-extrabold text-white">Regra de Rollover</h3>
                </div>

                <div class="bg-black/40 p-6 rounded-2xl border border-white/5">
                    <label class="block text-[11px] font-black text-purple-500 uppercase tracking-widest mb-3">Multiplicador Exigido</label>
                    <div class="flex flex-col sm:flex-row gap-5 items-center">
                        <div class="relative w-full sm:w-48">
                            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-black">X</span>
                            <input type="number" step="0.1" name="fator_rollover" value="<?= $settings['rollover_multiplier'] ?? '2.0' ?>" class="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-4 text-white text-2xl font-black outline-none focus:border-purple-500 transition-all">
                        </div>
                        <p class="text-xs text-zinc-400 max-w-sm leading-relaxed">
                            <b class="text-white">Exemplo:</b> Se o jogador depositar R$ 20,00 e o multiplicador for <span class="text-purple-400">2.0</span>, ele precisará apostar um total de <b class="text-white">R$ 40,00</b> no jogo para liberar o saque.
                        </p>
                    </div>
                </div>
            </div>

            <div class="xl:col-span-2 bg-dark-900 border border-yellow-500/20 rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative overflow-hidden">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-yellow-600/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                            <i class="fas fa-gift text-xl"></i>
                        </div>
                        <h3 class="text-xl uppercase tracking-wider font-extrabold text-white">Cards de Depósito (Bônus)</h3>
                    </div>
                    
                    <div class="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                        <label class="text-xs font-bold text-zinc-400 uppercase tracking-widest">Sistema de Bônus:</label>
                        <select name="bonus_deposito_ativo" class="bg-black text-white font-bold px-3 py-1 rounded-lg border border-white/10 outline-none">
                            <option value="1" <?= (int)($settings['bonus_deposito_ativo'] ?? 1) === 1 ? 'selected' : '' ?>>ATIVADO (Dar Bônus)</option>
                            <option value="0" <?= (int)($settings['bonus_deposito_ativo'] ?? 1) === 0 ? 'selected' : '' ?>>DESATIVADO (S/ Bônus)</option>
                        </select>
                    </div>
                </div>

                <p class="text-xs text-zinc-400 mb-4">Configure os 3 botões rápidos que aparecem na tela de depósito do jogador. Se o sistema estiver desativado, os valores aparecem, mas o bônus não é creditado.</p>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-black/40 p-5 rounded-2xl border border-white/5 shadow-inner">
                        <h4 class="text-yellow-500 font-black uppercase text-sm mb-4 text-center">Opção 1</h4>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Valor do Depósito (R$)</label>
                                <input type="number" step="0.01" name="card1_valor" value="<?= $settings['card1_valor'] ?? 19.90 ?>" class="w-full bg-dark-900 border border-white/10 rounded-lg px-3 py-2 text-white font-black text-center outline-none">
                            </div>
                            <div>
                                <label class="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Valor do Bônus (+ R$)</label>
                                <input type="number" step="0.01" name="card1_bonus" value="<?= $settings['card1_bonus'] ?? 10.00 ?>" class="w-full bg-dark-900 border border-yellow-500/30 rounded-lg px-3 py-2 text-yellow-500 font-black text-center outline-none">
                            </div>
                        </div>
                    </div>

                    <div class="bg-black/40 p-5 rounded-2xl border border-white/5 shadow-inner">
                        <h4 class="text-yellow-500 font-black uppercase text-sm mb-4 text-center">Opção 2</h4>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Valor do Depósito (R$)</label>
                                <input type="number" step="0.01" name="card2_valor" value="<?= $settings['card2_valor'] ?? 25.00 ?>" class="w-full bg-dark-900 border border-white/10 rounded-lg px-3 py-2 text-white font-black text-center outline-none">
                            </div>
                            <div>
                                <label class="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Valor do Bônus (+ R$)</label>
                                <input type="number" step="0.01" name="card2_bonus" value="<?= $settings['card2_bonus'] ?? 20.00 ?>" class="w-full bg-dark-900 border border-yellow-500/30 rounded-lg px-3 py-2 text-yellow-500 font-black text-center outline-none">
                            </div>
                        </div>
                    </div>

                    <div class="bg-black/40 p-5 rounded-2xl border border-white/5 shadow-inner">
                        <h4 class="text-yellow-500 font-black uppercase text-sm mb-4 text-center">Opção 3</h4>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Valor do Depósito (R$)</label>
                                <input type="number" step="0.01" name="card3_valor" value="<?= $settings['card3_valor'] ?? 30.00 ?>" class="w-full bg-dark-900 border border-white/10 rounded-lg px-3 py-2 text-white font-black text-center outline-none">
                            </div>
                            <div>
                                <label class="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Valor do Bônus (+ R$)</label>
                                <input type="number" step="0.01" name="card3_bonus" value="<?= $settings['card3_bonus'] ?? 30.00 ?>" class="w-full bg-dark-900 border border-yellow-500/30 rounded-lg px-3 py-2 text-yellow-500 font-black text-center outline-none">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <button type="submit" class="w-full bg-gradient-to-r from-green-500 to-emerald-700 hover:from-green-400 hover:to-emerald-600 text-white font-black py-5 rounded-[2rem] shadow-xl transition-all active:scale-[0.99] uppercase tracking-widest text-sm flex justify-center items-center gap-3">
            <i class="fas fa-save text-lg"></i> Atualizar Configurações Financeiras
        </button>
    </form>
</div>