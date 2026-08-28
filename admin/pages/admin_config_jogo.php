<?php
// Impede o acesso direto
if (!isset($pdo)) { die("Acesso negado."); }

$msg = "";
$msg_type = "success"; 
$upload_dir = "../assets/uploads/";

if (!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);

// --- 1. PROCESSAR CONFIGURAÇÕES DO PANDA (RTP E MULTIPLICADORES) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['btn_salvar_config'])) {
    try {
        $settings = [
            'rtp_real' => $_POST['rtp_real'] ?? 50,
            'rtp_demo' => $_POST['rtp_demo'] ?? 50,
            'flower_value_real_1' => str_replace(',', '.', $_POST['flower_value_real_1'] ?? 1),
            'flower_value_real_2' => str_replace(',', '.', $_POST['flower_value_real_2'] ?? 1),
            'flower_value_real_3' => str_replace(',', '.', $_POST['flower_value_real_3'] ?? 1),
            'flower_value_real_4' => str_replace(',', '.', $_POST['flower_value_real_4'] ?? 1),
            'flower_value_demo_1' => str_replace(',', '.', $_POST['flower_value_demo_1'] ?? 50),
            'flower_value_demo_2' => str_replace(',', '.', $_POST['flower_value_demo_2'] ?? 50),
            'flower_value_demo_3' => str_replace(',', '.', $_POST['flower_value_demo_3'] ?? 50),
            'flower_value_demo_4' => str_replace(',', '.', $_POST['flower_value_demo_4'] ?? 50),
            'leaf_value_real' => str_replace(',', '.', $_POST['leaf_value_real'] ?? 0),
            'leaf_value_demo' => str_replace(',', '.', $_POST['leaf_value_demo'] ?? 0),
            'gift_value_real_1' => str_replace(',', '.', $_POST['gift_value_real_1'] ?? 1),
            'gift_value_real_2' => str_replace(',', '.', $_POST['gift_value_real_2'] ?? 1),
            'gift_value_real_3' => str_replace(',', '.', $_POST['gift_value_real_3'] ?? 1),
            'gift_value_real_4' => str_replace(',', '.', $_POST['gift_value_real_4'] ?? 1),
            'gift_value_demo_1' => str_replace(',', '.', $_POST['gift_value_demo_1'] ?? 50),
            'gift_value_demo_2' => str_replace(',', '.', $_POST['gift_value_demo_2'] ?? 50),
            'gift_value_demo_3' => str_replace(',', '.', $_POST['gift_value_demo_3'] ?? 50),
            'gift_value_demo_4' => str_replace(',', '.', $_POST['gift_value_demo_4'] ?? 50),
            'branch_value_real_1' => str_replace(',', '.', $_POST['branch_value_real_1'] ?? 0),
            'branch_value_real_2' => str_replace(',', '.', $_POST['branch_value_real_2'] ?? 0),
            'branch_value_real_3' => str_replace(',', '.', $_POST['branch_value_real_3'] ?? 0),
            'branch_value_real_4' => str_replace(',', '.', $_POST['branch_value_real_4'] ?? 0),
            'branch_value_demo_1' => str_replace(',', '.', $_POST['branch_value_demo_1'] ?? 0),
            'branch_value_demo_2' => str_replace(',', '.', $_POST['branch_value_demo_2'] ?? 0),
            'branch_value_demo_3' => str_replace(',', '.', $_POST['branch_value_demo_3'] ?? 0),
            'branch_value_demo_4' => str_replace(',', '.', $_POST['branch_value_demo_4'] ?? 0),
            'difficulty_increment_real' => str_replace(',', '.', $_POST['difficulty_increment_real'] ?? 2),
            'difficulty_increment_demo' => str_replace(',', '.', $_POST['difficulty_increment_demo'] ?? 2)

        ];

        foreach ($settings as $slug => $val) {
            $stmt = $pdo->prepare("INSERT INTO game_settings (slug, value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)");
            $stmt->execute([$slug, $val, '']);
        }

        $msg = "Configurações do PandaPix atualizadas!";
    } catch (Exception $e) {
        $msg = "Erro: " . $e->getMessage();
        $msg_type = "error";
    }
}

