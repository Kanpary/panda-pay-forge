<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Tenta carregar o security, mas não trava se não existir (ajuste conforme sua estrutura)
if (file_exists('../includes/security.php')) {
    require_once '../includes/security.php';
    if (function_exists('secureSessionInit')) secureSessionInit();
} else {
    session_start();
}

// Rota para a conexão centralizada que criamos
require_once '../conn.php'; 

// Se já estiver logado como admin, vai direto para o index
if (isset($_SESSION['admin_id'])) {
    header('Location: index.php');
    exit;
}

// Busca a logo nas suas configurações reais
try {
    // No seu banco a tabela é game_settings
    $stmtLogo = $pdo->prepare("SELECT description FROM game_settings WHERE slug = 'logo_url' LIMIT 1");
    $stmtLogo->execute();
    $logo_setting = $stmtLogo->fetch();
    $logo_path = !empty($logo_setting['description']) ? '../' . $logo_setting['description'] : '../assets/img/logo.png';
} catch (Exception $e) {
    $logo_path = '../assets/img/logo.png';
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $senha = $_POST['senha'] ?? '';

    // Adaptado para sua tabela 'users' e nova coluna 'is_admin'
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND is_admin = 1 LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($senha, $user['senha'])) {
        session_regenerate_id(true); 
        $_SESSION['admin_id'] = $user['id'];
        $_SESSION['admin_nome'] = $user['nome'];
        $_SESSION['admin_email'] = $user['email'];

        header('Location: index.php');
        exit;
    } else {
        $error = 'E-mail ou senha incorretos, ou você não tem permissão de administrador.';
    }
}

// Helper simples para CSRF caso o security.php não esteja presente
if (!function_exists('csrfToken')) {
    function csrfToken() {
        if (empty($_SESSION['csrf_token'])) $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        return $_SESSION['csrf_token'];
    }
}
?>
<!DOCTYPE html>
<html lang="pt-br" class="dark">
<head>
    <meta charset="UTF-8">
    <title>Login Administrativo | PandaPix</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #09090b; }
        .glass { background: rgba(24, 24, 27, 0.8); backdrop-filter: blur(12px); border: 1px solid rgba(34, 197, 94, 0.1); }
    </style>
</head>
<body class="flex items-center justify-center min-h-screen p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/10 via-zinc-950 to-zinc-950">

    <div class="w-full max-w-md animate-fade-in">
        <div class="glass rounded-[2.5rem] p-10 shadow-2xl">
            
            <div class="text-center mb-10">
                <div class="inline-flex items-center justify-center mb-6">
                    <img src="<?= htmlspecialchars($logo_path) ?>" alt="Logo" class="max-h-20 w-auto object-contain drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]" onerror="this.src='../logopandapix.png'">
                </div>
                <h1 class="text-2xl font-extrabold text-white tracking-tight">Painel PandaPix</h1>
                <p class="text-zinc-500 mt-2 font-medium italic">Gestão Administrativa</p>
            </div>

            <?php if ($error): ?>
                <div class="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-2xl mb-8 flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    <span><?= htmlspecialchars($error) ?></span>
                </div>
            <?php endif; ?>

            <form method="POST" class="space-y-6">
                <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
                <div>
                    <label class="block text-xs font-bold text-zinc-500 uppercase tracking-[0.15em] mb-2.5 ml-1">E-mail Administrativo</label>
                    <input type="email" name="email" required 
                        class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-600/10 transition-all placeholder:text-zinc-700" 
                        placeholder="admin@exemplo.com">
                </div>

                <div>
                    <label class="block text-xs font-bold text-zinc-500 uppercase tracking-[0.15em] mb-2.5 ml-1">Senha</label>
                    <input type="password" name="senha" required 
                        class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-600/10 transition-all placeholder:text-zinc-700" 
                        placeholder="••••••••">
                </div>

                <div class="pt-2">
                    <button type="submit" 
                        class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-600/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group">
                        <span>Acessar Painel</span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 -1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
        
        <p class="text-center text-zinc-600 text-xs mt-8 uppercase tracking-widest font-bold">
            &copy; <?= date('Y') ?> PandaPix • Gestão Interna
        </p>
    </div>

</body>
</html>