<?php
require_once 'includes/auth.php';
require_once '../db.php';

// Estatísticas
try {
    // Total Usuários
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    $totalUsers = $stmt->fetchColumn();

    // Total Depósitos Pagos
    $stmt = $pdo->query("SELECT SUM(amount) FROM deposits WHERE status = 'paid'");
    $totalDeposits = $stmt->fetchColumn() ?: 0;

    // Total Saques Pagos/Aprovados
    $stmt = $pdo->query("SELECT SUM(amount) FROM withdrawals WHERE status = 'approved'");
    $totalWithdrawals = $stmt->fetchColumn() ?: 0;

    // Receita Líquida
    $netRevenue = $totalDeposits - $totalWithdrawals;

} catch (PDOException $e) {
    $totalUsers = 0;
    $totalDeposits = 0;
    $totalWithdrawals = 0;
    $netRevenue = 0;
}

include 'includes/header.php';
?>

<div class="card">
    <div class="card-header">
        <h3 class="card-title">Dashboard</h3>
    </div>
    
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon">
                <i data-lucide="users"></i>
            </div>
            <div class="stat-info">
                <h3>Total Usuários</h3>
                <p><?php echo number_format($totalUsers); ?></p>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon" style="color: #059669; background-color: #d1fae5;">
                <i data-lucide="arrow-down-circle"></i>
            </div>
            <div class="stat-info">
                <h3>Total Depósitos</h3>
                <p>R$ <?php echo number_format($totalDeposits, 2, ',', '.'); ?></p>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon" style="color: #dc2626; background-color: #fee2e2;">
                <i data-lucide="arrow-up-circle"></i>
            </div>
            <div class="stat-info">
                <h3>Total Saques</h3>
                <p>R$ <?php echo number_format($totalWithdrawals, 2, ',', '.'); ?></p>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon" style="color: #7c3aed; background-color: #ede9fe;">
                <i data-lucide="dollar-sign"></i>
            </div>
            <div class="stat-info">
                <h3>Receita Líquida</h3>
                <p>R$ <?php echo number_format($netRevenue, 2, ',', '.'); ?></p>
            </div>
        </div>
    </div>
    
    <div class="card-header">
        <h3 class="card-title">Últimos Depósitos</h3>
    </div>
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Usuário</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Data</th>
                </tr>
            </thead>
            <tbody>
                <?php
                try {
                    $stmt = $pdo->query("SELECT d.*, u.email FROM deposits d LEFT JOIN users u ON d.user_id = u.id ORDER BY d.created_at DESC LIMIT 5");
                    while ($row = $stmt->fetch()) {
                        $statusClass = $row['status'] == 'paid' ? 'status-paid' : ($row['status'] == 'pending' ? 'status-pending' : 'status-failed');
                        echo "<tr>";
                        echo "<td>#{$row['id']}</td>";
                        echo "<td>" . htmlspecialchars($row['email'] ?? 'N/A') . "</td>";
                        echo "<td>R$ " . number_format($row['amount'], 2, ',', '.') . "</td>";
                        echo "<td><span class='status-badge {$statusClass}'>" . ucfirst($row['status']) . "</span></td>";
                        echo "<td>" . date('d/m/Y H:i', strtotime($row['created_at'])) . "</td>";
                        echo "</tr>";
                    }
                } catch (PDOException $e) {
                    echo "<tr><td colspan='5'>Erro ao carregar dados.</td></tr>";
                }
                ?>
            </tbody>
        </table>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
