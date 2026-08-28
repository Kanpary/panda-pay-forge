<?php
require_once 'includes/auth.php';
require_once '../db.php';

if (!isset($_GET['id'])) {
    header('Location: users.php');
    exit;
}

$userId = $_GET['id'];
$message = '';
$limit = 5; // Items per page
$activeTab = $_GET['active_tab'] ?? 'deposits';

// Update User Profile
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_profile') {
    file_put_contents('debug_user_update.txt', print_r($_POST, true)); // Debug log
    
    $nome = $_POST['nome'];
    $email = $_POST['email'];
    $telefone = $_POST['telefone'];
    $status = $_POST['status'];
    $is_influencer = isset($_POST['is_influencer']) ? (int)$_POST['is_influencer'] : 0;
    
    try {
        $sql = "UPDATE users SET nome_completo = ?, email = ?, telefone = ?, status = ?, is_influencer = ? WHERE id = ?";
        $params = [$nome, $email, $telefone, $status, $is_influencer, $userId];
        
        if (!empty($_POST['senha'])) {
            $sql = "UPDATE users SET nome_completo = ?, email = ?, telefone = ?, status = ?, is_influencer = ?, senha = ? WHERE id = ?";
            $params = [$nome, $email, $telefone, $status, $is_influencer, password_hash($_POST['senha'], PASSWORD_DEFAULT), $userId];
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $message = 'Perfil atualizado com sucesso!';
    } catch (PDOException $e) {
        $message = 'Erro ao atualizar perfil: ' . $e->getMessage();
    }
}

// Fetch User Data
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (!$user) {
    header('Location: users.php');
    exit;
}

// Helper function for pagination links
function renderPagination($currentPage, $totalPages, $tab, $userId) {
    if ($totalPages <= 1) return '';
    
    $html = '<div class="pagination">';
    
    // Previous
    if ($currentPage > 1) {
        $prev = $currentPage - 1;
        $html .= "<a href='?id={$userId}&active_tab={$tab}&page_{$tab}={$prev}' class='page-link'>&laquo;</a>";
    } else {
        $html .= "<span class='page-link disabled'>&laquo;</span>";
    }
    
    // Numbers
    for ($i = 1; $i <= $totalPages; $i++) {
        $active = $i == $currentPage ? 'active' : '';
        $html .= "<a href='?id={$userId}&active_tab={$tab}&page_{$tab}={$i}' class='page-link {$active}'>{$i}</a>";
    }
    
    // Next
    if ($currentPage < $totalPages) {
        $next = $currentPage + 1;
        $html .= "<a href='?id={$userId}&active_tab={$tab}&page_{$tab}={$next}' class='page-link'>&raquo;</a>";
    } else {
        $html .= "<span class='page-link disabled'>&raquo;</span>";
    }
    
    $html .= '</div>';
    return $html;
}

// --- Deposits Pagination ---
$pageDeposits = isset($_GET['page_deposits']) ? (int)$_GET['page_deposits'] : 1;
$offsetDeposits = ($pageDeposits - 1) * $limit;

$stmtCount = $pdo->prepare("SELECT COUNT(*) FROM deposits WHERE user_id = ?");
$stmtCount->execute([$userId]);
$totalDepositsCount = $stmtCount->fetchColumn();
$totalPagesDeposits = ceil($totalDepositsCount / $limit);

