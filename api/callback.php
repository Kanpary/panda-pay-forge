<?php
require_once '../db.php';

header('Content-Type: application/json; charset=utf-8');
$body = file_get_contents('php://input');
file_put_contents(__DIR__ . '/onixpay_callback.log', date('Y-m-d H:i:s') . ' - ' . $body . PHP_EOL, FILE_APPEND);

try {
    $stmt = $pdo->prepare("SELECT webhook_secret FROM gateway_config WHERE gateway_name = 'onixpay' AND is_active = 1 LIMIT 1");
    $stmt->execute();
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    $secret = trim($config['webhook_secret'] ?? '');

    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $signature = $headers['X-OnixPay-Signature'] ?? $headers['x-onixpay-signature'] ?? $_SERVER['HTTP_X_ONIXPAY_SIGNATURE'] ?? '';
    if ($secret !== '') {
        $expected = 'sha256=' . hash_hmac('sha256', $body, $secret);
        if (!$signature || !hash_equals($expected, $signature)) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Assinatura inválida']);
            exit;
        }
    }

    $data = json_decode($body, true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'JSON inválido']);
        exit;
    }

    $transactionType = strtoupper((string)($data['transactionType'] ?? ''));
    $transactionId = trim((string)($data['transactionId'] ?? ''));
    $status = strtoupper((string)($data['status'] ?? ''));
    if ($transactionType !== 'RECEIVEPIX' || $transactionId === '') {
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Evento recebido']);
        exit;
    }

    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT * FROM deposits WHERE transaction_id = ? OR external_id = ? LIMIT 1 FOR UPDATE');
    $stmt->execute([$transactionId, $transactionId]);
    $deposit = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$deposit) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Depósito não encontrado']);
        exit;
    }

    if ($deposit['status'] === 'paid') {
        $pdo->commit();
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Pagamento já processado']);
        exit;
    }

    if ($status === 'PAID') {
        $stmt = $pdo->prepare("UPDATE deposits SET status = 'paid', transaction_id = ? WHERE id = ? AND status <> 'paid'");
        $stmt->execute([$transactionId, $deposit['id']]);

        if ($stmt->rowCount() > 0) {
            $stmt = $pdo->prepare('UPDATE users SET saldo = saldo + ? WHERE id = ?');
            $stmt->execute([$deposit['amount'], $deposit['user_id']]);

            $stmt = $pdo->prepare(
                'SELECT u.referred_by, r.comissao, r.commission_type, r.cpa_value
                 FROM users u LEFT JOIN users r ON u.referred_by = r.id WHERE u.id = ?'
            );
            $stmt->execute([$deposit['user_id']]);
            $userData = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($userData && $userData['referred_by']) {
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM deposits WHERE user_id = ? AND status = 'paid' AND id <> ?");
                $stmt->execute([$deposit['user_id'], $deposit['id']]);
                if ((int)$stmt->fetchColumn() === 0) {
                    $commission = ($userData['commission_type'] ?? 'rev') === 'cpa'
                        ? (float)($userData['cpa_value'] ?? 10)
                        : (float)$deposit['amount'] * ((int)($userData['comissao'] ?? 10) / 100);
                    if ($commission > 0) {
                        $stmt = $pdo->prepare('UPDATE users SET saldo = saldo + ? WHERE id = ?');
                        $stmt->execute([$commission, $userData['referred_by']]);
                        $stmt = $pdo->prepare("INSERT INTO affiliate_logs (referrer_id, referred_id, amount, type) VALUES (?, ?, ?, 'deposit_commission')");
                        $stmt->execute([$userData['referred_by'], $deposit['user_id'], $commission]);
                    }
                }
            }
        }
    } elseif (in_array($status, ['FAILED', 'CANCELLED'], true)) {
        $stmt = $pdo->prepare("UPDATE deposits SET status = 'failed' WHERE id = ? AND status = 'pending'");
        $stmt->execute([$deposit['id']]);
    }

    $pdo->commit();
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Evento processado']);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('OnixPay callback error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno']);
}