// --- 2. PROCESSAR ASSETS VISUAIS ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['btn_upload_assets'])) {
    $assets = ['logo_url' => 'logo_file', 'banner_url' => 'banner_file'];

    foreach ($assets as $slug => $input_name) {
        if (!empty($_FILES[$input_name]['name'])) {
            $ext = pathinfo($_FILES[$input_name]['name'], PATHINFO_EXTENSION);
            $newName = $slug . "_" . time() . "." . $ext;
            if (move_uploaded_file($_FILES[$input_name]['tmp_name'], $upload_dir . $newName)) {
                $path = "assets/uploads/" . $newName;
                $pdo->prepare("UPDATE game_settings SET description = ? WHERE slug = ?")->execute([$path, $slug]);
                $msg = "Identidade visual atualizada!";
            }
        }
    }
}

// --- 3. CARREGAR CONFIGURAÇÕES TIPO KEY-PAIR ---
$stmt = $pdo->query("SELECT slug, value, description FROM game_settings");
$cfg = [];
while($row = $stmt->fetch()) {
    $cfg[$row['slug']] = $row['value'];
    $cfg[$row['slug'].'_desc'] = $row['description'];
}

if (!function_exists('cfg_value')) {
    function cfg_value($cfg, $slug, $default = '0.00') {
        return htmlspecialchars((string)($cfg[$slug] ?? $default));
    }
}

for ($i = 1; $i <= 4; $i++) {
    if (!isset($cfg['gift_value_real_'.$i])) {
        $cfg['gift_value_real_'.$i] = $cfg['bonus_max_real'] ?? '1.00';
    }
    if (!isset($cfg['gift_value_demo_'.$i])) {
        $cfg['gift_value_demo_'.$i] = $cfg['bonus_max_demo'] ?? '50.00';
    }
    if (!isset($cfg['flower_value_real_'.$i])) {
        $cfg['flower_value_real_'.$i] = $cfg['flower_value_min'] ?? ($cfg['flower_value_real'] ?? '1.00');
    }
    if (!isset($cfg['flower_value_demo_'.$i])) {
        $cfg['flower_value_demo_'.$i] = $cfg['flower_value_min_demo'] ?? ($cfg['flower_value_demo'] ?? '50.00');
    }
    if (!isset($cfg['branch_value_real_'.$i])) {
        $cfg['branch_value_real_'.$i] = '0.00';
    }
    if (!isset($cfg['branch_value_demo_'.$i])) {
        $cfg['branch_value_demo_'.$i] = '0.00';
    }
}


if (!isset($cfg['difficulty_increment_real'])) $cfg['difficulty_increment_real'] = $cfg['difficulty_increment'] ?? '2.0';
if (!isset($cfg['difficulty_increment_demo'])) $cfg['difficulty_increment_demo'] = $cfg['difficulty_increment'] ?? '2.0';
if (!isset($cfg['flower_mult_real'])) $cfg['flower_mult_real'] = '1.00';
if (!isset($cfg['flower_mult_demo'])) $cfg['flower_mult_demo'] = '1.00';
if (!isset($cfg['obstacle_mult_real'])) $cfg['obstacle_mult_real'] = '1.00';
if (!isset($cfg['obstacle_mult_demo'])) $cfg['obstacle_mult_demo'] = '1.00';
?>