$deposits = $pdo->prepare("SELECT * FROM deposits WHERE user_id = ? ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
$deposits->bindValue(':limit', $limit, PDO::PARAM_INT);
$deposits->bindValue(':offset', $offsetDeposits, PDO::PARAM_INT);
$deposits->bindValue(1, $userId, PDO::PARAM_INT); // Re-binding user_id as positional if named params fail or mixed
// Actually, let's use positional for consistency with previous tool usage if safe, but named is better for limit/offset.
// Let's stick to purely named or purely positional. Previous code used positional.
// PDO sometimes has issues mixing. Let's use pure positional.
$deposits = $pdo->prepare("SELECT * FROM deposits WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?");
$deposits->bindValue(1, $userId, PDO::PARAM_INT);
$deposits->bindValue(2, $limit, PDO::PARAM_INT);
$deposits->bindValue(3, $offsetDeposits, PDO::PARAM_INT);
$deposits->execute();


// --- Withdrawals Pagination ---
$pageWithdrawals = isset($_GET['page_withdrawals']) ? (int)$_GET['page_withdrawals'] : 1;
$offsetWithdrawals = ($pageWithdrawals - 1) * $limit;

$stmtCount = $pdo->prepare("SELECT COUNT(*) FROM withdrawals WHERE user_id = ?");
$stmtCount->execute([$userId]);
$totalWithdrawalsCount = $stmtCount->fetchColumn();
$totalPagesWithdrawals = ceil($totalWithdrawalsCount / $limit);

$withdrawals = $pdo->prepare("SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?");
$withdrawals->bindValue(1, $userId, PDO::PARAM_INT);
$withdrawals->bindValue(2, $limit, PDO::PARAM_INT);
$withdrawals->bindValue(3, $offsetWithdrawals, PDO::PARAM_INT);
$withdrawals->execute();


// --- Affiliates Pagination ---
$pageAffiliates = isset($_GET['page_affiliates']) ? (int)$_GET['page_affiliates'] : 1;
$offsetAffiliates = ($pageAffiliates - 1) * $limit;

$stmtCount = $pdo->prepare("SELECT COUNT(*) FROM users WHERE referred_by = ?");
$stmtCount->execute([$userId]);
$totalAffiliatesCount = $stmtCount->fetchColumn();
$totalPagesAffiliates = ceil($totalAffiliatesCount / $limit);

$affiliates = $pdo->prepare("SELECT * FROM users WHERE referred_by = ? ORDER BY created_at DESC LIMIT ? OFFSET ?");
$affiliates->bindValue(1, $userId, PDO::PARAM_INT);
$affiliates->bindValue(2, $limit, PDO::PARAM_INT);
$affiliates->bindValue(3, $offsetAffiliates, PDO::PARAM_INT);
$affiliates->execute();


// --- Games Pagination ---
$pageGames = isset($_GET['page_games']) ? (int)$_GET['page_games'] : 1;
$offsetGames = ($pageGames - 1) * $limit;

$stmtCount = $pdo->prepare("SELECT COUNT(*) FROM game_history WHERE user_id = ?");
$stmtCount->execute([$userId]);
$totalGamesCount = $stmtCount->fetchColumn();
$totalPagesGames = ceil($totalGamesCount / $limit);

$games = $pdo->prepare("SELECT * FROM game_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?");
$games->bindValue(1, $userId, PDO::PARAM_INT);
$games->bindValue(2, $limit, PDO::PARAM_INT);
$games->bindValue(3, $offsetGames, PDO::PARAM_INT);
$games->execute();


include 'includes/header.php';
?>

<div class="page-header">
    <a href="users.php" class="btn back-btn">
        <i data-lucide="arrow-left" style="width: 18px;"></i> Voltar
    </a>
    <h2 class="page-title">Detalhes do Usuário: <?php echo htmlspecialchars($user['nome_completo']); ?></h2>
</div>

<?php if ($message): ?>
    <div style="background-color: rgba(16, 185, 129, 0.2); color: #34d399; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; border: 1px solid rgba(16, 185, 129, 0.2);">
        <?php echo htmlspecialchars($message); ?>
    </div>
<?php endif; ?>

<div class="details-grid">
    <!-- Profile Card -->
    <div class="card" style="margin-bottom: 0; height: fit-content;">
        <div class="card-header">
            <h3 class="card-title">Editar Perfil</h3>
        </div>
        <form method="POST">
            <input type="hidden" name="action" value="update_profile">
            <div class="form-group">
                <label>Nome Completo</label>
                <input type="text" name="nome" class="form-control" value="<?php echo htmlspecialchars($user['nome_completo']); ?>" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" name="email" class="form-control" value="<?php echo htmlspecialchars($user['email']); ?>" required>
            </div>
            <div class="form-group">
                <label>Telefone</label>
                <input type="text" name="telefone" class="form-control" value="<?php echo htmlspecialchars($user['telefone'] ?? ''); ?>">
            </div>
            <div class="form-group">
                <label>Nova Senha (deixe em branco para manter)</label>
                <input type="password" name="senha" class="form-control" placeholder="••••••">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select name="status" class="form-control">
                    <option value="online" <?php echo ($user['status'] == 'online') ? 'selected' : ''; ?>>Ativo (Online)</option>
                    <option value="offline" <?php echo ($user['status'] == 'offline') ? 'selected' : ''; ?>>Bloqueado/Offline</option>
                </select>
            </div>
            <div class="form-group">
                <label>É Influenciador?</label>
                <select name="is_influencer" class="form-control">
                    <option value="0" <?php echo $user['is_influencer'] == 0 ? 'selected' : ''; ?>>Não</option>
                    <option value="1" <?php echo $user['is_influencer'] == 1 ? 'selected' : ''; ?>>Sim</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Salvar Alterações</button>
        </form>
    </div>

    <!-- Stats Overview -->
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div class="stats-grid" style="margin-bottom: 0;">
            <div class="stat-card">
                <div class="stat-icon">
                    <i data-lucide="wallet"></i>
                </div>
                <div class="stat-info">
                    <h3>Saldo Atual</h3>
                    <p>R$ <?php echo number_format($user['saldo'], 2, ',', '.'); ?></p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i data-lucide="users"></i>
                </div>
                <div class="stat-info">
                    <h3>Afiliados</h3>
                    <p><?php echo $totalAffiliatesCount; ?></p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i data-lucide="percent"></i>
                </div>
                <div class="stat-info">
                    <h3>Tipo Comissão</h3>
                    <p style="text-transform: uppercase; font-size: 1.25rem;"><?php echo $user['commission_type'] == 'cpa' ? 'CPA' : 'REV'; ?></p>
                </div>
            </div>
        </div>

        <!-- Recent Activity Tabs -->
        <div class="card" style="flex-grow: 1; margin-bottom: 0;">
            <div class="card-header" style="border-bottom: none; padding-bottom: 0;">
                <div class="tabs-header">
                    <button onclick="switchTab('deposits')" id="tab-deposits" class="tab-btn <?php echo $activeTab == 'deposits' ? 'active' : ''; ?>">Depósitos</button>
                    <button onclick="switchTab('withdrawals')" id="tab-withdrawals" class="tab-btn <?php echo $activeTab == 'withdrawals' ? 'active' : ''; ?>">Saques</button>
                    <button onclick="switchTab('affiliates')" id="tab-affiliates" class="tab-btn <?php echo $activeTab == 'affiliates' ? 'active' : ''; ?>">Afiliados</button>
                    <button onclick="switchTab('games')" id="tab-games" class="tab-btn <?php echo $activeTab == 'games' ? 'active' : ''; ?>">Jogos</button>
                </div>
            </div>
            
            <div id="content-deposits" class="tab-content" style="display: <?php echo $activeTab == 'deposits' ? 'block' : 'none'; ?>;">
                <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>Data</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($row = $deposits->fetch()): 
                            $statusClass = $row['status'] == 'paid' ? 'status-paid' : ($row['status'] == 'pending' ? 'status-pending' : 'status-failed');
                        ?>
                        <tr>
                            <td>#<?php echo $row['id']; ?></td>
                            <td>R$ <?php echo number_format($row['amount'], 2, ',', '.'); ?></td>
                            <td><span class="status-badge <?php echo $statusClass; ?>"><?php echo ucfirst($row['status']); ?></span></td>
                            <td><?php echo date('d/m/Y H:i', strtotime($row['created_at'])); ?></td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
                </div>
                <?php echo renderPagination($pageDeposits, $totalPagesDeposits, 'deposits', $userId); ?>
            </div>

            <div id="content-withdrawals" class="tab-content" style="display: <?php echo $activeTab == 'withdrawals' ? 'block' : 'none'; ?>;">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Valor</th>
                            <th>Chave PIX</th>
                            <th>Status</th>
                            <th>Data</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($row = $withdrawals->fetch()): 
                            $statusClass = $row['status'] == 'approved' ? 'status-approved' : ($row['status'] == 'pending' ? 'status-pending' : 'status-rejected');
                        ?>
                        <tr>
                            <td>#<?php echo $row['id']; ?></td>
                            <td>R$ <?php echo number_format($row['amount'], 2, ',', '.'); ?></td>
                            <td><?php echo htmlspecialchars($row['pix_key']); ?></td>
                            <td><span class="status-badge <?php echo $statusClass; ?>"><?php echo ucfirst($row['status']); ?></span></td>
                            <td><?php echo date('d/m/Y H:i', strtotime($row['created_at'])); ?></td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
                <?php echo renderPagination($pageWithdrawals, $totalPagesWithdrawals, 'withdrawals', $userId); ?>
            </div>

            <div id="content-affiliates" class="tab-content" style="display: <?php echo $activeTab == 'affiliates' ? 'block' : 'none'; ?>;">
                <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Data Cadastro</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($row = $affiliates->fetch()): ?>
                        <tr>
                            <td>#<?php echo $row['id']; ?></td>
                            <td><?php echo htmlspecialchars($row['nome_completo']); ?></td>
                            <td><?php echo htmlspecialchars($row['email']); ?></td>
                            <td><?php echo date('d/m/Y H:i', strtotime($row['created_at'])); ?></td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
                </div>
                <?php echo renderPagination($pageAffiliates, $totalPagesAffiliates, 'affiliates', $userId); ?>
            </div>

            <div id="content-games" class="tab-content" style="display: <?php echo $activeTab == 'games' ? 'block' : 'none'; ?>;">
                <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Aposta</th>
                            <th>Ganho</th>
                            <th>Resultado</th>
                            <th>Data</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($row = $games->fetch()): 
                            $statusClass = $row['win_amount'] > 0 ? 'status-win' : 'status-loss';
                        ?>
                        <tr>
                            <td>#<?php echo $row['id']; ?></td>
                            <td>R$ <?php echo number_format($row['bet_amount'], 2, ',', '.'); ?></td>
                            <td>R$ <?php echo number_format($row['win_amount'], 2, ',', '.'); ?></td>
                            <td><span class="status-badge <?php echo $statusClass; ?>"><?php echo $row['win_amount'] > 0 ? 'Win' : 'Loss'; ?></span></td>
                            <td><?php echo date('d/m/Y H:i', strtotime($row['created_at'])); ?></td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
                </div>
                <?php echo renderPagination($pageGames, $totalPagesGames, 'games', $userId); ?>
            </div>

        </div>
    </div>
</div>

<style>
    .page-header {
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .back-btn {
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        color: var(--text-color);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        white-space: nowrap;
    }
    .page-title {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        word-break: break-word;
    }

    .details-grid {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 1.5rem;
        margin-bottom: 2rem;
        width: 100%;
    }
    .tabs-header {
        display: flex;
        gap: 1rem;
        border-bottom: 1px solid var(--border-color);
        width: 100%;
        overflow-x: auto;
        white-space: nowrap;
        scrollbar-width: thin;
    }

    @media (max-width: 768px) {
        .page-header {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
            text-align: center;
        }
        .back-btn {
            justify-content: center;
        }
        .page-title {
            font-size: 1.25rem;
        }

        .details-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
        }
        .tabs-header {
            padding-bottom: 10px;
            justify-content: space-between;
        }
        .tab-btn {
            padding: 1rem 0.5rem;
            flex: 1;
            text-align: center;
            font-size: 0.9rem;
        }
        
        /* Mobile specific adjustments */
        .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
            margin-bottom: 1.5rem !important;
        }
        .stat-card:last-child {
            grid-column: span 2;
        }
        .stat-card {
            padding: 1rem !important;
            flex-direction: column;
            text-align: center;
            align-items: center;
        }
        .stat-icon {
            margin-right: 0 !important;
            margin-bottom: 0.5rem;
        }
        .stat-info h3 {
            font-size: 0.8rem;
        }
        .stat-info p {
            font-size: 1.1rem !important;
        }
    }
    .tab-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        padding: 1rem;
        cursor: pointer;
        font-weight: 600;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
    }
    .tab-btn:hover {
        color: white;
    }
    .tab-btn.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
    }
    .tab-content {
        padding-top: 1rem;
    }
    .pagination {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 1.5rem;
    }
    .page-link {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 4px;
        background: var(--input-bg);
        border: 1px solid var(--border-color);
        color: var(--text-color);
        text-decoration: none;
        transition: all 0.2s;
    }
    .page-link:hover {
        background: var(--border-color);
        color: white;
    }
    .page-link.active {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: white;
    }
    .page-link.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>

<script>
    function switchTab(tabName) {
        // Hide all contents
        document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
        // Deactivate all buttons
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        
        // Show selected
        document.getElementById('content-' + tabName).style.display = 'block';
        document.getElementById('tab-' + tabName).classList.add('active');
        
        // Update URL to keep tab active on refresh (optional but good for UX)
        const url = new URL(window.location);
        url.searchParams.set('active_tab', tabName);
        window.history.pushState({}, '', url);
    }
</script>

<?php include 'includes/footer.php'; ?>
