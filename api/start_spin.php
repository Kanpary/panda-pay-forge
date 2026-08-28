<?php
require_once '../db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Usuário não logado']);
    exit;
}

$userId = $_SESSION['user_id'];
$aposta = floatval($_POST['aposta'] ?? 0);

if ($aposta <= 0) {
    echo json_encode(['success' => false, 'message' => 'Valor de aposta inválido']);
    exit;
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("SELECT saldo, is_influencer FROM users WHERE id = ? FOR UPDATE");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if ($user['saldo'] < $aposta) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Saldo insuficiente.']);
        exit;
    }

    $newBalance = $user['saldo'] - $aposta;
    $stmt = $pdo->prepare("UPDATE users SET saldo = ? WHERE id = ?");
    $stmt->execute([$newBalance, $userId]);

    // Determine which tables to use based on influencer status
    $isInfluencer = isset($user['is_influencer']) && $user['is_influencer'] == 1;
    $tableProb = $isInfluencer ? 'probabilidade_influencer' : 'probabilidade';
    $tableMult = $isInfluencer ? 'multiplicadores_influencer' : 'multiplicadores';

    $stmt = $pdo->query("SELECT * FROM $tableProb ORDER BY id ASC");
    $probs1 = $stmt->fetchAll();
    
    if (empty($probs1)) {
        $probs1 = [
            ['valor' => 0, 'chance' => 40],
            ['valor' => 2, 'chance' => 30],
            ['valor' => 5, 'chance' => 15],
            ['valor' => 10, 'chance' => 8],
            ['valor' => 15, 'chance' => 4],
            ['valor' => 20, 'chance' => 2],
            ['valor' => 50, 'chance' => 0.9],
            ['valor' => 100, 'chance' => 0.1]
        ];
    }

    $stmt = $pdo->query("SELECT * FROM multiplicadores ORDER BY id ASC");
    $probs2 = $stmt->fetchAll();

    if (empty($probs2)) {
        $probs2 = [
            ['valor' => 1, 'chance' => 50],
            ['valor' => 2, 'chance' => 30],
            ['valor' => 3, 'chance' => 15],
            ['valor' => 4, 'chance' => 5]
        ];
    }

    function getWeightedRandomIndex($items) {
        $totalWeight = 0;
        foreach ($items as $item) {
            $totalWeight += floatval($item['chance']);
        }
        
        $rand = (float)rand() / (float)getrandmax() * $totalWeight;
        $currentWeight = 0;
        
        foreach ($items as $index => $item) {
            $currentWeight += floatval($item['chance']);
            if ($rand <= $currentWeight) {
                return $index;
            }
        }
        return count($items) - 1;
    }

    $visualMap1 = [0, 5, 15, 2, 20, 100, 10, 50];
    
    $visualMap2 = [2, 3, 4, 1];

    $idx1_prob = getWeightedRandomIndex($probs1);
    
    $probsMap1 = array_column($probs1, 'valor');
    $val1 = $probsMap1[$idx1_prob]; 
    
    $idx1 = array_search($val1, $visualMap1);
    if ($idx1 === false) {
        $idx1 = 0; 
        $val1 = $visualMap1[0];
    }

    $idx2_prob = getWeightedRandomIndex($probs2);
    $probsMap2 = array_column($probs2, 'valor');
    $val2 = $probsMap2[$idx2_prob]; 
    
    $idx2 = array_search($val2, $visualMap2);
    if ($idx2 === false) {
        $idx2 = 0;
        $val2 = $visualMap2[0];
    }
    
    $map1 = $visualMap1;
    $map2 = $visualMap2;
    
    $totalMult = $val1 * $val2;
    $winAmount = $aposta * $totalMult;
    $finalBalance = $newBalance + $winAmount;
    
    if ($winAmount > 0) {
        $stmt = $pdo->prepare("UPDATE users SET saldo = ? WHERE id = ?");
        $stmt->execute([$finalBalance, $userId]);
    } else {
        $finalBalance = $newBalance;
    }
    
    $resultStr = $winAmount > 0 ? 'win' : 'loss';
    $stmt = $pdo->prepare("INSERT INTO game_history (user_id, bet_amount, win_amount, result) VALUES (?, ?, ?, ?)");
    $stmt->execute([$userId, $aposta, $winAmount, $resultStr]);
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'newBalance' => $finalBalance,
        'roleta1Map' => $map1,
        'roleta2Map' => $map2,
        'posicao1' => $idx1,
        'posicao2' => $idx2,
        'multiplicador1' => $val1,
        'multiplicador2' => $val2
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Erro no jogo: ' . $e->getMessage()]);
}
?>
