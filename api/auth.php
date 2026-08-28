<?php
session_start();
require_once '../db.php';

header('Content-Type: application/json');

// Permitir apenas POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit;
}

$action = $_POST['action'] ?? '';

/* =========================
   REGISTER
========================= */
if ($action === 'register') {

    $nome  = trim($_POST['nome_completo'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $cpf   = preg_replace('/\D/', '', $_POST['cpf'] ?? ''); // remove máscara
    $senha = $_POST['senha'] ?? '';
    $refCode = $_POST['ref'] ?? '';

    // Validação básica
    if (empty($nome) || empty($email) || empty($cpf) || empty($senha)) {
        echo json_encode([
            'success' => false,
            'message' => 'Preencha todos os campos.'
        ]);
        exit;
    }

    // ✅ VALIDAÇÃO DE NOME COMPLETO (nome + sobrenome)
    $partesNome = array_filter(explode(' ', $nome));
    if (count($partesNome) < 2) {
        echo json_encode([
            'success' => false,
            'message' => 'Informe seu nome completo (nome e sobrenome).'
        ]);
        exit;
    }

    // CPF deve ter 11 dígitos
    if (strlen($cpf) !== 11) {
        echo json_encode([
            'success' => false,
            'message' => 'CPF inválido.'
        ]);
        exit;
    }

    try {
        // Verifica email ou CPF duplicado
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? OR cpf = ?");
        $stmt->execute([$email, $cpf]);

        if ($stmt->fetch()) {
            echo json_encode([
                'success' => false,
                'message' => 'Email ou CPF já cadastrados.'
            ]);
            exit;
        }

        // Código de indicação
        $referrerId = null;
        if (!empty($refCode)) {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE affiliate_code = ?");
            $stmt->execute([$refCode]);
            $referrer = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($referrer) {
                $referrerId = $referrer['id'];
            }
        }

        // Criptografa senha
        $hash = password_hash($senha, PASSWORD_DEFAULT);
        $affiliateCode = uniqid();

        // Insere usuário
        $stmt = $pdo->prepare("
            INSERT INTO users 
            (nome_completo, email, cpf, senha, affiliate_code, referred_by)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $nome,
            $email,
            $cpf,
            $hash,
            $affiliateCode,
            $referrerId
        ]);

        $userId = $pdo->lastInsertId();

        // Sessão
        $_SESSION['user_id']   = $userId;
        $_SESSION['user_name'] = $nome;

        echo json_encode([
            'success' => true,
            'message' => 'Cadastro realizado com sucesso!',
            'openDeposit' => true
        ]);
        exit;

    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Erro no banco de dados.'
        ]);
        exit;
    }

/* =========================
   LOGIN
========================= */
} elseif ($action === 'login') {

    $email = trim($_POST['email'] ?? '');
    $senha = $_POST['senha'] ?? '';

    if (empty($email) || empty($senha)) {
        echo json_encode([
            'success' => false,
            'message' => 'Preencha todos os campos.'
        ]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($senha, $user['senha'])) {

            $_SESSION['user_id']   = $user['id'];
            $_SESSION['user_name'] = $user['nome_completo'];

            // Atualiza status
            $stmt = $pdo->prepare("
                UPDATE users 
                SET status = 'online', last_seen = NOW() 
                WHERE id = ?
            ");
            $stmt->execute([$user['id']]);

            echo json_encode([
                'success' => true,
                'message' => 'Login realizado com sucesso!'
            ]);
            exit;
        }

        echo json_encode([
            'success' => false,
            'message' => 'Email ou senha incorretos.'
        ]);
        exit;

    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Erro no login.'
        ]);
        exit;
    }

/* =========================
   LOGOUT
========================= */
} elseif ($action === 'logout') {

    session_destroy();

    echo json_encode([
        'success' => true
    ]);
    exit;

} else {
    echo json_encode([
        'success' => false,
        'message' => 'Ação inválida.'
    ]);
    exit;
}
