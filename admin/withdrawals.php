<?php
require_once 'includes/auth.php';
require_once '../db.php';

$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $id = $_POST['id'] ?? 0;
    
    if ($id) {
        try {
            $pdo->beginTransaction();
            
            $stmt = $pdo->prepare("SELECT * FROM withdrawals WHERE id = ? FOR UPDATE");
            $stmt->execute([$id]);
            $withdrawal = $stmt->fetch();
            
            if ($withdrawal && $withdrawal['status'] === 'pending') {
                if ($action === 'approve') {
                    $stmt = $pdo->prepare("UPDATE withdrawals SET status = 'approved' WHERE id = ?");
                    $stmt->execute([$id]);
                    $message = 'Saque aprovado com sucesso!';
                } elseif ($action === 'reject') {
                    $stmt = $pdo->prepare("UPDATE withdrawals SET status = 'rejected' WHERE id = ?");
                    $stmt->execute([$id]);
                    
                    // Estornar valor
                    $stmt = $pdo->prepare("UPDATE users SET saldo = saldo + ? WHERE id = ?");
                    $stmt->execute([$withdrawal['amount'], $withdrawal['user_id']]);
                    
                    $message = 'Saque rejeitado e valor estornado.';
                }
            }
            
            $pdo->commit();
        } catch (PDOException $e) {
            $pdo->rollBack();
            $message = 'Erro ao processar ação: ' . $e->getMessage();
        }
    }
}

$limit = 10;
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$offset = ($page - 1) * $limit;

// Count total records
$totalStmt = $pdo->query("SELECT COUNT(*) FROM withdrawals");
$totalRecords = $totalStmt->fetchColumn();
$totalPages = ceil($totalRecords / $limit);

include 'includes/header.php';
?>

<div class="card">
    <div class="card-header">
        <h3 class="card-title">Solicitações de Saque</h3>
    </div>
    
    <?php if ($message): ?>
        <div style="background-color: #d1fae5; color: #065f46; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
            <?php echo htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>

    <div class="table-responsive">
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Usuário</th>
                <th>Valor</th>
                <th>Chave PIX</th>
                <th>Status</th>
                <th>Data</th>
                <th>Ações</th>
            </tr>
        </thead>
        <tbody>
            <?php
            $stmt = $pdo->prepare("SELECT w.*, u.email, u.nome_completo FROM withdrawals w LEFT JOIN users u ON w.user_id = u.id ORDER BY w.created_at DESC LIMIT :limit OFFSET :offset");
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            while ($row = $stmt->fetch()) {
                $statusClass = $row['status'] == 'approved' ? 'status-approved' : ($row['status'] == 'pending' ? 'status-pending' : 'status-rejected');
                echo "<tr>";
                echo "<td>#{$row['id']}</td>";
                echo "<td>" . htmlspecialchars($row['nome_completo']) . "<br><small>" . htmlspecialchars($row['email']) . "</small></td>";
                echo "<td>R$ " . number_format($row['amount'], 2, ',', '.') . "</td>";
                echo "<td>
                        Tipo: " . htmlspecialchars($row['pix_key_type']) . "<br>
                        Chave: " . htmlspecialchars($row['pix_key']) . "<br>
                        Nome: " . htmlspecialchars($row['nome']) . "<br>
                        CPF: " . htmlspecialchars($row['cpf']) . "
                      </td>";
                echo "<td><span class='status-badge {$statusClass}'>" . ucfirst($row['status']) . "</span></td>";
                echo "<td>" . date('d/m/Y H:i', strtotime($row['created_at'])) . "</td>";
                echo "<td>";
                if ($row['status'] === 'pending') {
                    echo "<form method='POST' style='display:inline-block; margin-right:5px;'>
                            <input type='hidden' name='id' value='{$row['id']}'>
                            <button type='submit' name='action' value='approve' class='btn btn-primary' style='background-color: #059669;'>Aprovar</button>
                          </form>";
                    echo "<form method='POST' style='display:inline-block;'>
                            <input type='hidden' name='id' value='{$row['id']}'>
                            <button type='submit' name='action' value='reject' class='btn btn-primary' style='background-color: #dc2626;'>Rejeitar</button>
                          </form>";
                } else {
                    echo "-";
                }
                echo "</td>";
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
