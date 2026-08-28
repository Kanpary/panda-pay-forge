<?php
// Proteção de acesso ao arquivo
if (!isset($pdo)) { die("Acesso restrito."); }

$mensagem = "";

// --- 1. LÓGICA DE ATUALIZAÇÃO (POST) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['btn_save_pixels'])) {
    try {
        $sql = "UPDATE config_pixels SET 
                facebook_pixel = ?, 
                google_analytics = ?, 
                tiktok_pixel = ?, 
                kwai_pixel = ? 
                WHERE id = 1";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $_POST['facebook_pixel'],
            $_POST['google_analytics'],
            $_POST['tiktok_pixel'],
            $_POST['kwai_pixel']
        ]);
        
        $mensagem = "Pixels de rastreamento atualizados com sucesso!";
    } catch (Exception $e) {
        $mensagem = "Erro ao salvar: " . $e->getMessage();
    }
}

// --- 2. BUSCA DE DADOS ---
$pixels = $pdo->query("SELECT * FROM config_pixels WHERE id = 1")->fetch(PDO::FETCH_ASSOC);
?>

<div class="space-y-8 animate-fade-in pb-12">
    
    <div>
        <h2 class="text-3xl font-black text-white tracking-tighter uppercase italic">Configuração de Pixels</h2>
        <p class="text-zinc-500 text-sm">Insira os scripts de rastreamento das redes sociais para monitorar suas conversões.</p>
    </div>

    <?php if($mensagem): ?>
        <div class="bg-blue-600/10 border border-blue-500/20 text-blue-400 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-pulse">
            <i class="fas fa-check-circle"></i> <?= htmlspecialchars($mensagem) ?>
        </div>
    <?php endif; ?>

    <form method="POST" class="space-y-8">
        <input type="hidden" name="btn_save_pixels" value="1">

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <div class="bg-dark-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-4">
                <div class="flex items-center gap-4 mb-2">
                    <div class="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 text-xl">
                        <i class="fab fa-facebook-f"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white">Facebook Pixel</h3>
                </div>
                <textarea name="facebook_pixel" placeholder="Cole aqui o script do Facebook (Head)..." 
                    class="w-full h-40 bg-black/40 border border-white/5 rounded-2xl p-5 text-zinc-400 font-mono text-xs focus:border-blue-500/50 outline-none transition-all resize-none"><?= htmlspecialchars($pixels['facebook_pixel'] ?? '') ?></textarea>
            </div>

            <div class="bg-dark-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-4">
                <div class="flex items-center gap-4 mb-2">
                    <div class="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 text-xl">
                        <i class="fab fa-google"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white">Google Analytics / Ads</h3>
                </div>
                <textarea name="google_analytics" placeholder="Cole aqui o script do Google GTAG..." 
                    class="w-full h-40 bg-black/40 border border-white/5 rounded-2xl p-5 text-zinc-400 font-mono text-xs focus:border-orange-500/50 outline-none transition-all resize-none"><?= htmlspecialchars($pixels['google_analytics'] ?? '') ?></textarea>
            </div>

            <div class="bg-dark-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-4">
                <div class="flex items-center gap-4 mb-2">
                    <div class="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-500 text-xl">
                        <i class="fab fa-tiktok"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white">TikTok Pixel</h3>
                </div>
                <textarea name="tiktok_pixel" placeholder="Cole aqui o script do TikTok..." 
                    class="w-full h-40 bg-black/40 border border-white/5 rounded-2xl p-5 text-zinc-400 font-mono text-xs focus:border-pink-500/50 outline-none transition-all resize-none"><?= htmlspecialchars($pixels['tiktok_pixel'] ?? '') ?></textarea>
            </div>

            <div class="bg-dark-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-4">
                <div class="flex items-center gap-4 mb-2">
                    <div class="w-12 h-12 rounded-2xl bg-orange-600/10 flex items-center justify-center text-orange-600 text-xl">
                        <i class="fas fa-video"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white">Kwai Pixel</h3>
                </div>
                <textarea name="kwai_pixel" placeholder="Cole aqui o script do Kwai..." 
                    class="w-full h-40 bg-black/40 border border-white/5 rounded-2xl p-5 text-zinc-400 font-mono text-xs focus:border-orange-600/50 outline-none transition-all resize-none"><?= htmlspecialchars($pixels['kwai_pixel'] ?? '') ?></textarea>
            </div>

        </div>

        <button type="submit" name="btn_save_pixels" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] uppercase tracking-widest text-sm">
            Salvar Scripts de Rastreamento
        </button>
    </form>
</div>