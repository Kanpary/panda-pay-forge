<?php
require_once '../db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Usuário não logado']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    $stmt = $pdo->prepare("SELECT affiliate_code, comissao, commission_type, cpa_value FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    $stmt = $pdo->prepare("SELECT id, nome_completo, created_at FROM users WHERE referred_by = ?");
    $stmt->execute([$userId]);
    $referrals = $stmt->fetchAll();
    
    $convidados = count($referrals);
    
    $stmt = $pdo->prepare("
        SELECT d.*, u.nome_completo as nome_indicado, u.telefone as telefone_indicado, u.id as indicado_id
        FROM deposits d 
        JOIN users u ON d.user_id = u.id 
        WHERE u.referred_by = ? AND d.status = 'paid'
        ORDER BY d.created_at ASC
    ");
    $stmt->execute([$userId]);
    $deposits = $stmt->fetchAll();
    
    $depositantes = count(array_unique(array_column($deposits, 'user_id')));
    
    $comissaoPercentual = isset($user['comissao']) ? (int)$user['comissao'] : 10;
    $commissionType = $user['commission_type'] ?? 'rev';
    $cpaValue = isset($user['cpa_value']) ? (float)$user['cpa_value'] : 10.00;
    
    $stmt = $pdo->prepare("SELECT SUM(amount) as total FROM affiliate_logs WHERE referrer_id = ? AND type = 'deposit_commission'");
    $stmt->execute([$userId]);
    $logResult = $stmt->fetch();
    $ganhos = $logResult['total'] ? (float)$logResult['total'] : 0;

    $depositosCompletos = [];
    $processedUsers = []; 
    
    foreach ($deposits as $dep) {
        $ganhoEstimado = 0;
        
        // Só calcula ganho se for o primeiro depósito desse usuário (na lista processada)
        if (!in_array($dep['indicado_id'], $processedUsers)) {
             if ($commissionType === 'cpa') {
                 $ganhoEstimado = $cpaValue;
             } else {
                 $ganhoEstimado = $dep['amount'] * ($comissaoPercentual / 100);
             }
             $processedUsers[] = $dep['indicado_id'];
        }
        
        $depositosCompletos[] = [
            'data' => $dep['created_at'],
            'nome_indicado' => $dep['nome_indicado'],
            'telefone_indicado' => $dep['telefone_indicado'],
            'valor' => $dep['amount'],
            'ganho' => $ganhoEstimado,
            'indicado_id' => $dep['indicado_id']
        ];
    }
    
    $depositosCompletos = array_reverse($depositosCompletos);
    
    $link = "http://" . $_SERVER['HTTP_HOST'] . "/?ref=" . $user['affiliate_code'];

    echo json_encode([
        'success' => true,
        'link' => $link,
        'stats' => [
            'convidados' => $convidados,
            'depositantes' => $depositantes,
            'ganhos' => $ganhos
        ],
        'comissao_percentual' => $comissaoPercentual,
        'commission_type' => $commissionType,
        'cpa_value' => $cpaValue,
        'depositos_completos' => $depositosCompletos
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro ao buscar dados de afiliado: ' . $e->getMessage()]);
}
?>
