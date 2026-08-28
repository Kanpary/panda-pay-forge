<?php
require_once 'includes/auth.php';
require_once '../db.php';

$limit = 10;
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$offset = ($page - 1) * $limit;

// Count total records
$totalStmt = $pdo->query("SELECT COUNT(*) FROM deposits");
$totalRecords = $totalStmt->fetchColumn();
$totalPages = ceil($totalRecords / $limit);

include 'includes/header.php';
?>

<div class="card">
    <div class="card-header">
        <h3 class="card-title">Histórico de Depósitos</h3>
    </div>
    
    <div class="table-responsive">
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Usuário</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Transação ID</th>
                <th>Data</th>
            </tr>
        </thead>
        <tbody>
            <?php
            $stmt = $pdo->prepare("SELECT d.*, u.email, u.nome_completo FROM deposits d LEFT JOIN users u ON d.user_id = u.id ORDER BY d.created_at DESC LIMIT :limit OFFSET :offset");
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            while ($row = $stmt->fetch()) {
                $statusClass = $row['status'] == 'paid' ? 'status-paid' : ($row['status'] == 'pending' ? 'status-pending' : 'status-failed');
                echo "<tr>";
                echo "<td>#{$row['id']}</td>";
                echo "<td>" . htmlspecialchars($row['nome_completo'] . ' (' . $row['email'] . ')') . "</td>";
                echo "<td>R$ " . number_format($row['amount'], 2, ',', '.') . "</td>";
                echo "<td><span class='status-badge {$statusClass}'>" . ucfirst($row['status']) . "</span></td>";
                echo "<td>" . htmlspecialchars($row['transaction_id'] ?? '-') . "</td>";
                echo "<td>" . date('d/m/Y H:i', strtotime($row['created_at'])) . "</td>";
                echo "</tr>";
            }
            ?>
        </tbody>
    </table>
    </div>

    <!-- Pagination -->
    <?php if ($totalPages > 1): ?>
    <div class="pagination" style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 1.5rem; padding-bottom: 1.5rem;">
        <?php if ($page > 1): ?>
            <a href="?page=<?php echo $page - 1; ?>" class="page-link">&laquo;</a>
        <?php else: ?>
            <span class="page-link disabled">&laquo;</span>
        <?php endif; ?>

        <?php for ($i = 1; $i <= $totalPages; $i++): ?>
            <a href="?page=<?php echo $i; ?>" class="page-link <?php echo $i == $page ? 'active' : ''; ?>"><?php echo $i; ?></a>
        <?php endfor; ?>

        <?php if ($page < $totalPages): ?>
            <a href="?page=<?php echo $page + 1; ?>" class="page-link">&raquo;</a>
        <?php else: ?>
            <span class="page-link disabled">&raquo;</span>
        <?php endif; ?>
    </div>
    <?php endif; ?>
</div>

<style>
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

<?php include 'includes/footer.php'; ?>
