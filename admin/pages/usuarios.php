<?php
// Proteção de acesso ao arquivo
if (!isset($pdo)) { die("Acesso restrito."); }

$mensagem = "";
$msg_type = "success";

// --- 1. PROCESSAMENTO DE AÇÕES (POST) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    try {
        switch ($_POST['action']) {
            case 'create_user':
                // Gerar código de afiliado único para o novo usuário
                $aff_code = bin2hex(random_bytes(4));

                $nome = trim($_POST['nome'] ?? '');
                $email = trim($_POST['email'] ?? '');
                $telefone = trim($_POST['telefone'] ?? '');
                $senha = $_POST['senha'] ?? '';
                $balance = (float)($_POST['balance'] ?? 0);
                $tipo = strtoupper(trim($_POST['tipo_conta'] ?? 'JOGADOR'));
                $rtp = (int)($_POST['rtp'] ?? 0);

                // AFILIADO removido do escopo de criação via painel
                $tipos_validos = ['JOGADOR', 'DEMO'];
                if (!in_array($tipo, $tipos_validos, true)) {
                    $tipo = 'JOGADOR';
                }

                $is_demo = ($tipo === 'DEMO') ? 1 : 0;
                $is_influencer = 0; // Influenciador desativado via painel

                // Definir valores padrão se não informados
                if (isset($_POST['comissao_cpa']) && $_POST['comissao_cpa'] !== '') {
                    $comissao_cpa = (float)$_POST['comissao_cpa'];
                } else {
                    // Se for afiliado novo, sugere 50%, senão padrão 10%
                    $comissao_cpa = ($tipo === 'AFILIADO') ? 50.00 : 10.00;
                }

                if (isset($_POST['comissao_cpa_nivel2']) && $_POST['comissao_cpa_nivel2'] !== '') {
                    $comissao_cpa_nivel2 = (float)$_POST['comissao_cpa_nivel2'];
                } else {
                    // Se for afiliado novo, sugere 30%, senão padrão 10%
                    $comissao_cpa_nivel2 = ($tipo === 'AFILIADO') ? 30.00 : 10.00;
                }

                $stmt = $pdo->prepare("
                    INSERT INTO users (
                        nome, email, telefone, senha, balance, tipo_conta,
                        affiliate_code, is_demo, is_influencer, rtp,
                        comissao_cpa, comissao_cpa_nivel2, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                $stmt->execute([
                    $nome,
                    $email,
                    $telefone,
                    password_hash($senha, PASSWORD_DEFAULT),
                    $balance,
                    $tipo,
                    $aff_code,
                    $is_demo,
                    $is_influencer,
                    $rtp,
                    $comissao_cpa,
                    $comissao_cpa_nivel2
                ]);

                $mensagem = "Usuário criado com sucesso!";
                break;

            case 'edit_user':
                $user_id = (int)($_POST['user_id'] ?? 0);
                $nome = trim($_POST['nome'] ?? '');
                $tipo = strtoupper(trim($_POST['tipo_conta'] ?? 'JOGADOR'));
                $rtp = (int)($_POST['rtp'] ?? 0);

                // Busca valores atuais para decidir sobre defaults e segurança
                $stmtUserAtual = $pdo->prepare("SELECT tipo_conta, is_influencer, comissao_cpa, comissao_cpa_nivel2 FROM users WHERE id = ? LIMIT 1");
                $stmtUserAtual->execute([$user_id]);
                $userAtual = $stmtUserAtual->fetch(PDO::FETCH_ASSOC);

                $tipoAtual = strtoupper(trim($userAtual['tipo_conta'] ?? 'JOGADOR'));
                $is_influencer = (int)($userAtual['is_influencer'] ?? 0); // Preserva valor atual

                $tipos_validos = ['JOGADOR', 'DEMO'];
                if ($tipoAtual === 'AFILIADO') {
                    $tipos_validos[] = 'AFILIADO'; // Permite manter se já for
                }

                if (!in_array($tipo, $tipos_validos, true)) {
                    $tipo = $tipoAtual;
                }

                $is_demo = ($tipo === 'DEMO') ? 1 : 0;
                
                // Se mudou de JOGADOR para AFILIADO, aplicar sugestão de 50/30 (se não passar nada no POST)
                $comissao_cpa = (float)($userAtual['comissao_cpa'] ?? 10.00);
                $comissao_cpa_nivel2 = (float)($userAtual['comissao_cpa_nivel2'] ?? 10.00);

                // Sobrescrever se vier do formulário (MAIS IMPORTANTE)
                if (isset($_POST['comissao_cpa']) && $_POST['comissao_cpa'] !== '') {
                    $comissao_cpa = (float)$_POST['comissao_cpa'];
                } elseif ($tipoAtual !== 'AFILIADO' && $tipo === 'AFILIADO') {
                    // Se for promoção manual e não digitou, sugere 50%
                    $comissao_cpa = 50.00;
                }

                if (isset($_POST['comissao_cpa_nivel2']) && $_POST['comissao_cpa_nivel2'] !== '') {
                    $comissao_cpa_nivel2 = (float)$_POST['comissao_cpa_nivel2'];
                } elseif ($tipoAtual !== 'AFILIADO' && $tipo === 'AFILIADO') {
                    // Se for promoção manual e não digitou, sugere 30%
                    $comissao_cpa_nivel2 = 30.00;
                }

                if (!empty($_POST['senha'])) {
                    $stmt = $pdo->prepare("
                        UPDATE users
                        SET nome = ?, senha = ?, tipo_conta = ?, is_demo = ?, is_influencer = ?, rtp = ?, comissao_cpa = ?, comissao_cpa_nivel2 = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $nome,
                        password_hash($_POST['senha'], PASSWORD_DEFAULT),
                        $tipo,
                        $is_demo,
                        $is_influencer,
                        $rtp,
                        $comissao_cpa,
                        $comissao_cpa_nivel2,
                        $user_id
                    ]);
                } else {
                    $stmt = $pdo->prepare("
                        UPDATE users
                        SET nome = ?, tipo_conta = ?, is_demo = ?, is_influencer = ?, rtp = ?, comissao_cpa = ?, comissao_cpa_nivel2 = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $nome,
                        $tipo,
                        $is_demo,
                        $is_influencer,
                        $rtp,
                        $comissao_cpa,
                        $comissao_cpa_nivel2,
                        $user_id
                    ]);
                }

                $mensagem = "Cadastro de " . htmlspecialchars($nome) . " atualizado!";
                break;

            case 'edit_balance':
                $stmt = $pdo->prepare("UPDATE users SET balance = ? WHERE id = ?");
                $stmt->execute([(float)($_POST['balance'] ?? 0), (int)($_POST['user_id'] ?? 0)]);
                $mensagem = "Saldo de banca atualizado!";
                break;

            case 'toggle_block':
                $novo_status = (($_POST['current_status'] ?? 0) == 0) ? 1 : 0;
                $stmt = $pdo->prepare("UPDATE users SET banido = ? WHERE id = ?");
                $stmt->execute([$novo_status, (int)($_POST['user_id'] ?? 0)]);
                $mensagem = ($novo_status == 1) ? "Usuário bloqueado!" : "Usuário desbloqueado!";
                break;
        }
    } catch (Exception $e) {
        $mensagem = "Erro: " . $e->getMessage();
        $msg_type = "error";
    }
}

