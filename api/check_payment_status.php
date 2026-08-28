<?php
require_once '../db.php';
header('Content-Type: application/json');

$transactionId = $_GET['transactionId'] ?? 0;

try {
    $stmt = $pdo->prepare("SELECT status, amount, user_id FROM deposits WHERE id = ?");
    $stmt->execute([$transactionId]);
    $deposit = $stmt->fetch();
    
    if (!$deposit) {
        echo json_encode(['status' => 'not_found']);
        exit;
    }
    
    echo json_encode(['status' => strtoupper($deposit['status'])]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error']);
}
?>
