<?php
require_once '../db.php';

header('Content-Type: application/json; charset=utf-8');
$body = file_get_contents('php://input');
file_put_contents(__DIR__ . '/onixpay_transfer_callback.log', date('Y-m-d H:i:s') . ' - ' . $body . PHP_EOL, FILE_APPEND);

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
    $transactionId = trim((string)($data['transactionId'] ?? ''));
    $statusId = (int)($data['statusCode']['statusId'] ?? 0);
    if ($transactionId === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'transactionId ausente']);
        exit;
    }

    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT * FROM withdrawals WHERE transaction_id = ? LIMIT 1 FOR UPDATE');
    $stmt->execute([$transactionId]);
    $withdrawal = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$withdrawal) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Saque não encontrado']);
        exit;
    }

    if ($statusId === 1) {
        $stmt = $pdo->prepare("UPDATE withdrawals SET status = 'approved' WHERE id = ? AND status = 'pending'");
        $stmt->execute([$withdrawal['id']]);
    } elseif ($statusId === 3) {
        $stmt = $pdo->prepare("UPDATE withdrawals SET status = 'rejected' WHERE id = ? AND status = 'pending'");
        $stmt->execute([$withdrawal['id']]);
        if ($stmt->rowCount() > 0) {
            $stmt = $pdo->prepare('UPDATE users SET saldo = saldo + ? WHERE id = ?');
            $stmt->execute([$withdrawal['amount'], $withdrawal['user_id']]);
        }
    }

    $pdo->commit();
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Transferência processada']);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('OnixPay transfer callback error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno']);
}