// --- 2. LÓGICA DE BUSCA ---
$search = $_GET['search'] ?? '';
$where = $search ? "WHERE (nome LIKE :s OR email LIKE :s OR telefone LIKE :s)" : "";

// Estatísticas Totais
$total_db_users = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
$total_db_saldo = $pdo->query("SELECT SUM(balance) FROM users")->fetchColumn() ?: 0;

// Lista de Usuários
$usuarios_stmt = $pdo->prepare("SELECT * FROM users $where ORDER BY created_at DESC");
if ($search) $usuarios_stmt->bindValue(':s', "%$search%");
$usuarios_stmt->execute();
$lista = $usuarios_stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<div class="space-y-8 animate-fade-in pb-12">
    
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
            <h2 class="text-3xl font-black text-white tracking-tighter uppercase italic">Gestão PandaPix</h2>
            <p class="text-zinc-500 text-sm">Controle total sobre jogadores, afiliados e contas demo.</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
            <form method="GET" class="relative group">
                <input type="hidden" name="page" value="usuarios">
                <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-green-500 transition-colors"></i>
                <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" 
                    placeholder="Nome, e-mail ou telefone..." 
                    class="bg-dark-900 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/10 transition-all w-full sm:w-64">
            </form>
            <button onclick="openCreateModal()" class="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-green-600/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                <i class="fas fa-user-plus"></i> Novo Usuário
            </button>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="group relative p-8 rounded-[2.5rem] bg-dark-900 border border-white/5 overflow-hidden transition-all hover:border-green-500/30">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all"></div>
            <div class="relative z-10 flex items-center gap-6">
                <div class="w-16 h-16 rounded-3xl bg-green-600/10 flex items-center justify-center text-green-500 shadow-inner">
                    <i class="fas fa-users text-2xl"></i>
                </div>
                <div>
                    <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1">Jogadores na Base</p>
                    <h3 class="text-3xl font-black text-white italic"><?= $total_db_users ?> <span class="text-sm font-medium text-zinc-600 not-italic">contas</span></h3>
                </div>
            </div>
        </div>

        <div class="group relative p-8 rounded-[2.5rem] bg-dark-900 border border-white/5 overflow-hidden transition-all hover:border-emerald-500/30">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
            <div class="relative z-10 flex items-center gap-6">
                <div class="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                    <i class="fas fa-coins text-2xl"></i>
                </div>
                <div>
                    <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1">Saldo Total em Jogo</p>
                    <h3 class="text-3xl font-black text-white italic">R$ <?= number_format($total_db_saldo, 2, ',', '.') ?></h3>
                </div>
            </div>
        </div>
    </div>

    <?php if($mensagem): ?>
        <div class="<?= $msg_type == 'success' ? 'bg-green-600/10 border-green-500/20 text-green-400' : 'bg-red-600/10 border-red-500/20 text-red-400' ?> border p-4 rounded-2xl text-sm font-bold flex items-center gap-3">
            <i class="fas fa-info-circle"></i> <?= htmlspecialchars($mensagem) ?>
        </div>
    <?php endif; ?>

    <div class="bg-dark-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead>
                    <tr class="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] bg-white/[0.02]">
                        <th class="py-6 px-8">Identificação / Contato</th>
                        <th class="py-6 px-4">Tipo</th>
                        <th class="py-6 px-4 text-center">Saldo Atual</th>
                        <th class="py-6 px-8 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    <?php foreach ($lista as $u): 
                        $isBlocked = ($u['banido'] == 1);
                    ?>
                    <tr class="group hover:bg-white/[0.01] transition-colors <?= $isBlocked ? 'bg-red-500/5' : '' ?>">
                        <td class="py-5 px-8">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-xs uppercase">
                                    <?= htmlspecialchars(substr($u['nome'], 0, 2)) ?>
                                </div>
                                <div>
                                    <p class="text-sm font-bold <?= $isBlocked ? 'text-red-400' : 'text-white' ?>"><?= htmlspecialchars($u['nome']) ?></p>
                                    <p class="text-[10px] text-zinc-500 uppercase tracking-tighter"><?= htmlspecialchars($u['telefone']) ?> | <?= htmlspecialchars($u['email'] ?? 'Sem e-mail') ?></p>
                                </div>
                            </div>
                        </td>
                        <td class="py-5 px-4">
                            <span class="text-[9px] font-black px-2 py-1 rounded-md bg-green-500/10 text-green-500 border border-green-500/10">
                                <?= htmlspecialchars($u['tipo_conta'] ?? 'JOGADOR') ?>
                            </span>
                        </td>
                        <td class="py-5 px-4 text-center font-black text-white text-sm italic">
                            R$ <?= number_format((float)$u['balance'], 2, ',', '.') ?>
                        </td>
                        <td class="py-5 px-8 text-right">
                            <div class="flex items-center justify-end gap-2">
                                <button onclick='openEditModal(<?= json_encode($u, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>)' class="w-10 h-10 rounded-xl bg-white/5 border border-white/5 text-zinc-400 hover:text-green-500 hover:border-green-500/30 transition-all flex items-center justify-center">
                                    <i class="fas fa-edit text-xs"></i>
                                </button>
                                <button onclick='openBalanceModal(<?= json_encode($u, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>)' class="w-10 h-10 rounded-xl bg-white/5 border border-white/5 text-zinc-400 hover:text-emerald-500 hover:border-emerald-500/30 transition-all flex items-center justify-center">
                                    <i class="fas fa-wallet text-xs"></i>
                                </button>
                                <form method="POST" class="inline">
                                    <input type="hidden" name="action" value="toggle_block">
                                    <input type="hidden" name="user_id" value="<?= (int)$u['id'] ?>">
                                    <input type="hidden" name="current_status" value="<?= (int)$u['banido'] ?>">
                                    <button type="submit" class="w-10 h-10 rounded-xl bg-white/5 border border-white/5 <?= $isBlocked ? 'text-red-500 bg-red-500/10' : 'text-zinc-500' ?> hover:border-red-500/30 transition-all flex items-center justify-center">
                                        <i class="fas <?= $isBlocked ? 'fa-lock' : 'fa-unlock' ?> text-xs"></i>
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

