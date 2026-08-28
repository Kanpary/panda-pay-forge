<?php
// Proteção de acesso
if (!isset($pdo)) { die("Acesso restrito."); }

$mensagem = "";
$status_type = "error";

// Busca os dados do Admin atual
$stmt_check = $pdo->prepare("SELECT nome, email FROM users WHERE id = ?");
$stmt_check->execute([$_SESSION['admin_id']]);
$admin_data = $stmt_check->fetch(PDO::FETCH_ASSOC);

// --- LÓGICA DE PROCESSAMENTO ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // TROCA DE SENHA
        if (isset($_POST['action']) && $_POST['action'] === 'change_password') {
            $nova_senha = $_POST['nova_senha'];
            $confirma_senha = $_POST['confirma_senha'];

            if ($nova_senha !== $confirma_senha) {
                throw new Exception("As senhas informadas não coincidem.");
            }

            if (strlen($nova_senha) < 6) {
                throw new Exception("A senha deve ter pelo menos 6 caracteres.");
            }

            $hash = password_hash($nova_senha, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET senha = ? WHERE id = ?");
            $stmt->execute([$hash, $_SESSION['admin_id']]);

            // Desloga automaticamente para forçar novo login com a nova senha
            session_destroy();
            echo "<script>alert('Senha alterada com sucesso! Faça login novamente com sua nova credencial.'); window.location.href='login.php';</script>";
            exit;
        }
    } catch (Exception $e) {
        $mensagem = $e->getMessage();
    }
}
?>

<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet">

<div class="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12 font-sans">
    
    <div>
        <h2 class="text-3xl font-black text-white tracking-tighter uppercase italic" style="font-family: 'Montserrat', sans-serif;">
            <i class="fas fa-shield-halved text-green-500 mr-2"></i> Segurança da Conta
        </h2>
        <p class="text-zinc-500 text-sm font-medium">Troque a senha do seu perfil administrativo.</p>
    </div>

    <?php if($mensagem): ?>
        <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-lg">
            <i class="fas fa-exclamation-triangle"></i> <?= htmlspecialchars($mensagem) ?>
        </div>
    <?php endif; ?>

    <div class="bg-green-500/5 border border-green-500/20 rounded-[2rem] p-6 flex items-start gap-5 shadow-lg">
        <div class="w-12 h-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center flex-shrink-0 border border-green-500/20">
            <i class="fas fa-key text-lg"></i>
        </div>
        <div>
            <h4 class="text-green-500 font-black uppercase text-sm tracking-widest mb-1">Aviso Importante sobre Pagamentos</h4>
            <p class="text-xs text-zinc-400 leading-relaxed font-medium">
                Sua senha de login é a sua <strong class="text-white">Chave Mestre de Segurança</strong>. O sistema PandaPix exige a sua senha atual sempre que você for aprovar um PIX de saque (seja de Jogadores ou de Afiliados) para garantir que apenas você tem o poder de movimentar os fundos da casa. Ao alterar a senha abaixo, a chave de pagamentos mudará automaticamente.
            </p>
        </div>
    </div>

    <div class="bg-dark-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 left-0 w-64 h-64 bg-green-600/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div class="flex items-center gap-4 mb-8 relative z-10">
            <div class="w-12 h-12 rounded-2xl bg-green-600/10 flex items-center justify-center text-green-500 shadow-inner border border-green-500/20">
                <i class="fas fa-lock text-xl"></i>
            </div>
            <div>
                <h3 class="text-xl font-extrabold text-white uppercase tracking-tight">Alterar Senha</h3>
                <p class="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    Logado como: <span class="text-zinc-300"><?= htmlspecialchars($admin_data['nome'] ?? 'Admin') ?></span>
                </p>
            </div>
        </div>

        <form method="POST" class="space-y-6 relative z-10">
            <input type="hidden" name="action" value="change_password">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2">
                    <label class="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Nova Senha Admin</label>
                    <input type="password" name="nova_senha" required placeholder="Mínimo 6 caracteres"
                        class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white outline-none focus:border-green-500/50 transition-all font-bold placeholder:text-zinc-800 shadow-inner">
                </div>
                <div class="space-y-2">
                    <label class="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Confirmar Senha</label>
                    <input type="password" name="confirma_senha" required placeholder="Repita a nova senha"
                        class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white outline-none focus:border-green-500/50 transition-all font-bold placeholder:text-zinc-800 shadow-inner">
                </div>
            </div>

            <button type="submit" class="w-full bg-green-600 hover:bg-green-500 text-white font-black py-5 rounded-[2rem] shadow-lg shadow-green-600/20 transition-all active:scale-[0.98] uppercase tracking-widest text-xs mt-4">
                <i class="fas fa-save mr-2"></i> Confirmar Nova Senha e Sair do Sistema
            </button>
        </form>
    </div>

</div>