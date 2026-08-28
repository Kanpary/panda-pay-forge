<?php
require_once '../db.php';

header('Content-Type: application/json');

if (isset($_GET['action']) && $_GET['action'] === 'update_status') {
    
    if (isset($_SESSION['user_id'])) {
        $userId = $_SESSION['user_id'];
        
        try {
            $stmt = $pdo->prepare("UPDATE users SET status = 'online', last_seen = NOW() WHERE id = :id");
            $stmt->execute(['id' => $userId]);
            
            echo json_encode([
                'success' => true, 
                'message' => 'Status updated successfully'
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false, 
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    } else {
        echo json_encode([
            'success' => true, 
            'message' => 'Visitor tracked (Guest)'
        ]);
    }

} else {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'message' => 'Invalid action provided'
    ]);
}
?>