<div id="modalCreate" class="fixed inset-0 z-[70] hidden items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="bg-dark-900 border border-white/10 rounded-[2.5rem] w-full max-w-md p-10 animate-zoom-in">
        <h3 class="text-xl font-black text-white uppercase italic mb-8 flex items-center gap-3">Novo Usuário</h3>
        <form method="POST" class="space-y-4">
            <input type="hidden" name="action" value="create_user">

            <input type="text" name="nome" placeholder="Nome do Jogador" required class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none">
            <input type="text" name="telefone" placeholder="Telefone (DD9...)" required class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none">
            <input type="email" name="email" placeholder="E-mail (Opcional)" class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none">
            <input type="password" name="senha" placeholder="Senha de Acesso" required class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none">

            <select name="tipo_conta" id="create_tipo_conta" class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none">
                <option value="JOGADOR">JOGADOR</option>
                <option value="DEMO">DEMO</option>
            </select>

            <div class="space-y-1">
                <label class="block text-xs font-bold text-zinc-500 uppercase ml-1">RTP Individual (0 = Global)</label>
                <input type="number" name="rtp" value="0" placeholder="RTP (0 = Global)" class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none">
                <p class="text-[10px] text-zinc-500 ml-1">Deixe 0 para usar o RTP global. Preencha apenas se quiser RTP personalizado para este jogador.</p>
            </div>

            <input type="number" step="0.01" name="balance" placeholder="Saldo Inicial" value="0.00" class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none">

            <div id="create_commissions" class="space-y-4">
                <label class="block text-xs font-bold text-zinc-500 uppercase ml-1 mt-2">CPA Nível 1 (%)</label>
                <input type="number" step="0.01" name="comissao_cpa" id="create_comissao_cpa" value="10.00" class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none">

                <label class="block text-xs font-bold text-zinc-500 uppercase ml-1 mt-2">CPA Nível 2 (%)</label>
                <input type="number" step="0.01" name="comissao_cpa_nivel2" id="create_comissao_cpa_nivel2" value="10.00" class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none">
            </div>

            <div class="flex gap-3 pt-6">
                <button type="button" onclick="closeAllModals()" class="flex-1 py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-bold uppercase text-xs transition-all hover:bg-zinc-700">Cancelar</button>
                <button type="submit" class="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-green-600/20 transition-all hover:bg-green-500">Criar Usuário</button>
            </div>
        </form>
    </div>
