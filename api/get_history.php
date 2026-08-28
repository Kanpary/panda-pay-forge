<?php
require_once '../db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Usuário não logado']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT bet_amount, win_amount, created_at as data FROM game_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50");
    $stmt->execute([$_SESSION['user_id']]);
    $history = $stmt->fetchAll();
    
    $formattedHistory = [];
    foreach ($history as $item) {
        $netResult = floatval($item['win_amount']) - floatval($item['bet_amount']);
        
        $formattedHistory[] = [
            'valor_aposta' => $item['bet_amount'],
            'resultado' => $netResult,
            'data_jogo_formatada' => date('d/m/Y H:i', strtotime($item['data']))
        ];
    }
    
    echo json_encode(['success' => true, 'history' => $formattedHistory]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro ao buscar histórico: ' . $e->getMessage()]);
}
?>
