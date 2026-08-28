<?php
require_once __DIR__ . '/security.php';
secureSessionInit();

// Busca o config na raiz
require_once __DIR__ . '/../conn.php';

if (!isset($_SESSION['admin_id'])) {
    header('Location: /admin/login.php');
    exit;
}

global $pdo;
global $conn;