</div>

<div id="modalEdit" class="fixed inset-0 z-[70] hidden items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="bg-dark-900 border border-white/10 rounded-[2.5rem] w-full max-w-md p-10 animate-zoom-in">
        <h3 class="text-xl font-black text-white uppercase italic mb-8 flex items-center gap-3">Editar Jogador</h3>
        <form method="POST" class="space-y-4">
            <input type="hidden" name="action" value="edit_user">
            <input type="hidden" name="user_id" id="edit_id">
            
            <label class="block text-xs font-bold text-zinc-500 uppercase ml-1">Nome Completo</label>
            <input type="text" name="nome" id="edit_nome" required class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none">
            
            <label class="block text-xs font-bold text-zinc-500 uppercase ml-1 mt-2">Tipo de Conta</label>
            <select name="tipo_conta" id="edit_tipo_conta" class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none appearance-none">
                <option value="JOGADOR">JOGADOR</option>
                <option value="DEMO">DEMO</option>
            </select>

            <div class="space-y-1">
                <label class="block text-xs font-bold text-zinc-500 uppercase ml-1">RTP Individual (0 = Global)</label>
                <input type="number" name="rtp" id="edit_rtp" value="0" placeholder="RTP (0 = Global)" class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none">
                <p class="text-[10px] text-zinc-500 ml-1">0 = usar RTP global da configuração do jogo.</p>
            </div>

            <div id="edit_commissions" class="space-y-4">
                <label class="block text-xs font-bold text-zinc-500 uppercase ml-1 mt-2">CPA Nível 1 (%)</label>
                <input type="number" step="0.01" name="comissao_cpa" id="edit_comissao_cpa" class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none">

                <label class="block text-xs font-bold text-zinc-500 uppercase ml-1 mt-2">CPA Nível 2 (%)</label>
                <input type="number" step="0.01" name="comissao_cpa_nivel2" id="edit_comissao_cpa_nivel2" class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none">
            </div>

            <label class="block text-xs font-bold text-zinc-500 uppercase ml-1 mt-2">Alterar Senha</label>
            <input type="password" name="senha" placeholder="Em branco para não mudar" class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white outline-none">
            
            <div class="flex gap-3 pt-6">
                <button type="button" onclick="closeAllModals()" class="flex-1 py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-bold uppercase text-xs">Voltar</button>
                <button type="submit" class="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-green-600/20 transition-all hover:bg-green-500">Salvar Dados</button>
            </div>
        </form>
    </div>
