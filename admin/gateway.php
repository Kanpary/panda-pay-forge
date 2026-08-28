<?php
require_once 'includes/auth.php';
require_once '../db.php';

$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $clientId = trim($_POST['client_id'] ?? '');
    $clientSecret = trim($_POST['client_secret'] ?? '');
    $webhookSecret = trim($_POST['webhook_secret'] ?? '');
    $isActive = isset($_POST['is_active']) ? 1 : 0;

    try {
        if ($clientId === '' || $clientSecret === '') {
            throw new RuntimeException('Client ID e Client Secret são obrigatórios.');
        }

        $stmt = $pdo->prepare('SELECT id FROM gateway_config WHERE gateway_name = ? LIMIT 1');
        $stmt->execute(['onixpay']);
        if ($stmt->fetch()) {
            $stmt = $pdo->prepare(
                "UPDATE gateway_config SET client_id = ?, client_secret = ?, webhook_secret = ?,
                 base_url = 'https://onixpay.space/api/v2', is_active = ? WHERE gateway_name = 'onixpay'"
            );
            $stmt->execute([$clientId, $clientSecret, $webhookSecret ?: null, $isActive]);
        } else {
            $stmt = $pdo->prepare(
                "INSERT INTO gateway_config (gateway_name, client_id, client_secret, webhook_secret, base_url, is_active)
                 VALUES ('onixpay', ?, ?, ?, 'https://onixpay.space/api/v2', ?)"
            );
            $stmt->execute([$clientId, $clientSecret, $webhookSecret ?: null, $isActive]);
        }
        $message = 'Configurações da OnixPay atualizadas com sucesso.';
    } catch (Throwable $e) {
        $message = 'Erro ao atualizar configurações: ' . $e->getMessage();
    }
}

try {
    $stmt = $pdo->prepare("SELECT * FROM gateway_config WHERE gateway_name = 'onixpay' LIMIT 1");
    $stmt->execute();
    $config = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
} catch (Throwable $e) {
    $config = [];
    $message = 'Execute a migração do banco antes de salvar a configuração.';
}

include 'includes/header.php';
?>

<div class="card">
    <div class="card-header"><h3 class="card-title">Configuração Gateway (OnixPay)</h3></div>

    <?php if ($message): ?>
        <div style="background-color:#d1fae5;color:#065f46;padding:1rem;border-radius:.5rem;margin-bottom:1rem;">
            <?= htmlspecialchars($message) ?>
        </div>
    <?php endif; ?>

    <form method="POST">
        <div class="form-group">
            <label for="client_id">Client ID</label>
            <input type="text" id="client_id" name="client_id" class="form-control"
                   value="<?= htmlspecialchars($config['client_id'] ?? '') ?>" required>
        </div>
        <div class="form-group">
            <label for="client_secret">Client Secret</label>
            <input type="password" id="client_secret" name="client_secret" class="form-control"
                   value="<?= htmlspecialchars($config['client_secret'] ?? '') ?>" required>
        </div>
        <div class="form-group">
            <label for="webhook_secret">Webhook Secret (opcional, recomendado)</label>
            <input type="password" id="webhook_secret" name="webhook_secret" class="form-control"
                   value="<?= htmlspecialchars($config['webhook_secret'] ?? '') ?>">
            <small>Preencha apenas se a assinatura HMAC estiver ativada no painel da OnixPay.</small>
        </div>
        <div class="form-group" style="display:flex;align-items:center;gap:.5rem;margin-bottom:1rem;">
            <input type="checkbox" id="is_active" name="is_active" <?= ($config['is_active'] ?? 1) ? 'checked' : '' ?>>
            <label for="is_active" style="margin-bottom:0;">Ativo</label>
        </div>
        <button type="submit" class="btn btn-primary">Salvar Configurações</button>
    </form>

    <div class="gateway-link">
        <a href="https://onixpay.space/keys" target="_blank" rel="noopener">Abrir credenciais da OnixPay</a>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
