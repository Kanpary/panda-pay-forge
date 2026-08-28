<?php
// AO INSTALAR EM OUTRO SERVIDOR/BANCO, ALTERE AQUI O NOME DO BANCO, USUÁRIO E SENHA.

$host = 'localhost';
$dbname = 'u311589817_dtxsistemas12';
$username = 'u311589817_dtxsistemas12';
$password = '5p8u9x33P';

try {
    // Configuração do PDO conforme solicitado na auditoria técnica
    $pdo = new PDO(
        "mysql:host={$host};dbname={$dbname};charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    // Teste de conexão (Item 4 do Escopo)
    // Executa uma consulta simples para garantir que o banco de dados está respondendo
    $pdo->query("SELECT 1");

} catch (PDOException $e) {
    // Registra o erro real no log do servidor para análise técnica (Item 2)
    error_log("DB_CONNECTION_ERROR: " . $e->getMessage());

    // Resposta JSON padronizada para o frontend (Item 2)
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode(["error" => "db_connection_failed"]);
    exit;
}
