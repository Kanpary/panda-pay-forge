<?php
require_once 'includes/auth.php';
require_once '../db.php';

$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    try {
        if ($action === 'update_general') {

            // >>> VALIDAÇÃO DEPÓSITO MÍNIMO (NÃO REMOVE NADA)
            $minDeposit = floatval($_POST['min_deposit'] ?? 0);
            if ($minDeposit < 10) {
                throw new Exception('O depósito mínimo não pode ser menor que R$ 10,00.');
            }
            // <<< FIM DA VALIDAÇÃO

            $settings = [
                'min_deposit' => $_POST['min_deposit'],
                'min_withdrawal' => $_POST['min_withdrawal'],
                'rollover_multiplier' => $_POST['rollover_multiplier']
            ];
            
            $stmt = $pdo->prepare(
                "INSERT INTO settings (setting_key, setting_value) 
                 VALUES (?, ?) 
                 ON DUPLICATE KEY UPDATE setting_value = ?"
            );

            foreach ($settings as $key => $value) {
                $stmt->execute([$key, $value, $value]);
            }

            $message = 'Configurações gerais atualizadas!';
            
        } elseif ($action === 'update_multipliers') {
            $ids = $_POST['mult_id'] ?? [];
            $chances = $_POST['mult_chance'] ?? [];
            
            $stmt = $pdo->prepare("UPDATE multiplicadores SET chance = ? WHERE id = ?");
            foreach ($ids as $key => $id) {
                $stmt->execute([$chances[$key], $id]);
            }
            $message = 'Multiplicadores atualizados!';
            
        } elseif ($action === 'update_probabilities') {
            $ids = $_POST['prob_id'] ?? [];
            $chances = $_POST['prob_chance'] ?? [];
            
            $stmt = $pdo->prepare("UPDATE probabilidade SET chance = ? WHERE id = ?");
            foreach ($ids as $key => $id) {
                $stmt->execute([$chances[$key], $id]);
            }
            $message = 'Probabilidades atualizadas!';

        } elseif ($action === 'update_multipliers_influencer') {
            $ids = $_POST['mult_id'] ?? [];
            $chances = $_POST['mult_chance'] ?? [];
            
            $stmt = $pdo->prepare("UPDATE multiplicadores_influencer SET chance = ? WHERE id = ?");
            foreach ($ids as $key => $id) {
                $stmt->execute([$chances[$key], $id]);
            }
            $message = 'Multiplicadores (Influencer) atualizados!';
            
        } elseif ($action === 'update_probabilities_influencer') {
            $ids = $_POST['prob_id'] ?? [];
            $chances = $_POST['prob_chance'] ?? [];
            
            $stmt = $pdo->prepare("UPDATE probabilidade_influencer SET chance = ? WHERE id = ?");
            foreach ($ids as $key => $id) {
                $stmt->execute([$chances[$key], $id]);
            }
            $message = 'Probabilidades (Influencer) atualizadas!';
        }
    } catch (Exception $e) {
        $message = $e->getMessage();
    }
}

// Fetch Data
$settings = [];
$stmt = $pdo->query("SELECT * FROM settings");
while ($row = $stmt->fetch()) {
    $settings[$row['setting_key']] = $row['setting_value'];
}

$multipliers = $pdo->query("SELECT * FROM multiplicadores ORDER BY valor ASC")->fetchAll();
$probabilities = $pdo->query("SELECT * FROM probabilidade ORDER BY valor ASC")->fetchAll();

try {
    $multipliersInfluencer = $pdo->query("SELECT * FROM multiplicadores_influencer ORDER BY valor ASC")->fetchAll();
} catch (PDOException $e) {
    $multipliersInfluencer = [];
}

try {
    $probabilitiesInfluencer = $pdo->query("SELECT * FROM probabilidade_influencer ORDER BY valor ASC")->fetchAll();
} catch (PDOException $e) {
    $probabilitiesInfluencer = [];
}

include 'includes/header.php';
?>

