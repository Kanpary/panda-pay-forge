<?php
require_once '../db.php';
require_once 'onixpay.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Usuário não logado']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$amountStr = str_replace(['R$', '.', ' '], '', (string)($input['amount'] ?? '0'));
$amount = (float)str_replace(',', '.', $amountStr);
$pixKey = trim((string)($input['pixKey'] ?? $input['pix_key'] ?? ''));
$pixKeyType = strtoupper(trim((string)($input['pixKeyType'] ?? $input['pix_key_type'] ?? 'CPF')));

if ($amount < 10) {
    echo json_encode(['success' => false, 'message' => 'Valor mínimo para saque é R$ 10,00']);
    exit;
}
if ($pixKey === '') {
    echo json_encode(['success' => false, 'message' => 'Chave PIX não informada']);
    exit;
}

try {
    $userId = (int)$_SESSION['user_id'];
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('SELECT saldo, nome_completo, cpf FROM users WHERE id = ? FOR UPDATE');
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        throw new RuntimeException('Usuário não encontrado');
    }
    if ((float)$user['saldo'] < $amount) {
        throw new RuntimeException('Saldo insuficiente');
    }

    $nome = trim($user['nome_completo']);
    $cpf = preg_replace('/\D/', '', $user['cpf'] ?? '');
    if (strlen($cpf) !== 11) {
        throw new RuntimeException('CPF inválido');
    }

    $onixPay = new OnixPay($pdo);
    $callbackUrl = $onixPay->getCallbackUrl('/api/callback_saida.php');
    $response = $onixPay->createPayment($amount, $nome, $cpf, $pixKey, $callbackUrl);

    $transactionId = trim((string)($response['transactionId'] ?? ''));
    $status = strtoupper((string)($response['status'] ?? 'PENDING'));
    if ($transactionId === '') {
        throw new RuntimeException('A OnixPay não retornou o identificador do saque.');
    }

    $withdrawalStatus = $status === 'PAID' ? 'approved' : 'pending';
    $stmt = $pdo->prepare(
        'INSERT INTO withdrawals (user_id, amount, pix_key_type, pix_key, nome, cpf, status, transaction_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$userId, $amount, $pixKeyType ?: 'PIX', $pixKey, $nome, $cpf, $withdrawalStatus, $transactionId]);

    // Reserva o saldo enquanto a transferência está pending; em falha o callback faz o estorno.
    $stmt = $pdo->prepare('UPDATE users SET saldo = saldo - ? WHERE id = ?');
    $stmt->execute([$amount, $userId]);
    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => $status === 'PAID' ? 'Saque enviado com sucesso' : 'Saque enviado e aguardando confirmação',
        'transactionId' => $transactionId,
        'status' => $status,
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('OnixPay withdrawal error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
