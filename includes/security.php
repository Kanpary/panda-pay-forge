<?php

/* ============================================================
 * SISTEMA DE SEGURANÇA - Quebra Porquinho
 * - Sessões seguras (httponly, samesite, regenerate)
 * - CSRF Token
 * - Rate Limiting (file-based)
 * ============================================================ */

function secureSessionInit() {
    if (session_status() === PHP_SESSION_NONE) {
        // Cookie seguro (apenas HTTPS, bloqueado JS)
        ini_set('session.cookie_httponly', 1);

        // Cookie_secure só habilita se HTTPS (senão trava em localhost HTTP)
        if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
            ini_set('session.cookie_secure', 1);
        }

        ini_set('session.use_strict_mode', 1);
        ini_set('session.cookie_samesite', 'Lax');

        session_start();
    }
}

function csrfToken() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrfCheck() {
    $token = $_POST['csrf_token'] ?? $_GET['csrf_token'] ?? '';
    if (empty($_SESSION['csrf_token']) || empty($token) || !hash_equals($_SESSION['csrf_token'], $token)) {
        http_response_code(403);
        return false;
    }
    return true;
}

/* ============================================================
 * RATE LIMITING (baseado em arquivo)
 * ============================================================ */

function getRateLimitKey($identifier) {
    $cacheDir = __DIR__ . '/../cache/';
    if (!is_dir($cacheDir)) {
        mkdir($cacheDir, 0755, true);
        // Protege o diretório cache com .htaccess
        file_put_contents($cacheDir . '.htaccess', 'Deny from all');
    }
    return $cacheDir . 'rl_' . md5($identifier) . '.txt';
}

// APENAS CHECA se está bloqueado (não adiciona tentativa)
function rateLimitCheck($identifier, $max_attempts, $time_window) {
    $keyFile = getRateLimitKey($identifier);
    $now = time();

    if (file_exists($keyFile)) {
        $data = json_decode(file_get_contents($keyFile), true);
        if ($data && is_array($data)) {
            // Remove tentativas expiradas
            $data = array_filter($data, function($timestamp) use ($now, $time_window) {
                return ($now - $timestamp) < $time_window;
            });
            
            // Salva o arquivo apenas com os tempos válidos
            file_put_contents($keyFile, json_encode(array_values($data)), LOCK_EX);

            if (count($data) >= $max_attempts) {
                return true; // BLOQUEADO
            }
        }
    }
    return false; // PERMITIDO
}

// ADICIONA uma nova tentativa falha
function rateLimitInc($identifier) {
    $keyFile = getRateLimitKey($identifier);
    $now = time();
    $data = [];
    
    if (file_exists($keyFile)) {
        $data = json_decode(file_get_contents($keyFile), true);
        if (!is_array($data)) $data = [];
    }
    
    $data[] = $now;
    file_put_contents($keyFile, json_encode(array_values($data)), LOCK_EX);
}

// ZERA as tentativas (após login com sucesso)
function rateLimitReset($identifier) {
    $keyFile = getRateLimitKey($identifier);
    if (file_exists($keyFile)) {
        unlink($keyFile); // Deleta o arquivo de limite
    }
}

function rateLimitResponse($retry_after = 60) {
    http_response_code(429);
    header("Retry-After: $retry_after");
}

/* ============================================================
 * HELPER DE LOG
 * ============================================================ */

function logSecurity($event, $data = '') {
    $logFile = __DIR__ . '/../logs/security.log';
    $logDir = dirname($logFile);
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    $line = date('Y-m-d H:i:s') . " | " . $event . " | " . $data . " | IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . PHP_EOL;
    file_put_contents($logFile, $line, FILE_APPEND);
}