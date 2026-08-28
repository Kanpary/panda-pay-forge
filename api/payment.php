<?php
require_once '../db.php';
require_once 'onixpay.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Usuário não logado']);
    exit;
}

$amountStr = $_POST['amount'] ?? '0';
$amountStr = str_replace(['R$', '.', ' '], '', $amountStr);
$amountStr = str_replace(',', '.', $amountStr);
$amount = (float)$amountStr;

if ($amount < 10) {
    echo json_encode(['success' => false, 'error' => 'O valor mínimo para depósito é R$ 10,00']);
    exit;
}

try {
    $userId = (int)$_SESSION['user_id'];
    $stmt = $pdo->prepare('SELECT nome_completo, email, cpf FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new RuntimeException('Usuário não encontrado.');
    }

    $cpf = preg_replace('/\D/', '', $user['cpf'] ?? '');
    if (strlen($cpf) !== 11) {
        throw new RuntimeException('CPF do usuário não cadastrado ou inválido.');
    }

    $stmt = $pdo->prepare("INSERT INTO deposits (user_id, amount, status) VALUES (?, ?, 'pending')");
    $stmt->execute([$userId, $amount]);
    $depositId = (int)$pdo->lastInsertId();

    $onixPay = new OnixPay($pdo);
    $response = $onixPay->createDeposit(
        $amount,
        $user['nome_completo'],
        $cpf,
        $onixPay->getCallbackUrl('/api/callback.php')
    );

    $pixCode = $response['qrcode'] ?? null;
    $transactionId = $response['transactionId'] ?? null;
    $referenceCode = $response['reference_code'] ?? $transactionId;

    if (!$pixCode || !$transactionId) {
        throw new RuntimeException('A OnixPay não retornou o QR Code ou o identificador da transação.');
    }

    $stmt = $pdo->prepare(
        'UPDATE deposits SET qrcode = ?, external_id = ?, transaction_id = ? WHERE id = ?'
    );
    $stmt->execute([$pixCode, $referenceCode, $transactionId, $depositId]);

    echo json_encode([
        'success' => true,
        'transactionId' => $depositId,
        'gatewayTransactionId' => $transactionId,
        'qrcode' => $pixCode,
        'qrCodeBase64' => null,
        'reference_code' => $referenceCode,
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('OnixPay deposit error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