</div>

<div id="modalBalance" class="fixed inset-0 z-[70] hidden items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="bg-dark-900 border border-white/10 rounded-[2.5rem] w-full max-w-md p-10 animate-zoom-in text-center">
        <div class="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6">
            <i class="fas fa-wallet text-3xl"></i>
        </div>
        <h3 class="text-xl font-black text-white uppercase italic mb-2">Ajustar Saldo</h3>
        <p class="text-zinc-500 text-sm mb-8">Jogador: <span id="bal_name" class="text-white font-bold">---</span></p>
        <form method="POST" class="space-y-4">
            <input type="hidden" name="action" value="edit_balance">
            <input type="hidden" name="user_id" id="bal_id">
            <input type="number" step="0.01" name="balance" id="bal_balance" required 
                class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-5 text-center text-3xl font-black text-emerald-500 outline-none">
            <div class="flex gap-3 pt-6">
                <button type="button" onclick="closeAllModals()" class="flex-1 py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-bold uppercase text-xs">Cancelar</button>
                <button type="submit" class="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500">Confirmar Ajuste</button>
            </div>
        </form>
    </div>
</div>

<script>
function toggleCommissionFields(tipoSelectId, cpa1Id, cpa2Id) {
    const tipo = document.getElementById(tipoSelectId)?.value || 'JOGADOR';
    const cpa1 = document.getElementById(cpa1Id);
    const cpa2 = document.getElementById(cpa2Id);

    if (tipo === 'AFILIADO') {
        cpa1.value = "50.00";
        cpa2.value = "30.00";
    } else {
        cpa1.value = "10.00";
        cpa2.value = "10.00";
    }
}

function openCreateModal() {
    document.getElementById('modalCreate').classList.replace('hidden', 'flex');
    // Default para novos usuários
    toggleCommissionFields('create_tipo_conta', 'create_comissao_cpa', 'create_comissao_cpa_nivel2');
}

function openEditModal(u) {
    document.getElementById('edit_id').value = u.id;
    document.getElementById('edit_nome').value = u.nome;
    
    // Gerenciar opção AFILIADO se o usuário já for um
    const select = document.getElementById('edit_tipo_conta');
    const existingAff = select.querySelector('option[value="AFILIADO"]');
    if (existingAff) existingAff.remove();

    if (u.tipo_conta === 'AFILIADO') {
        const opt = document.createElement('option');
        opt.value = 'AFILIADO';
        opt.text = 'AFILIADO';
        opt.selected = true;
        opt.style.display = 'none'; // Mantém oculto no select
        select.add(opt);
    }
    
    select.value = u.tipo_conta || 'JOGADOR';
    document.getElementById('edit_rtp').value = u.rtp ?? 0;
    document.getElementById('edit_comissao_cpa').value = u.comissao_cpa ?? 0;
    document.getElementById('edit_comissao_cpa_nivel2').value = u.comissao_cpa_nivel2 ?? 0;

    document.getElementById('modalEdit').classList.replace('hidden', 'flex');
}

function openBalanceModal(u) {
    document.getElementById('bal_id').value = u.id;
    document.getElementById('bal_name').innerText = u.nome;
    document.getElementById('bal_balance').value = u.balance;
    document.getElementById('modalBalance').classList.replace('hidden', 'flex');
}

function closeAllModals() {
    ['modalCreate', 'modalEdit', 'modalBalance'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.replace('flex', 'hidden');
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const createTipo = document.getElementById('create_tipo_conta');
    const editTipo = document.getElementById('edit_tipo_conta');

    if (createTipo) {
        createTipo.addEventListener('change', function () {
            toggleCommissionFields('create_tipo_conta', 'create_comissao_cpa', 'create_comissao_cpa_nivel2');
        });
    }

    if (editTipo) {
        editTipo.addEventListener('change', function () {
            toggleCommissionFields('edit_tipo_conta', 'edit_comissao_cpa', 'edit_comissao_cpa_nivel2');
        });
    }
});
</script>

<style>
@keyframes zoom-in {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
}
.animate-zoom-in {
    animation: zoom-in 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    background-size: 1em;
}
</style>