<div class="space-y-8 pb-20">
    
    <div class="flex justify-between items-center">
        <h2 class="text-3xl text-white font-black uppercase tracking-tighter" style="font-family: 'Montserrat', sans-serif;">
            <i class="fas fa-paw text-green-500 mr-2"></i> Engine PandaPix
        </h2>
        
        <?php if($msg): ?>
            <div class="px-6 py-2 rounded-full text-xs font-black uppercase animate-pulse <?= $msg_type == 'success' ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-red-500/10 border-red-500 text-red-400' ?> border">
                <?= htmlspecialchars($msg) ?>
            </div>
        <?php endif; ?>
    </div>

    <form method="POST" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- CARD 1 — Configuração Conta Real -->
        <div class="bg-dark-900 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl flex flex-col">
            <h3 class="text-sm font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <i class="fas fa-coins text-green-500"></i> Configuração Conta Real
            </h3>
            
            <div class="space-y-8 flex-1">
                <!-- Dificuldade RTP -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="md:col-span-2">
                        <label class="block text-[10px] font-black text-zinc-600 uppercase mb-2 flex justify-between">
                            <span>Dificuldade Inicial (%)</span>
                            <span id="rtp_real_val" class="text-green-500"><?= cfg_value($cfg, 'rtp_real', '50') ?>%</span>
                        </label>
                        <input type="range" step="1" min="0" max="95" name="rtp_real" value="<?= cfg_value($cfg, 'rtp_real', '50') ?>" 
                               oninput="document.getElementById('rtp_real_val').innerText = this.value + '%'"
                               class="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-green-500">
                        <p class="text-[9px] text-zinc-500 mt-2 italic">Dificuldade inicial: frequência de obstáculos e velocidade inicial.</p>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-[10px] font-black text-zinc-600 uppercase mb-2">Incremento de dificuldade por etapa (%)</label>
                        <input type="number" step="0.1" min="0" name="difficulty_increment_real" value="<?= cfg_value($cfg, 'difficulty_increment_real', '2.0') ?>" class="w-full bg-black border border-white/10 rounded-2xl p-4 text-white font-black text-2xl focus:border-green-500 transition-all outline-none">
                        <p class="text-[9px] text-zinc-500 mt-2 italic">Valor somado à dificuldade atual cada vez que o jogador passar por um galho sem perder.</p>
                    </div>
                </div>

                <!-- Valores da Flor -->
                <div class="pt-6 border-t border-white/5">
                    <h4 class="text-[11px] font-black text-white uppercase tracking-widest mb-1 flex items-center gap-2">Valores da Flor</h4>
                    <p class="text-[9px] text-zinc-500 mb-4 italic">Configure até 4 valores possíveis para a flor.</p>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <?php for($i = 1; $i <= 4; $i++): ?>
                            <div>
                                <label class="block text-[9px] font-black text-zinc-600 uppercase mb-1">Valor <?= $i ?></label>
                                <input type="number" step="0.01" min="0" name="flower_value_real_<?= $i ?>" value="<?= cfg_value($cfg, 'flower_value_real_'.$i, '1.00') ?>" class="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-bold outline-none text-center">
                            </div>
                        <?php endfor; ?>
                    </div>
                </div>
                
                <!-- Folha removida (Conta Real) -->

                <!-- Valores dos Presentes -->
                <div class="pt-6 border-t border-white/5">
                    <h4 class="text-[11px] font-black text-white uppercase tracking-widest mb-1 flex items-center gap-2">Valores dos Presentes</h4>
                    <p class="text-[9px] text-zinc-500 mb-4 italic">Configure até 4 valores possíveis para os presentes.</p>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <?php for($i = 1; $i <= 4; $i++): ?>
                            <div>
                                <label class="block text-[9px] font-black text-zinc-600 uppercase mb-1">Valor <?= $i ?></label>
                                <input type="number" step="0.01" min="0" name="gift_value_real_<?= $i ?>" value="<?= cfg_value($cfg, 'gift_value_real_'.$i, '1.00') ?>" class="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-bold outline-none text-center">
                            </div>
                        <?php endfor; ?>
                    </div>
                </div>

                <!-- Valores dos Ramos -->
                <div class="pt-6 border-t border-white/5">
                    <h4 class="text-[11px] font-black text-white uppercase tracking-widest mb-1 flex items-center gap-2">Valores dos Ramos</h4>
                    <p class="text-[9px] text-zinc-500 mb-4 italic">Configure até 4 valores possíveis para os ramos/galhos.</p>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <?php for($i = 1; $i <= 4; $i++): ?>
                            <div>
                                <label class="block text-[9px] font-black text-zinc-600 uppercase mb-1">Valor <?= $i ?></label>
                                <input type="number" step="0.01" min="0" name="branch_value_real_<?= $i ?>" value="<?= cfg_value($cfg, 'branch_value_real_'.$i, '0.00') ?>" class="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-bold outline-none text-center">
                            </div>
                        <?php endfor; ?>
                    </div>
                </div>
            </div>
        </div>

        <!-- CARD 2 — Configuração Conta Demo -->
        <div class="bg-dark-900 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl flex flex-col">
            <h3 class="text-sm font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <i class="fas fa-gamepad text-emerald-500"></i> Configuração Conta Demo
            </h3>
            
            <div class="space-y-8 flex-1">
                <!-- Dificuldade RTP -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="md:col-span-2">
                        <label class="block text-[10px] font-black text-zinc-600 uppercase mb-2 flex justify-between">
                            <span>Dificuldade Inicial (%)</span>
                            <span id="rtp_demo_val" class="text-emerald-500"><?= cfg_value($cfg, 'rtp_demo', '50') ?>%</span>
                        </label>
                        <input type="range" step="1" min="0" max="95" name="rtp_demo" value="<?= cfg_value($cfg, 'rtp_demo', '50') ?>" 
                               oninput="document.getElementById('rtp_demo_val').innerText = this.value + '%'"
                               class="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-emerald-500">
                        <p class="text-[9px] text-zinc-500 mt-2 italic">Dificuldade inicial: frequência de obstáculos e velocidade inicial.</p>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-[10px] font-black text-zinc-600 uppercase mb-2">Incremento de dificuldade por etapa (%)</label>
                        <input type="number" step="0.1" min="0" name="difficulty_increment_demo" value="<?= cfg_value($cfg, 'difficulty_increment_demo', '2.0') ?>" class="w-full bg-black border border-white/10 rounded-2xl p-4 text-white font-black text-2xl focus:border-green-500 transition-all outline-none">
                        <p class="text-[9px] text-zinc-500 mt-2 italic">Valor somado à dificuldade atual cada vez que o jogador passar por um galho sem perder.</p>
                    </div>
                </div>

                <!-- Valores da Flor -->
                <div class="pt-6 border-t border-white/5">
                    <h4 class="text-[11px] font-black text-white uppercase tracking-widest mb-1 flex items-center gap-2">Valores da Flor</h4>
                    <p class="text-[9px] text-zinc-500 mb-4 italic">Configure até 4 valores possíveis para a flor.</p>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <?php for($i = 1; $i <= 4; $i++): ?>
                            <div>
                                <label class="block text-[9px] font-black text-zinc-600 uppercase mb-1">Valor <?= $i ?></label>
                                <input type="number" step="0.01" min="0" name="flower_value_demo_<?= $i ?>" value="<?= cfg_value($cfg, 'flower_value_demo_'.$i, '50.00') ?>" class="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-bold outline-none text-center">
                            </div>
                        <?php endfor; ?>
                    </div>
                </div>

                <!-- Folha removida (Conta Demo) -->

                <!-- Valores dos Presentes -->
                <div class="pt-6 border-t border-white/5">
                    <h4 class="text-[11px] font-black text-white uppercase tracking-widest mb-1 flex items-center gap-2">Valores dos Presentes</h4>
                    <p class="text-[9px] text-zinc-500 mb-4 italic">Configure até 4 valores possíveis para os presentes.</p>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <?php for($i = 1; $i <= 4; $i++): ?>
                            <div>
                                <label class="block text-[9px] font-black text-zinc-600 uppercase mb-1">Valor <?= $i ?></label>
                                <input type="number" step="0.01" min="0" name="gift_value_demo_<?= $i ?>" value="<?= cfg_value($cfg, 'gift_value_demo_'.$i, '50.00') ?>" class="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-bold outline-none text-center">
                            </div>
                        <?php endfor; ?>
                    </div>
                </div>

                <!-- Valores dos Ramos (MOVED HERE) -->
                <div class="pt-6 border-t border-white/5">
                    <h4 class="text-[11px] font-black text-white uppercase tracking-widest mb-1 flex items-center gap-2">Valores dos Ramos</h4>
                    <p class="text-[9px] text-zinc-500 mb-4 italic">Configure até 4 valores possíveis para os ramos/galhos.</p>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <?php for($i = 1; $i <= 4; $i++): ?>
                            <div>
                                <label class="block text-[9px] font-black text-zinc-600 uppercase mb-1">Valor <?= $i ?></label>
                                <input type="number" step="0.01" min="0" name="branch_value_demo_<?= $i ?>" value="<?= cfg_value($cfg, 'branch_value_demo_'.$i, '0.00') ?>" class="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-bold outline-none text-center">
                            </div>
                        <?php endfor; ?>
                    </div>
                </div>
            </div>
        </div>

        <!-- Card "Regras de Depósito e Saque" removido — agora gerenciado em "Taxas e Limites" -->

        <div class="lg:col-span-2">
            <button type="submit" name="btn_salvar_config" class="w-full bg-green-600 hover:bg-green-500 text-white font-black uppercase py-4 rounded-2xl transition-all shadow-lg shadow-green-600/10">Salvar Ajustes do Jogo</button>
        </div>
    </form>

    <div class="bg-dark-900 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
        <h3 class="text-sm font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2"><i class="fas fa-images text-blue-500"></i> Assets Visuais (Panda)</h3>
        <form method="POST" enctype="multipart/form-data" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div class="flex items-center gap-6 p-4 bg-black/40 rounded-3xl border border-white/5">
                <div class="w-16 h-16 bg-dark-800 rounded-2xl flex items-center justify-center p-2 border border-white/10">
                    <img src="../<?= htmlspecialchars($cfg['logo_url_desc'] ?? 'logopandapix.png') ?>" class="max-w-full max-h-full object-contain" id="prev_logo">
                </div>
                <div class="flex-1">
                    <label class="block text-[10px] font-black text-zinc-500 uppercase mb-1">Logo Jogo</label>
                    <input type="file" name="logo_file" onchange="previewFile(this, 'prev_logo')" class="text-xs text-zinc-600">
                </div>
            </div>

            <div class="flex items-center gap-6 p-4 bg-black/40 rounded-3xl border border-white/5">
                <div class="w-24 h-16 bg-dark-800 rounded-2xl flex items-center justify-center overflow-hidden border border-white/10">
                    <img src="../<?= htmlspecialchars($cfg['banner_url_desc'] ?? 'banner1.png') ?>" class="w-full h-full object-cover" id="prev_banner">
                </div>
                <div class="flex-1">
                    <label class="block text-[10px] font-black text-zinc-500 uppercase mb-1">Banner Modal</label>
                    <input type="file" name="banner_file" onchange="previewFile(this, 'prev_banner')" class="text-xs text-zinc-600">
                </div>
            </div>

            <button type="submit" name="btn_upload_assets" class="md:col-span-2 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase py-4 rounded-2xl transition-all">Atualizar Imagens do Site</button>
        </form>
    </div>
</div>

<script>
function previewFile(input, id) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) { document.getElementById(id).src = e.target.result; }
        reader.readAsDataURL(input.files[0]);
    }
}
</script>