<div class="card">
    <div class="card-header">
        <h3 class="card-title">Configurações Gerais</h3>
    </div>
    
    <?php if ($message): ?>
        <div style="background-color: #d1fae5; color: #065f46; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
            <?php echo htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>

    <form method="POST">
        <input type="hidden" name="action" value="update_general">
        <div class="form-group">
            <label>Depósito Mínimo (R$ 10)</label>
            <input type="number" step="0.01" name="min_deposit" class="form-control" value="<?php echo $settings['min_deposit'] ?? '20.00'; ?>">
        </div>
        <div class="form-group">
            <label>Saque Mínimo (R$)</label>
            <input type="number" step="0.01" name="min_withdrawal" class="form-control" value="<?php echo $settings['min_withdrawal'] ?? '50.00'; ?>">
        </div>
        <div class="form-group">
            <label>Multiplicador de Rollover</label>
            <input type="number" step="1" name="rollover_multiplier" class="form-control" value="<?php echo $settings['rollover_multiplier'] ?? '1'; ?>">
        </div>
        <button type="submit" class="btn btn-primary">Salvar Gerais</button>
    </form>
</div>

<div class="card">
    <div class="card-header">
        <h3 class="card-title">Multiplicadores da Roleta (Chance %)</h3>
    </div>
    <form method="POST">
        <input type="hidden" name="action" value="update_multipliers">
        <table>
            <thead>
                <tr>
                    <th>Multiplicador</th>
                    <th>Chance (%)</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($multipliers as $m): ?>
                <tr>
                    <td><?php echo $m['valor']; ?>x</td>
                    <td>
                        <input type="hidden" name="mult_id[]" value="<?php echo $m['id']; ?>">
                        <input type="number" step="0.01" name="mult_chance[]" class="form-control" value="<?php echo $m['chance']; ?>" style="margin-bottom:0;">
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <div style="margin-top: 1rem;">
            <button type="submit" class="btn btn-primary">Salvar Multiplicadores</button>
        </div>
    </form>
</div>

<div class="card">
    <div class="card-header">
        <h3 class="card-title">Probabilidade dos Números (Chance %)</h3>
    </div>
    <form method="POST">
        <input type="hidden" name="action" value="update_probabilities">
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th>Número</th>
                    <th>Chance (%)</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($probabilities as $p): ?>
                <tr>
                    <td><?php echo $p['valor']; ?></td>
                    <td>
                        <input type="hidden" name="prob_id[]" value="<?php echo $p['id']; ?>">
                        <input type="number" step="0.01" name="prob_chance[]" class="form-control" value="<?php echo $p['chance']; ?>" style="margin-bottom:0;">
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
        <div style="margin-top: 1rem;">
            <button type="submit" class="btn btn-primary">Salvar Probabilidades</button>
        </div>
    </form>
</div>

<div class="card">
    <div class="card-header">
        <h3 class="card-title">Multiplicadores da Roleta (Modo Influencer)</h3>
    </div>
    <form method="POST">
        <input type="hidden" name="action" value="update_multipliers_influencer">
        <table>
            <thead>
                <tr>
                    <th>Multiplicador</th>
                    <th>Chance (%)</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($multipliersInfluencer as $m): ?>
                <tr>
                    <td><?php echo $m['valor']; ?>x</td>
                    <td>
                        <input type="hidden" name="mult_id[]" value="<?php echo $m['id']; ?>">
                        <input type="number" step="0.01" name="mult_chance[]" class="form-control" value="<?php echo $m['chance']; ?>" style="margin-bottom:0;">
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <div style="margin-top: 1rem;">
            <button type="submit" class="btn btn-primary">Salvar Multiplicadores (Influencer)</button>
        </div>
    </form>
</div>

<div class="card">
    <div class="card-header">
        <h3 class="card-title">Probabilidade dos Números (Modo Influencer)</h3>
    </div>
    <form method="POST">
        <input type="hidden" name="action" value="update_probabilities_influencer">
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th>Número</th>
                    <th>Chance (%)</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($probabilitiesInfluencer as $p): ?>
                <tr>
                    <td><?php echo $p['valor']; ?></td>
                    <td>
                        <input type="hidden" name="prob_id[]" value="<?php echo $p['id']; ?>">
                        <input type="number" step="0.01" name="prob_chance[]" class="form-control" value="<?php echo $p['chance']; ?>" style="margin-bottom:0;">
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
        <div style="margin-top: 1rem;">
            <button type="submit" class="btn btn-primary">Salvar Probabilidades (Influencer)</button>
        </div>
    </form>
</div>

<?php include 'includes/footer.php'; ?>
