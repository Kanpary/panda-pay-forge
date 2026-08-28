<?php
// Proteção de acesso
if (!isset($pdo)) { die("Acesso restrito."); }

$mensagem = "";

// --- LÓGICA DE UPLOAD ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_site'])) {
    $upload_dir = '../assets/uploads/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }

    try {
        $atualizou = false;

        foreach (['logo', 'bg'] as $type) {
            if (!empty($_FILES[$type]['name']) && $_FILES[$type]['error'] === UPLOAD_ERR_OK) {
                $ext = strtolower(pathinfo($_FILES[$type]['name'], PATHINFO_EXTENSION));
                
                // Validação de formato
                if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'])) {
                    $filename = $type . "_" . time() . "." . $ext;
                    $target = $upload_dir . $filename;
                    
                    if (move_uploaded_file($_FILES[$type]['tmp_name'], $target)) {
                        // Mapeamento para o seu banco: logo -> logo_url | bg -> banner_url
                        $col = ($type == 'logo') ? 'logo_url' : 'banner_url';
                        
                        // Salva o caminho relativo a partir da raiz (sem o ../)
                        $caminho_db = 'assets/uploads/' . $filename; 
                        
                        $stmt = $pdo->prepare("UPDATE config_jogo SET $col = ? WHERE id = 1");
                        $stmt->execute([$caminho_db]);
                        $atualizou = true;
                    }
                } else {
                    throw new Exception("Formato inválido para $type. Use PNG, JPG ou WEBP.");
                }
            }
        }
        
        if ($atualizou) {
            $mensagem = "Identidade visual atualizada com sucesso!";
        }
    } catch (Exception $e) {
        $mensagem = "Erro: " . $e->getMessage();
    }
}

// Busca as configurações da tabela config_jogo
$site = $pdo->query("SELECT logo_url, banner_url FROM config_jogo WHERE id = 1")->fetch(PDO::FETCH_ASSOC);

// Ajuste para exibição no painel (adiciona ../ para sair da pasta admin)
$logo_preview = !empty($site['logo_url']) ? "../" . $site['logo_url'] : "../assets/img/logo.png";
$bg_preview = !empty($site['banner_url']) ? "../" . $site['banner_url'] : "../assets/img/bg.jpg";
?>

<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet">

<div class="space-y-8 animate-fade-in pb-12 font-sans">
    
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
            <h2 class="text-3xl font-black text-white tracking-tighter uppercase italic" style="font-family: 'Montserrat', sans-serif;">
                <i class="fas fa-palette text-blue-500 mr-2"></i> Identidade Visual
            </h2>
            <p class="text-zinc-500 text-sm font-medium mt-1">Personalize a logomarca e o banner principal do Quebra Porquinho.</p>
        </div>
    </div>

    <?php if($mensagem): ?>
        <div class="<?= strpos($mensagem, 'Erro') !== false ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' ?> border p-4 rounded-xl text-sm font-bold flex items-center gap-3 shadow-lg">
            <i class="fas <?= strpos($mensagem, 'Erro') !== false ? 'fa-exclamation-triangle' : 'fa-check-circle' ?> text-lg"></i> 
            <?= htmlspecialchars($mensagem) ?>
        </div>
    <?php endif; ?>

    <div class="bg-dark-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        
        <form method="POST" enctype="multipart/form-data" class="relative z-10">
            <input type="hidden" name="update_site" value="1">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <div class="bg-black/40 border border-white/5 rounded-3xl p-8 shadow-inner flex flex-col h-full">
                    <h3 class="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3 mb-6">
                        <i class="fas fa-gem text-yellow-500"></i> Logomarca do Site
                    </h3>
                    
                    <div class="flex-1 flex flex-col items-center justify-center bg-dark-800 rounded-2xl border-2 border-dashed border-white/5 p-6 relative group mb-6 min-h-[200px]">
                        <img id="preview-logo" src="<?= htmlspecialchars($logo_preview) ?>" class="max-h-24 object-contain transition-all duration-300 group-hover:scale-110 drop-shadow-2xl">
                        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl backdrop-blur-sm pointer-events-none">
                            <span class="text-white font-bold text-xs uppercase tracking-widest"><i class="fas fa-upload mb-2 block text-center text-xl"></i> Trocar Logo</span>
                        </div>
                        <input type="file" name="logo" accept="image/*" onchange="previewImage(this, 'preview-logo')" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                    </div>
                    
                    <p class="text-center text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Use fundos transparentes (.PNG ou .SVG)</p>
                </div>

                <div class="bg-black/40 border border-white/5 rounded-3xl p-8 shadow-inner flex flex-col h-full">
                    <h3 class="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3 mb-6">
                        <i class="fas fa-image text-blue-500"></i> Banner / Background
                    </h3>
                    
                    <div class="flex-1 flex flex-col items-center justify-center bg-dark-800 rounded-2xl border-2 border-dashed border-white/5 p-2 relative group mb-6 min-h-[200px]">
                        <div id="preview-bg" class="w-full h-full min-h-[180px] rounded-xl bg-cover bg-center transition-all duration-300 group-hover:brightness-50" style="background-image: url('<?= htmlspecialchars($bg_preview) ?>');"></div>
                        <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none">
                            <span class="text-white font-bold text-xs uppercase tracking-widest"><i class="fas fa-image mb-2 block text-center text-xl"></i> Trocar Banner</span>
                        </div>
                        <input type="file" name="bg" accept="image/*" onchange="previewBackground(this, 'preview-bg')" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                    </div>
                    
                    <p class="text-center text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Recomendado: 1920x1080px (.JPG ou .WEBP)</p>
                </div>

            </div>

            <div class="mt-10 flex justify-center">
                <button type="submit" class="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-black px-16 py-5 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3 active:scale-95">
                    <i class="fas fa-save text-lg"></i> Aplicar Novas Imagens
                </button>
            </div>
        </form>
    </div>
</div>

<script>
function previewImage(input, id) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) { document.getElementById(id).src = e.target.result; }
        reader.readAsDataURL(input.files[0]);
    }
}

function previewBackground(input, id) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) { document.getElementById(id).style.backgroundImage = "url('" + e.target.result + "')"; }
        reader.readAsDataURL(input.files[0]);
    }
}
</script>