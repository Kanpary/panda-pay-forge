<?php
// Tenta carregar a inicialização do admin (auth, session e conn.php)
if (file_exists('../includes/admin_init.php')) {
    require_once '../includes/admin_init.php';
} else {
    session_start();
    require_once '../conn.php';
    if (!isset($_SESSION['admin_id'])) {
        header('Location: login.php');
        exit;
    }
}

$page = $_GET['page'] ?? 'dashboard';
$page = preg_replace('/[^a-zA-Z0-9_-]/', '', $page); // Anti-directory traversal

// Busca a logo e configurações visuais na tabela game_settings
try {
    // No seu banco, URLs e chaves ficam na coluna 'description' quando o valor é 0
    $stmtLogo = $pdo->prepare("SELECT description FROM game_settings WHERE slug = 'logo_url' LIMIT 1");
    $stmtLogo->execute();
    $config_jogo = $stmtLogo->fetch();
    
    // Ajuste de caminho: se a URL for 'assets/img/logo.png', voltamos uma pasta
    $logo_path = !empty($config_jogo['description']) ? '../' . $config_jogo['description'] : '../logopandapix.png';
} catch (Exception $e) {
    $logo_path = '../logopandapix.png'; // Fallback para a logo do panda
}
?>
<!DOCTYPE html>
<html lang="pt-br" class="dark">
<head>
    <meta charset="UTF-8">
    <title>Painel Admin | PandaPix</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: { extend: { colors: { dark: { 950: '#09090b', 900: '#121214', 800: '#18181b' } } } }
        }
    </script>
    <style>
        body { background-color: #09090b; color: #e4e4e7; font-family: 'Plus Jakarta Sans', sans-serif; }
        .sidebar-transition { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        nav::-webkit-scrollbar { width: 4px; }
        nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .active-link { background: #16a34a !important; color: white !important; box-shadow: 0 10px 15px -3px rgba(22, 163, 74, 0.2); }
    </style>
</head>
<body class="flex h-screen overflow-hidden antialiased">

    <div id="sidebarOverlay" class="fixed inset-0 bg-black/60 z-40 hidden md:hidden backdrop-blur-sm transition-opacity" onclick="toggleSidebar()"></div>

  <aside id="sidebar" class="fixed inset-y-0 left-0 z-50 w-72 bg-dark-900 border-r border-white/5 flex flex-col transform -translate-x-full md:translate-x-0 sidebar-transition md:relative">
    <div class="h-20 flex items-center justify-center px-6 border-b border-white/5">
        <img src="<?= htmlspecialchars($logo_path) ?>" alt="Logo" class="max-h-12 w-auto object-contain">
    </div>

    <nav class="flex-1 overflow-y-auto p-4 space-y-1">
        
        <a href="?page=dashboard" class="flex items-center gap-3 px-4 py-3 rounded-xl <?= $page == 'dashboard' ? 'active-link' : 'text-zinc-400 hover:bg-white/5' ?> transition-all duration-200">
            <i class="fas fa-chart-pie w-5 text-center"></i>
            <span class="font-medium text-sm">Dashboard</span>
        </a>

        <div class="px-4 mt-6 mb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Controle do Panda</div>
        <a href="?page=admin_config_jogo" class="flex items-center gap-3 px-4 py-3 rounded-xl <?= $page == 'admin_config_jogo' ? 'active-link' : 'text-zinc-400 hover:bg-white/5' ?> transition-all duration-200">
            <i class="fas fa-gamepad w-5 text-center"></i>
            <span class="font-medium text-sm">Dificuldade e RTP</span>
        </a>

        <div class="px-4 mt-6 mb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Gestão de Contas</div>
        <a href="?page=usuarios" class="flex items-center gap-3 px-4 py-3 rounded-xl <?= $page == 'usuarios' ? 'active-link' : 'text-zinc-400 hover:bg-white/5' ?> transition-all duration-200">
            <i class="fas fa-users w-5 text-center"></i>
            <span class="font-medium text-sm">Jogadores</span>
        </a>
        <a href="?page=afiliados" class="flex items-center gap-3 px-4 py-3 rounded-xl <?= $page == 'afiliados' ? 'active-link' : 'text-zinc-400 hover:bg-white/5' ?> transition-all duration-200">
            <i class="fas fa-bullhorn w-5 text-center"></i>
            <span class="font-medium text-sm">Afiliados</span>
        </a>
        <a href="?page=demo" class="flex items-center gap-3 px-4 py-3 rounded-xl <?= $page == 'demo' ? 'active-link' : 'text-zinc-400 hover:bg-white/5' ?> transition-all duration-200">
            <i class="fas fa-vial w-5 text-center"></i>
            <span class="font-medium text-sm">Contas Demo</span>
        </a>

        <div class="px-4 mt-6 mb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Financeiro</div>
        <a href="?page=depositos" class="flex items-center gap-3 px-4 py-3 rounded-xl <?= $page == 'depositos' ? 'active-link' : 'text-zinc-400 hover:bg-white/5' ?> transition-all duration-200">
            <i class="fas fa-wallet w-5 text-center"></i>
            <span class="font-medium text-sm">Depósitos</span>
        </a>
        <a href="?page=saques_jogadores" class="flex items-center gap-3 px-4 py-3 rounded-xl <?= $page == 'saques_jogadores' ? 'active-link' : 'text-zinc-400 hover:bg-white/5' ?> transition-all duration-200">
            <i class="fas fa-money-bill-transfer w-5 text-center"></i>
            <span class="font-medium text-sm">Saques Jogadores</span>
        </a>
        
        <!-- Saques Afiliados removido — agora centralizado em "Saques Jogadores" (coluna Tipo) -->

        
        <a href="?page=financeiro" class="flex items-center gap-3 px-4 py-3 rounded-xl <?= $page == 'financeiro' ? 'active-link' : 'text-zinc-400 hover:bg-white/5' ?> transition-all duration-200">
            <i class="fas fa-sliders w-5 text-center"></i>
            <span class="font-medium text-sm">Taxas e Limites</span>
        </a>

        <div class="px-4 mt-6 mb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Configurações</div>
        <a href="?page=gateway" class="flex items-center gap-3 px-4 py-3 rounded-xl <?= $page == 'gateway' ? 'active-link' : 'text-zinc-400 hover:bg-white/5' ?> transition-all duration-200">
            <i class="fas fa-network-wired w-5 text-center"></i>
            <span class="font-medium text-sm">Configuração PIX</span>
        </a>
        <a href="?page=admin_senha" class="flex items-center gap-3 px-4 py-3 rounded-xl <?= $page == 'admin_senha' ? 'active-link' : 'text-zinc-400 hover:bg-white/5' ?> transition-all duration-200">
            <i class="fas fa-shield-halved w-5 text-center"></i>
            <span class="font-medium text-sm">Minha Senha</span>
        </a>

    </nav>

    <div class="p-4 border-t border-white/5">
        <a href="logout.php" class="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/5 rounded-xl transition-all">
            <i class="fas fa-sign-out-alt"></i> <span class="text-sm font-bold">Sair do Sistema</span>
        </a>
    </div>
</aside>

    <main class="flex-1 flex flex-col min-w-0 z-10">
        <header class="md:hidden h-16 bg-dark-900 border-b border-white/5 flex items-center justify-between px-4">
            <button onclick="toggleSidebar()" class="text-zinc-400">
                <i class="fas fa-bars text-xl"></i>
            </button>
            <img src="<?= htmlspecialchars($logo_path) ?>" alt="Logo" class="max-h-8 w-auto">
            <div class="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-[10px] font-bold">ADM</div>
        </header>

        <div class="flex-1 overflow-y-auto p-4 md:p-10">
            <div class="w-full max-w-7xl mx-auto">
                <?php
                    $file = "pages/{$page}.php";
                    if (file_exists($file)) {
                        include $file;
                    } else {
                        echo "
                        <div class='flex flex-col items-center justify-center py-20 text-zinc-500'>
                            <i class='fas fa-folder-open text-4xl mb-4 opacity-20'></i>
                            <p class='italic font-medium'>A página '{$page}' ainda não foi criada.</p>
                        </div>";
                    }
                ?>
            </div>
        </div>
    </main>

    <script>
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            sidebar.classList.toggle('-translate-x-full');
            overlay.classList.toggle('hidden');
        }

        let __adminCsrfToken = null;

        async function getAdminCsrfToken() {
            if (__adminCsrfToken) return __adminCsrfToken;
            const res = await fetch('../api.php?route=csrf', { credentials: 'same-origin' });
            const json = await res.json();
            __adminCsrfToken = json && json.data ? json.data.token : '';
            return __adminCsrfToken;
        }

        async function adminApiRequest(route, options = {}) {
            const method = (options.method || 'GET').toUpperCase();
            const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});

            if (['POST', 'PUT', 'DELETE'].includes(method)) {
                const token = await getAdminCsrfToken();
                headers['X-CSRF-Token'] = token;
            }

            const response = await fetch(`../api.php?route=${route}`, {
                ...options,
                method,
                headers,
                credentials: 'same-origin'
            });

            return response.json();
        }
    </script>
</body>
</html>
