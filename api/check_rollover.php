<?php
require_once '../db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Usuário não logado']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    // 1. Obter multiplicador de rollover das configurações
    $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'rollover_multiplier'");
    $stmt->execute();
    $multiplier = (float)($stmt->fetchColumn() ?: 1);

    // 2. Calcular total de depósitos aprovados
    $stmt = $pdo->prepare("SELECT SUM(amount) FROM deposits WHERE user_id = ? AND status = 'paid'");
    $stmt->execute([$userId]);
    $totalDeposits = (float)$stmt->fetchColumn();

    // 3. Calcular total apostado
    $stmt = $pdo->prepare("SELECT SUM(bet_amount) FROM game_history WHERE user_id = ?");
    $stmt->execute([$userId]);
    $totalBets = (float)$stmt->fetchColumn();

    // 4. Calcular rollover restante
    // Rollover Necessário = Depósitos * Multiplicador
    // Rollover Restante = Max(0, Rollover Necessário - Total Apostado)
    $requiredRollover = $totalDeposits * $multiplier;
    $remainingRollover = max(0, $requiredRollover - $totalBets);

    echo json_encode([
        'success' => true,
        'rollover_restante' => $remainingRollover,
        'details' => [
            'total_deposits' => $totalDeposits,
            'multiplier' => $multiplier,
            'required' => $requiredRollover,
            'wagered' => $totalBets
        ]
    ]);

} catch (Exception $e) {
    error_log("Rollover Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Erro ao verificar rollover']);
}
?>
