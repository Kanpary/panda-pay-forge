<?php
require_once 'includes/auth.php';
require_once '../db.php';

$message = '';

// Atualizar saldo
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_saldo') {
    $userId = $_POST['user_id'];
    $newSaldo = str_replace(',', '.', $_POST['saldo']);
    
    try {
        $stmt = $pdo->prepare("UPDATE users SET saldo = ? WHERE id = ?");
        $stmt->execute([$newSaldo, $userId]);
        $message = 'Saldo atualizado com sucesso!';
    } catch (PDOException $e) {
        $message = 'Erro ao atualizar saldo.';
    }
}

// Atualizar comissão
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_commission') {
    $userId = $_POST['user_id'];
    $commissionType = $_POST['commission_type'];
    $revValue = $_POST['comissao']; // RevShare %
    $cpaValue = str_replace(',', '.', $_POST['cpa_value']); // CPA Value
    
    try {
        $stmt = $pdo->prepare("UPDATE users SET commission_type = ?, comissao = ?, cpa_value = ? WHERE id = ?");
        $stmt->execute([$commissionType, $revValue, $cpaValue, $userId]);
        $message = 'Comissão atualizada com sucesso!';
    } catch (PDOException $e) {
        $message = 'Erro ao atualizar comissão.';
    }
}

include 'includes/header.php';
?>

<style>
    .input-group {
        display: flex;
        align-items: center;
        background: var(--input-bg);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 2px;
        width: 140px;
    }
    .input-group input {
        background: transparent;
        border: none;
        color: white;
        width: 100%;
        padding: 6px 8px;
        font-size: 0.9rem;
        outline: none;
    }
    .input-group button {
        background: var(--primary-color);
        border: none;
        color: white;
        padding: 6px 8px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .input-group button:hover {
        background: var(--primary-hover);
    }
    
    .commission-form {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    .form-select-sm {
        background: var(--input-bg);
        border: 1px solid var(--border-color);
        color: var(--text-color);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.85rem;
        width: 100%;
        outline: none;
    }
    .commission-row {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .commission-input-wrapper {
        flex: 1;
        background: var(--input-bg);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        display: flex;
        align-items: center;
        padding: 0 6px;
    }
    .commission-input-wrapper span {
        color: var(--text-muted);
        font-size: 0.8rem;
        margin-right: 4px;
    }
    .commission-input-wrapper input {
        background: transparent;
        border: none;
        color: white;
        width: 100%;
        padding: 6px 0;
        font-size: 0.9rem;
        outline: none;
    }
</style>

<div class="card">
    <div class="card-header">
        <h3 class="card-title">Gerenciar Usuários</h3>
    </div>
    
    <?php if ($message): ?>
        <div style="background-color: rgba(16, 185, 129, 0.2); color: #34d399; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; border: 1px solid rgba(16, 185, 129, 0.2);">
            <?php echo htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>

    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Saldo</th>
                    <th>Comissão</th>
                    <th>Status</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                <?php
                $stmt = $pdo->query("SELECT * FROM users ORDER BY id DESC");
                while ($row = $stmt->fetch()) {
                    echo "<tr>";
                    echo "<td><span style='color: var(--text-muted);'>#{$row['id']}</span></td>";
                    echo "<td>" . htmlspecialchars($row['nome_completo']) . "</td>";
                    echo "<td>" . htmlspecialchars($row['email']) . "</td>";
                    
                    // Form Saldo
                    echo "<td>
                        <form method='POST'>
                            <input type='hidden' name='action' value='update_saldo'>
                            <input type='hidden' name='user_id' value='{$row['id']}'>
                            <div class='input-group'>
                                <input type='text' name='saldo' value='" . number_format($row['saldo'], 2, ',', '.') . "'>
                                <button type='submit' title='Atualizar Saldo'><i data-lucide='check' style='width:16px; height:16px;'></i></button>
                            </div>
                        </form>
                    </td>";
                    
                    // Form Comissão
                    $isCpa = ($row['commission_type'] ?? 'rev') === 'cpa';
                    $cpaDisplay = $isCpa ? 'flex' : 'none';
                    $revDisplay = $isCpa ? 'none' : 'flex';
                    
                    echo "<td>
                        <form method='POST' class='commission-form'>
                            <input type='hidden' name='action' value='update_commission'>
                            <input type='hidden' name='user_id' value='{$row['id']}'>
                            
                            <select name='commission_type' class='form-select-sm' onchange='
                                const form = this.closest(\"form\");
                                form.querySelector(\".cpa-input\").style.display = this.value === \"cpa\" ? \"flex\" : \"none\";
                                form.querySelector(\".rev-input\").style.display = this.value === \"rev\" ? \"flex\" : \"none\";
                            '>
                                <option value='rev' " . (!$isCpa ? 'selected' : '') . ">RevShare (%)</option>
                                <option value='cpa' " . ($isCpa ? 'selected' : '') . ">CPA (Fixo)</option>
                            </select>
                            
                            <div class='commission-row'>
                                <div class='commission-input-wrapper rev-input' style='display: {$revDisplay};'>
                                    <input type='number' name='comissao' value='{$row['comissao']}' placeholder='0'>
                                    <span>%</span>
                                </div>
                                
                                <div class='commission-input-wrapper cpa-input' style='display: {$cpaDisplay};'>
                                    <span>R$</span>
                                    <input type='text' name='cpa_value' value='" . number_format($row['cpa_value'] ?? 10, 2, ',', '.') . "'>
                                </div>
                                
                                <button type='submit' class='btn-primary' style='border:none; padding: 6px; border-radius: 4px; cursor: pointer; display: flex; align-items: center;' title='Salvar'>
                                    <i data-lucide='save' style='width:16px; height:16px;'></i>
                                </button>
                            </div>
                        </form>
                    </td>";
                    
                    $statusClass = ($row['status'] ?? 'offline') == 'online' ? 'status-online' : 'status-offline';
                    echo "<td><span class='status-badge {$statusClass}'>" . ucfirst($row['status'] ?? 'offline') . "</span></td>";
                                    echo "<td>
                        <div style='display: flex; gap: 0.5rem;'>
                            <a href='user_details.php?id={$row['id']}' class='btn' style='padding: 6px; background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2);' title='Ver Detalhes / Editar'>
                                <i data-lucide='eye' style='width:18px; height:18px;'></i>
                            </a>
                            
                            <form method='POST' onsubmit='return confirm(\"Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.\");' style='margin:0;'>
                                <input type='hidden' name='action' value='delete_user'>
                                <input type='hidden' name='user_id' value='{$row['id']}'>
                                <button type='submit' class='btn' style='padding: 6px; background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2);' title='Excluir Usuário'>
                                    <i data-lucide='trash-2' style='width:18px; height:18px;'></i>
                                </button>
                            </form>
                        </div>
                    </td>";
                    echo "</tr>";
                }
                ?>
            </tbody>
        </table>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
