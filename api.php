<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, ci, cs");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ==========================================
// CONEXAO COM O BANCO DE DADOS
// ==========================================
require_once 'conn.php';

// ==========================================
// HELPERS GLOBAIS
// ==========================================
function jsonResponse($success, $data, $status = 200) {
    http_response_code($status);
    $response = ['success' => $success];
    if ($success) $response['data'] = $data;
    else $response['error'] = $data;
    echo json_encode($response);
    exit();
}

function requireAuth() {
    if (!isset($_SESSION['user_id'])) jsonResponse(false, 'Não autenticado. Faça login novamente.', 401);
    return $_SESSION['user_id'];
}

function normalizeAffiliateCommissionMode($mode) {
    $mode = (string)$mode;
    return in_array($mode, ['first_deposit_only', 'all_deposits'], true) ? $mode : 'first_deposit_only';
}

function getAffiliateCommissionModeFromRow($row) {
    return normalizeAffiliateCommissionMode($row['description'] ?? '');
}

function getGlobalSettings($pdo) {
    static $settings = null;
    if ($settings === null) {
        $stmt = $pdo->query("SELECT slug, value, description FROM game_settings");
        $settings = [];
        while ($row = $stmt->fetch()) {
            $slug = $row['slug'];
            $val = $row['value'];
            $desc = $row['description'];

            if ($slug === 'affiliate_commission_mode') {
                $settings[$slug] = normalizeAffiliateCommissionMode($desc);
            } else {
                // Se value for 0 ou vazio, tenta usar description (que pode conter strings como tokens)
                if ($val != 0 && $val !== null && $val !== '') {
                    $settings[$slug] = $val;
                } else {
                    $settings[$slug] = $desc;
                }
            }
            $settings[$slug.'_raw'] = (float)($val ?: (is_numeric($desc) ? $desc : 0));
        }
    }
    return $settings;
}

function getGiftValuesForAccount($settings, $suffix) {
    $legacyMax = (float)($settings['bonus_max_'.$suffix] ?? 0);
    $fallback = $legacyMax > 0 ? $legacyMax : 1.0;
    $values = [];

    for ($i = 1; $i <= 4; $i++) {
        $key = 'gift_value_'.$suffix.'_'.$i;
        $value = isset($settings[$key]) ? (float)$settings[$key] : $fallback;
        $values[] = $value > 0 ? $value : $fallback;
    }

    return $values;
}

function getFlowerValuesForAccount($settings, $suffix) {
    $fallback = $suffix === 'demo' ? 50.0 : 1.0;
    $values = [];

    for ($i = 1; $i <= 4; $i++) {
        $key = 'flower_value_'.$suffix.'_'.$i;
        if (isset($settings[$key])) {
            $value = (float)$settings[$key];
        } else {
            // Fallback para min/max se não existir o novo campo
            if ($suffix === 'demo') {
                $value = getNumericSetting($settings, 'flower_value_min_demo', getNumericSetting($settings, 'flower_value_demo', 50.00));
            } else {
                $value = getNumericSetting($settings, 'flower_value_min', getNumericSetting($settings, 'flower_value_real', 1.00));
            }
        }
        $values[] = $value > 0 ? $value : $fallback;
    }

    return $values;
}


function getBranchValuesForAccount($settings, $suffix) {
    $fallback = $suffix === 'demo' ? 0.0 : 0.0;
    $values = [];

    for ($i = 1; $i <= 4; $i++) {
        $key = 'branch_value_'.$suffix.'_'.$i;
        $value = isset($settings[$key]) ? (float)$settings[$key] : $fallback;
        $values[] = $value;
    }


    return $values;
}

function getAffiliateCommissionMode($settings) {
    return normalizeAffiliateCommissionMode($settings['affiliate_commission_mode'] ?? 'first_deposit_only');
}

function getDefaultAffiliateCpaPercent($settings, $level) {
    $key = $level === 2 ? 'cpa_percent_lvl2' : 'cpa_percent_lvl1';
    $fallback = $level === 2 ? 20.00 : 60.00;

    if (!isset($settings[$key]) || $settings[$key] === '') {
        return $fallback;
    }

    return (float)$settings[$key];
}

function requireAdmin() {
    if (!isset($_SESSION['admin_id']) || (int)$_SESSION['admin_id'] <= 0) {
        jsonResponse(false, 'Acesso administrativo requerido.', 403);
    }
    return (int)$_SESSION['admin_id'];
}

function getNumericSetting($settings, $slug, $default = 0.0) {
    if (array_key_exists($slug.'_raw', $settings)) {
        if (isset($settings[$slug]) && is_numeric((string)$settings[$slug])) {
            return (float)$settings[$slug];
        }
        return (float)$settings[$slug.'_raw'];
    }

    if (isset($settings[$slug]) && is_numeric((string)$settings[$slug])) {
        return (float)$settings[$slug];
    }

    return (float)$default;
}

function getAffiliateSkipCount($settings) {
    $skip = (int)round(getNumericSetting($settings, 'pular_cpa', 0));
    if ($skip < 0) $skip = 0;
    if ($skip > 10) $skip = 10;
    return $skip;
}

function getAffiliateCommissionConfig($settings) {
    return [
        'mode' => getAffiliateCommissionMode($settings),
        'skip_count' => getAffiliateSkipCount($settings),
        'min_deposit' => getNumericSetting($settings, 'min_deposito_cpa', 10.00)
    ];
}

function getAccountScopedValue($settings, $baseSlug, $suffix, $default = 0.0) {
    return getNumericSetting($settings, $baseSlug.'_'.$suffix, $default);
}

function getFlowerRangeForAccount($settings, $suffix) {
    if ($suffix === 'demo') {
        $min = getNumericSetting($settings, 'flower_value_min_demo', getNumericSetting($settings, 'flower_value_demo', 50.00));
        $max = getNumericSetting($settings, 'flower_value_max_demo', getNumericSetting($settings, 'flower_value_demo', $min));
    } else {
        $min = getNumericSetting($settings, 'flower_value_min', getNumericSetting($settings, 'flower_value_real', 1.00));
        $max = getNumericSetting($settings, 'flower_value_max', getNumericSetting($settings, 'flower_value_real', $min));
    }

    if ($max < $min) {
        $tmp = $min;
        $min = $max;
        $max = $tmp;
    }

    return [
        'min' => round((float)$min, 2),
        'max' => round((float)$max, 2)
    ];
}

function getAffiliatePeriodRange($period) {
    $today = new DateTimeImmutable('today');

    if ($period === 'today') {
        return ['start' => $today, 'end' => $today->modify('+1 day')];
    }

    if ($period === 'yesterday') {
        return ['start' => $today->modify('-1 day'), 'end' => $today];
    }

    if ($period === 'this_week') {
        $start = $today->modify('-' . ((int)$today->format('N') - 1) . ' day');
        return ['start' => $start, 'end' => $start->modify('+7 day')];
    }

    if ($period === 'last_week') {
        $thisWeek = $today->modify('-' . ((int)$today->format('N') - 1) . ' day');
        return ['start' => $thisWeek->modify('-7 day'), 'end' => $thisWeek];
    }

    return null;
}

function dateMatchesRange($createdAt, $range) {
    if ($range === null || !$createdAt) return true;
    try {
        $dt = new DateTimeImmutable((string)$createdAt);
    } catch (Throwable $e) {
        return false;
    }
    return $dt >= $range['start'] && $dt < $range['end'];
}

function buildCommissionEligibilityMap($depositRows, $config) {
    $map = [];
    $sequence = 0;
    $mode = $config['mode'] ?? 'first_deposit_only';
    $skipCount = (int)($config['skip_count'] ?? 0);
    $minDeposit = (float)($config['min_deposit'] ?? 10.00);

    foreach ($depositRows as $dep) {
        $depositId = (int)($dep['id'] ?? 0);
        $status = strtolower((string)($dep['status'] ?? ''));
        $amount = round((float)($dep['amount'] ?? 0), 2);
        $entry = [
            'qualifies' => false,
            'sequence_index' => null,
            'reason' => 'not_completed',
            'amount' => $amount
        ];

        if (!in_array($status, ['completed', 'paid'], true)) {
            $entry['reason'] = in_array($status, ['pending', 'processing'], true) ? 'processing' : 'not_completed';
            $map[$depositId] = $entry;
            continue;
        }

        if ($amount < $minDeposit) {
            $entry['reason'] = 'below_min';
            $map[$depositId] = $entry;
            continue;
        }

        $sequence++;
        $entry['sequence_index'] = $sequence;

        if ($mode === 'first_deposit_only' && $sequence > 1) {
            $entry['reason'] = 'mode_blocked';
            $map[$depositId] = $entry;
            continue;
        }

        if ($mode === 'all_deposits' && $skipCount > 0) {
            $cyclePos = ($sequence - 1) % ($skipCount + 1);
            if ($cyclePos >= $skipCount) {
                $entry['reason'] = 'skip_blocked';
                $map[$depositId] = $entry;
                continue;
            }
        }

        $entry['qualifies'] = true;
        $entry['reason'] = 'confirmed';
        $map[$depositId] = $entry;
    }

    return $map;
}

function getAffiliateLeadReasonLabel($reason) {
    if ($reason === 'skip_blocked') return 'Depósito ignorado pelo pular CPA.';
    if ($reason === 'mode_blocked') return 'Depósito ignorado pelo modo apenas primeiro depósito.';
    if ($reason === 'below_min') return 'Depósito abaixo do mínimo para CPA.';
    if ($reason === 'processing') return 'Depósito aguardando confirmação.';
    return '';
}

function getAffiliateLeadRecords($pdo, $affiliateUserId, $settings) {
    // Regra: Indicados = todos com CPF preenchido
    $stmt = $pdo->prepare("SELECT id, nome, telefone, cpf, created_at FROM users WHERE referred_by = ? AND is_demo = 0 AND (cpf IS NOT NULL AND cpf != '') ORDER BY created_at DESC, id DESC");
    $stmt->execute([$affiliateUserId]);
    $leads = $stmt->fetchAll();

    if (!$leads) {
        return [];
    }

    $leadIds = array_map(function($lead) {
        return (int)$lead['id'];
    }, $leads);

    $placeholders = implode(',', array_fill(0, count($leadIds), '?'));

    $stmtDeposits = $pdo->prepare("SELECT id, user_id, amount, status, created_at, transaction_id FROM deposits WHERE user_id IN ($placeholders) ORDER BY user_id ASC, id ASC");
    $stmtDeposits->execute($leadIds);
    $depositRows = $stmtDeposits->fetchAll();

    $stmtCommissions = $pdo->prepare("SELECT referred_user_id, commission_amount, status, created_at FROM affiliate_commissions WHERE affiliate_user_id = ? AND referred_user_id IN ($placeholders) ORDER BY created_at DESC, id DESC");
    $stmtCommissions->execute(array_merge([$affiliateUserId], $leadIds));
    $commissionRows = $stmtCommissions->fetchAll();

    $depositsByUser = [];
    foreach ($depositRows as $row) {
        $uid = (int)$row['user_id'];
        if (!isset($depositsByUser[$uid])) $depositsByUser[$uid] = [];
        $depositsByUser[$uid][] = $row;
    }

    $commissionsByUser = [];
    foreach ($commissionRows as $row) {
        $uid = (int)$row['referred_user_id'];
        if (!isset($commissionsByUser[$uid])) $commissionsByUser[$uid] = [];
        $commissionsByUser[$uid][] = $row;
    }

    $config = getAffiliateCommissionConfig($settings);
    $records = [];

    foreach ($leads as $lead) {
        $leadId = (int)$lead['id'];
        $rows = $depositsByUser[$leadId] ?? [];
        $eligibility = buildCommissionEligibilityMap($rows, $config);

        $hasAnyDeposit = !empty($rows);
        $hasPendingDeposit = false;
        $pendingDepositCount = 0;
        $confirmedCount = 0;
        $confirmedTotal = 0.0;
        $firstConfirmedAmount = 0.0;
        $firstConfirmedAt = null;
        $latestDepositStatus = '';
        $latestReason = '';
        $lastActivityAt = $lead['created_at'];

        foreach ($rows as $dep) {
            $status = strtolower((string)($dep['status'] ?? ''));
            $lastActivityAt = $dep['created_at'] ?? $lastActivityAt;
            $latestDepositStatus = $status;

            if (in_array($status, ['pending', 'processing'], true)) {
                $hasPendingDeposit = true;
                $pendingDepositCount++;
            }

            $eval = $eligibility[(int)$dep['id']] ?? null;
            if (!$eval) {
                continue;
            }

            if ($eval['qualifies']) {
                $confirmedCount++;
                $confirmedTotal += (float)$dep['amount'];
                if ($firstConfirmedAt === null) {
                    $firstConfirmedAt = $dep['created_at'];
                    $firstConfirmedAmount = (float)$dep['amount'];
                }
            } elseif (in_array($status, ['completed', 'paid'], true) && $latestReason === '') {
                $latestReason = $eval['reason'];
            }
        }

        if ($confirmedCount > 0) {
            $statusKey = 'confirmed';
            $statusLabel = 'Confirmado';
        } elseif ($hasPendingDeposit) {
            $statusKey = 'processing';
            $statusLabel = 'Em processamento';
        } elseif ($hasAnyDeposit) {
            $statusKey = 'awaiting_deposit';
            $statusLabel = 'Aguardando depósito';
        } else {
            $statusKey = 'without_deposit';
            $statusLabel = 'Sem depósito';
        }

        $commissionTotal = 0.0;
        $commissionCount = 0;
        foreach (($commissionsByUser[$leadId] ?? []) as $commission) {
            if (!in_array((string)$commission['status'], ['pending', 'paid'], true)) {
                continue;
            }
            $commissionTotal += (float)$commission['commission_amount'];
            $commissionCount++;
        }

        $records[] = [
            'user_id' => $leadId,
            'nome' => $lead['nome'],
            'telefone' => $lead['telefone'],
            'created_at' => $lead['created_at'],
            'status_key' => $statusKey,
            'status_label' => $statusLabel,
            'status_reason' => getAffiliateLeadReasonLabel($latestReason),
            'has_confirmed_deposit' => $confirmedCount > 0,
            'pending_deposit_count' => $pendingDepositCount,
            'confirmed_deposit_count' => $confirmedCount,
            'confirmed_deposit_total' => round($confirmedTotal, 2),
            'first_confirmed_amount' => round($firstConfirmedAmount, 2),
            'first_confirmed_at' => $firstConfirmedAt,
            'latest_deposit_status' => $latestDepositStatus,
            'commission_total' => round($commissionTotal, 2),
            'commission_count' => $commissionCount,
            'last_activity_at' => $lastActivityAt
        ];
    }

    return $records;
}

function verifyCSRF() {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (empty($token) && function_exists('getallheaders')) {
        $headers = getallheaders();
        $token = $headers['X-CSRF-Token'] ?? $headers['x-csrf-token'] ?? '';
    }
    if (!isset($_SESSION['csrf_token']) || $token !== $_SESSION['csrf_token']) {
        jsonResponse(false, 'Sessão expirada ou inválida. Atualize a página.', 403);
    }
}

function getPublicBaseUrl() {
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $isHttps = false;

    if (!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off') {
        $isHttps = true;
    }

    $xfp = $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '';
    if (!$isHttps && strtolower((string)$xfp) === 'https') {
        $isHttps = true;
    }

    if (!$isHttps && stripos($host, 'localhost') === false && stripos($host, '127.0.0.1') === false) {
        $isHttps = true;
    }

    return ($isHttps ? 'https' : 'http') . '://' . $host;
}

// ==========================================
// TRATAMENTO DA ROTA E REQUEST
// ==========================================
$route = trim(explode('?', $_GET['route'] ?? '')[0], '/ ');
$method = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true) ?? [];

// Proteção CSRF
if (in_array($method, ['POST', 'PUT', 'DELETE']) && $route !== 'csrf' && strpos($route, 'webhook') === false) {
    verifyCSRF();
}

// ==========================================
// 1. ROTAS ESPECIAIS COM REGEX (Histórico)
// ==========================================
if (preg_match('/^history\/(deposits|withdrawals|games)/', $route)) {
    $user_id = requireAuth();
    $type = explode('/', $route)[1];
    $table = ($type === 'games') ? 'game_history' : $type;
    $stmt = $pdo->prepare("SELECT * FROM $table WHERE user_id = ? ORDER BY id DESC LIMIT 20");
    $stmt->execute([$user_id]);
    jsonResponse(true, ['data' => $stmt->fetchAll()]);
}

// ==========================================
// 2. ROTEAMENTO PADRAO (Switch)
// ==========================================
switch ($route) {

    case 'csrf':
        if (!isset($_SESSION['csrf_token'])) $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        jsonResponse(true, ['token' => $_SESSION['csrf_token']]);
        break;

    // --- AUTENTICACAO ---
    case 'auth/login':
        $telefone = preg_replace('/\D/', '', $body['email'] ?? '');
        $senha = $body['senha'] ?? '';
        $stmt = $pdo->prepare("SELECT * FROM users WHERE telefone = ?");
        $stmt->execute([$telefone]);
        $user = $stmt->fetch();
        if ($user && password_verify($senha, $user['senha'])) {
            if ($user['banido'] == 1) jsonResponse(false, 'Conta bloqueada pelo administrador.', 403);
            $_SESSION['user_id'] = $user['id'];
            jsonResponse(true, ['balance' => (float)$user['balance']]);
        }
        jsonResponse(false, 'Telefone ou senha inválidos.', 401);
        break;

    case 'auth/register':
        $telefone = preg_replace('/\D/', '', $body['telefone'] ?? '');
        
        // Passo 1: Validar telefone
        if (strlen($telefone) < 10) {
            jsonResponse(false, 'Telefone inválido.', 400);
        }

        // Consulta prévia para evitar duplicidade
        try {
            $stmtCheck = $pdo->prepare("SELECT id FROM users WHERE telefone = ?");
            $stmtCheck->execute([$telefone]);
            if ($stmtCheck->fetch()) {
                jsonResponse(false, 'Este telefone já está cadastrado.', 400);
            }

            $senha = password_hash($body['senha'] ?? '', PASSWORD_DEFAULT);
            $nome = $body['nome_completo'] ?? 'Jogador';
            $cpf = preg_replace('/\D/', '', $body['cpf'] ?? '');
            $affiliate_code = bin2hex(random_bytes(4));
            $ref_code = $body['affiliate_code'] ?? null;
            $referred_by = null;
            
            $tipo_conta = 'JOGADOR';
            $comissao_cpa = 10.00; // Padrão 10%
            $comissao_cpa_nivel2 = 10.00; // Padrão 10%

            if ($ref_code) {
                $stmt = $pdo->prepare("SELECT id FROM users WHERE affiliate_code = ?");
                $stmt->execute([$ref_code]);
                $parent = $stmt->fetch();
                
                if ($parent) {
                    $referred_by = $parent['id'];
                }
            }

            $stmt = $pdo->prepare("INSERT INTO users (nome, telefone, cpf, senha, affiliate_code, referred_by, tipo_conta, comissao_cpa, comissao_cpa_nivel2, balance, rollover_atual, rollover_meta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, 0.00, 0.00)");
            $stmt->execute([$nome, $telefone, $cpf, $senha, $affiliate_code, $referred_by, $tipo_conta, $comissao_cpa, $comissao_cpa_nivel2]);
            $_SESSION['user_id'] = $pdo->lastInsertId();
            jsonResponse(true, ['balance' => 0.00]);

        } catch (PDOException $e) {
            error_log('REGISTER_DB_ERROR: ' . $e->getMessage());
            
            if ($e->getCode() === '23000') {
                jsonResponse(false, 'Este telefone ou código de afiliado já está em uso.', 400);
            }
            
            // Retorno padronizado para falhas de banco de dados
            http_response_code(500);
            echo json_encode(["error" => "db_connection_failed", "details" => "Erro na operação de banco de dados durante o cadastro."]);
            exit;
        }
        break;

    case 'auth/logout':
        session_destroy();
        jsonResponse(true, 'Deslogado com sucesso');
        break;

    // --- AFILIADOS (ADMIN) ---
    case 'admin/affiliate/leads':
        requireAdmin();
        $aff_id = (int)($_GET['affiliate_id'] ?? ($body['affiliate_id'] ?? 0));
        if (!$aff_id) jsonResponse(false, 'ID do afiliado não informado.', 400);

        $settings = getGlobalSettings($pdo);
        $leadRecords = getAffiliateLeadRecords($pdo, $aff_id, $settings);
        jsonResponse(true, [
            'commission_mode' => getAffiliateCommissionMode($settings),
            'skip_cpa' => getAffiliateSkipCount($settings),
            'lead_records' => $leadRecords
        ]);
        break;

    case 'admin/deposit/approve':
        requireAdmin();
        $txId = (string)($body['transaction_id'] ?? '');
        if (!$txId) jsonResponse(false, 'ID da transação não informado.', 400);
        
        // A função processarPagamento já faz todas as verificações de CPA e Rollover
        if (!processarPagamento($pdo, $txId)) {
            jsonResponse(false, 'NÃ£o foi possÃ­vel aprovar o depÃ³sito. Verifique se ele ainda estÃ¡ pendente.', 400);
        }
        
        jsonResponse(true, ['message' => 'Depósito aprovado e comissões processadas!']);
        break;

    // --- JOGO E BANCAS ---
    case 'user/balance':
        $user_id = requireAuth();
        $stmt = $pdo->prepare("SELECT balance, id as user_id FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        jsonResponse(true, $stmt->fetch());
        break;

    case 'game/panda-config':
        $user_id = requireAuth();
        $stmtUser = $pdo->prepare("SELECT is_demo, rtp, rollover_meta, rollover_atual, is_influencer, panda_win_boost, tipo_conta FROM users WHERE id = ?");
        $stmtUser->execute([$user_id]);
        $u = $stmtUser->fetch();
        $settings = getGlobalSettings($pdo);
        $suffix = $u['is_demo'] ? 'demo' : 'real';
        $giftValues = getGiftValuesForAccount($settings, $suffix);
        $flowerRange = getFlowerRangeForAccount($settings, $suffix);
        $flowerValues = getFlowerValuesForAccount($settings, $suffix);

        $branchValues = getBranchValuesForAccount($settings, $suffix);
        $leafValue = getNumericSetting($settings, 'leaf_value_'.$suffix, 0.0);

        jsonResponse(true, [
            'rtp' => (isset($u['rtp']) && (int)$u['rtp'] > 0) ? (int)$u['rtp'] : (int)getNumericSetting($settings, 'rtp_'.$suffix, ($suffix === 'demo' ? 80 : 40)),
            'flower_values' => $flowerValues,
            'gift_values' => $giftValues,
            'leaf_value' => $leafValue,
            'difficulty_increment' => getNumericSetting($settings, 'difficulty_increment_'.$suffix, getNumericSetting($settings, 'difficulty_increment', 2.0)),
            'is_demo' => (bool)$u['is_demo'],
            'is_affiliate' => in_array(($u['tipo_conta'] ?? 'JOGADOR'), ['AFILIADO', 'DEMO']),
            'is_influencer' => false,
            'panda_win_boost' => 0,
            'branch_values' => $branchValues,

            'rollover_info' => [
                'meta' => (float)$u['rollover_meta'],
                'atual' => (float)$u['rollover_atual']
            ]
        ]);
        break;

    case 'game/panda-bet':
        $user_id = requireAuth();
        $amount = (float)($body['amount'] ?? 0);

        if ($amount <= 0) {
            jsonResponse(false, 'Valor de aposta inválido.', 400);
        }

        $pdo->beginTransaction();
        $stmt = $pdo->prepare("SELECT balance, is_demo FROM users WHERE id = ? FOR UPDATE");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch();
        $balance = (float)($user['balance'] ?? 0);

        if ($balance < $amount) {
            $pdo->rollBack();
            jsonResponse(false, 'Saldo insuficiente.', 400);
        }

        $new_balance = $balance - $amount;
        $pdo->prepare("UPDATE users SET balance = ? WHERE id = ?")->execute([$new_balance, $user_id]);

        // Calcula max_win_amount (ex: 50x a aposta ou valor fixo alto para demo)
        $max_multiplier = $user['is_demo'] ? 500 : 50;
        $max_win_amount = $amount * $max_multiplier;

        $stmtSession = $pdo->prepare("INSERT INTO game_sessions (user_id, bet_amount, max_win_amount, status) VALUES (?, ?, ?, 'active')");
        $stmtSession->execute([$user_id, $amount, $max_win_amount]);
        $game_session_id = $pdo->lastInsertId();

        $pdo->commit();

        jsonResponse(true, [
            'balance' => $new_balance,
            'game_session_id' => $game_session_id
        ]);
        break;

    case 'game/panda-result':
        $user_id = requireAuth();
        $game_session_id = (int)($body['game_session_id'] ?? 0);
        $win_amount = (float)($body['win_amount'] ?? 0);
        $loss_after_meta = $body['loss_after_meta'] ?? false;
        $loss_credited_amount = (float)($body['loss_credited_amount'] ?? 0);

        if ($game_session_id <= 0) {
            jsonResponse(false, 'ID de sessão do jogo obrigatório.', 400);
        }

        $pdo->beginTransaction();

        // 1. Validar sessão e 3. Bloquear replay
        $stmtSess = $pdo->prepare("SELECT * FROM game_sessions WHERE id = ? AND user_id = ? FOR UPDATE");
        $stmtSess->execute([$game_session_id, $user_id]);
        $session = $stmtSess->fetch();

        if (!$session) {
            $pdo->rollBack();
            jsonResponse(false, 'Sessão de jogo não encontrada.', 403);
        }
        
        if ($session['status'] !== 'active') {
            $pdo->rollBack();
            jsonResponse(false, 'Sessão de jogo inválida ou já finalizada.', 403);
        }

        $bet_amount = (float)$session['bet_amount'];
        
        // 6. Segurança extra
        if ($bet_amount <= 0) {
            $pdo->rollBack();
            jsonResponse(false, 'Aposta inválida na sessão.', 400);
        }
        if ($win_amount < 0) $win_amount = 0;

        // 4. Validar tempo mínimo (2 segundos)
        $created_at = strtotime($session['created_at']);
        $now = time();
        if (($now - $created_at) < 2) {
            $win_amount = 0;
        }

        // Busca dados do usuário para Rule 2
        $uStmt = $pdo->prepare("SELECT balance, is_demo, rollover_atual FROM users WHERE id = ? FOR UPDATE");
        $uStmt->execute([$user_id]);
        $userData = $uStmt->fetch();

        // 2. Validar valor máximo
        $max_multiplier = $userData['is_demo'] ? 500 : 50;
        $max_win = $bet_amount * $max_multiplier;
        
        if ($win_amount > $max_win) {
            $win_amount = $max_win;
        }

        // Rollover apenas para conta real
        if (!$userData['is_demo']) {
            $pdo->prepare("UPDATE users SET rollover_atual = COALESCE(rollover_atual, 0) + ? WHERE id = ?")
                ->execute([$bet_amount, $user_id]);
        }

        $final_win = $win_amount;
        if ($loss_after_meta) {
            $final_win = max(0, $win_amount - $loss_credited_amount);
        }

        $new_balance = (float)$userData['balance'] + $final_win;

        $pdo->prepare("UPDATE users SET balance = ? WHERE id = ?")
            ->execute([max(0, $new_balance), $user_id]);

        // 5. Finalizar sessão
        $pdo->prepare("UPDATE game_sessions SET status = 'finished', win_amount = ?, finished_at = NOW() WHERE id = ?")
            ->execute([$final_win, $game_session_id]);

        $pdo->prepare("INSERT INTO game_history (user_id, bet_amount, win_amount) VALUES (?, ?, ?)")
            ->execute([$user_id, $bet_amount, $final_win]);

        $pdo->commit();
        jsonResponse(true, ['balance' => $new_balance]);
        break;

    // --- DEPOSITOS E CARDS ---
    case 'deposit/cards':
        $settings = getGlobalSettings($pdo);
        $ativo = (int)($settings['bonus_deposito_ativo_raw'] ?? 1);

        $cards = [
            [
                'amount' => (float)($settings['card1_valor_raw'] ?? 19.90),
                'bonus_percent' => 0,
                'bonus_fixed' => $ativo ? (float)($settings['card1_bonus_raw'] ?? 10.00) : 0
            ],
            [
                'amount' => (float)($settings['card2_valor_raw'] ?? 25.00),
                'bonus_percent' => 0,
                'bonus_fixed' => $ativo ? (float)($settings['card2_bonus_raw'] ?? 20.00) : 0
            ],
            [
                'amount' => (float)($settings['card3_valor_raw'] ?? 30.00),
                'bonus_percent' => 0,
                'bonus_fixed' => $ativo ? (float)($settings['card3_bonus_raw'] ?? 30.00) : 0
            ]
        ];

        jsonResponse(true, ['cards' => $cards]);
        break;

    case 'deposit/config':
        $settings = getGlobalSettings($pdo);
        jsonResponse(true, [
            'min_deposit' => (float)($settings['min_deposito'] ?? 10.00),
            'max_deposit' => (float)($settings['max_deposito'] ?? 10000.00)
        ]);
        break;

    // --- DEPOSITOS E INTEGRACAO EXCLUSIVA ONIXPAY ---
    case 'deposit/cards':
        $settings = getGlobalSettings($pdo);
        $ativo = (int)($settings['bonus_deposito_ativo_raw'] ?? 1);
        $cards = [
            ['amount' => (float)($settings['card1_valor_raw'] ?? 19.90), 'bonus_percent' => 0, 'bonus_fixed' => $ativo ? (float)($settings['card1_bonus_raw'] ?? 10.00) : 0],
            ['amount' => (float)($settings['card2_valor_raw'] ?? 25.00), 'bonus_percent' => 0, 'bonus_fixed' => $ativo ? (float)($settings['card2_bonus_raw'] ?? 20.00) : 0],
            ['amount' => (float)($settings['card3_valor_raw'] ?? 30.00), 'bonus_percent' => 0, 'bonus_fixed' => $ativo ? (float)($settings['card3_bonus_raw'] ?? 30.00) : 0]
        ];
        jsonResponse(true, ['cards' => $cards]);
        break;

    case 'deposit/config':
        $settings = getGlobalSettings($pdo);
        jsonResponse(true, [
            'min_deposit' => (float)($settings['min_deposito'] ?? 10.00),
            'max_deposit' => (float)($settings['max_deposito'] ?? 10000.00)
        ]);
        break;

    case 'deposit/create':
        $user_id = requireAuth();
        $amount = round((float)($body['amount'] ?? 0), 2);
        $settings = getGlobalSettings($pdo);
        $minDep = (float)($settings['min_deposito'] ?? 10.00);
        $maxDep = (float)($settings['max_deposito'] ?? 10000.00);
        if ($amount < $minDep) jsonResponse(false, 'Mínimo R$ ' . number_format($minDep, 2, ',', '.'), 400);
        if ($amount > $maxDep) jsonResponse(false, 'Máximo R$ ' . number_format($maxDep, 2, ',', '.'), 400);

        $stmtU = $pdo->prepare('SELECT nome, email, telefone, cpf FROM users WHERE id = ? LIMIT 1');
        $stmtU->execute([$user_id]);
        $user = $stmtU->fetch(PDO::FETCH_ASSOC) ?: [];
        $bonus = 0.0;
        if ((int)($settings['bonus_deposito_ativo_raw'] ?? 1) === 1) {
            $tiers = [
                [(float)($settings['card3_valor_raw'] ?? 30), (float)($settings['card3_bonus_raw'] ?? 30)],
                [(float)($settings['card2_valor_raw'] ?? 25), (float)($settings['card2_bonus_raw'] ?? 20)],
                [(float)($settings['card1_valor_raw'] ?? 19.90), (float)($settings['card1_bonus_raw'] ?? 10)]
            ];
            foreach ($tiers as [$threshold, $fixed]) { if ($amount >= $threshold) { $bonus = $fixed; break; } }
        }

        $clientId = trim((string)($settings['onix_client_id'] ?? ''));
        $clientSecret = trim((string)($settings['onix_client_secret'] ?? ''));
        if ($clientId === '' || $clientSecret === '') jsonResponse(false, 'OnixPay não configurado. Informe client_id e client_secret no painel administrativo.', 500);

        $webhookUrl = getPublicBaseUrl() . '/api.php?route=webhook/onixpay/deposit';
        $cpf = preg_replace('/\D/', '', (string)($user['cpf'] ?? ($body['debtor_document_number'] ?? '')));
        if (strlen($cpf) < 11) $cpf = str_pad($cpf, 11, '0', STR_PAD_LEFT);
        $payload = [
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'nome' => trim((string)($user['nome'] ?? 'Jogador PandaPix')),
            'cpf' => substr($cpf, 0, 11),
            'valor' => $amount,
            'descricao' => 'Depósito PandaPix',
            'urlnoty' => $webhookUrl
        ];

        $ch = curl_init('https://onixpay.space/api/v2/pix/qrcode.php');
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => http_build_query($payload), CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded', 'Accept: application/json'], CURLOPT_SSL_VERIFYPEER => true, CURLOPT_TIMEOUT => 30]);
        $rawRes = curl_exec($ch);
        $curlError = curl_error($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $res = json_decode((string)$rawRes, true);
        if ($curlError !== '' || $httpCode < 200 || $httpCode > 299 || !is_array($res) || empty($res['qrcode']) || empty($res['transactionId'])) {
            $message = is_array($res) ? ($res['message'] ?? 'Resposta inválida da OnixPay') : 'Resposta inválida da OnixPay';
            jsonResponse(false, 'Erro OnixPay: ' . ($curlError !== '' ? $curlError : $message), 502);
        }
        $transactionId = (string)$res['transactionId'];
        $pixCode = (string)$res['qrcode'];
        $qrImg = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' . urlencode($pixCode);
        $pdo->prepare("INSERT INTO deposits (user_id, transaction_id, amount, bonus_amount, qrcode, status) VALUES (?, ?, ?, ?, ?, 'pending')")->execute([$user_id, $transactionId, $amount, $bonus, $pixCode]);
        jsonResponse(true, ['qrcode' => $pixCode, 'qrCodeImage' => $qrImg, 'transactionId' => $transactionId, 'gateway' => 'onixpay']);
        break;

    case 'deposit/status':
        $txId = trim((string)($_GET['transaction_id'] ?? ''));
        $stmt = $pdo->prepare('SELECT status FROM deposits WHERE transaction_id = ? LIMIT 1');
        $stmt->execute([$txId]);
        jsonResponse(true, ['status' => $stmt->fetchColumn() ?: 'pending']);
        break;

    case 'webhook/onixpay/deposit':
        $rawWebhook = file_get_contents('php://input');
        $signature = $_SERVER['HTTP_X_ONIXPAY_SIGNATURE'] ?? '';
        $settings = getGlobalSettings($pdo);
        $webhookSecret = trim((string)($settings['onix_webhook_secret'] ?? ''));
        if ($webhookSecret !== '') {
            $expected = 'sha256=' . hash_hmac('sha256', $rawWebhook, $webhookSecret);
            if ($signature === '' || !hash_equals($expected, $signature)) { http_response_code(401); echo json_encode(['ok' => false, 'error' => 'Assinatura inválida']); break; }
        }
        $data = json_decode($rawWebhook, true) ?: [];
        $txId = (string)($data['transactionId'] ?? '');
        $statusWebhook = strtoupper((string)($data['status'] ?? ''));
        logGatewayWebhook($pdo, 'onixpay', 'deposit', $txId, $statusWebhook, $rawWebhook);
        if ($txId !== '' && $statusWebhook === 'PAID') processarPagamento($pdo, $txId);
        http_response_code(200); echo json_encode(['ok' => true]);
        break;

    case 'webhook/onixpay/withdraw':
        $rawWebhook = file_get_contents('php://input');
        $signature = $_SERVER['HTTP_X_ONIXPAY_SIGNATURE'] ?? '';
        $settings = getGlobalSettings($pdo);
        $webhookSecret = trim((string)($settings['onix_webhook_secret'] ?? ''));
        if ($webhookSecret !== '') {
            $expected = 'sha256=' . hash_hmac('sha256', $rawWebhook, $webhookSecret);
            if ($signature === '' || !hash_equals($expected, $signature)) { http_response_code(401); echo json_encode(['ok' => false, 'error' => 'Assinatura inválida']); break; }
        }
        $data = json_decode($rawWebhook, true) ?: [];
        $txId = (string)($data['transactionId'] ?? '');
        $statusCode = (int)($data['statusCode']['statusId'] ?? 0);
        $statusWebhook = strtoupper((string)($data['status'] ?? ''));
        logGatewayWebhook($pdo, 'onixpay', 'withdraw', $txId, $statusWebhook !== '' ? $statusWebhook : (string)$statusCode, $rawWebhook);
        if ($txId !== '' && ($statusWebhook === 'PAID' || $statusCode === 1)) {
            $stmt = $pdo->prepare("UPDATE withdrawals SET status = 'completed' WHERE transaction_id = ? AND status IN ('pending', 'processing')"); $stmt->execute([$txId]);
        } elseif ($txId !== '' && ($statusWebhook === 'FAILED' || $statusWebhook === 'CANCELLED' || $statusCode === 3)) {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("SELECT id, user_id, amount, type FROM withdrawals WHERE transaction_id = ? AND status IN ('pending', 'processing') FOR UPDATE"); $stmt->execute([$txId]);
            foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $wd) {
                $pdo->prepare("UPDATE withdrawals SET status = 'rejected' WHERE id = ?")->execute([$wd['id']]);
                $column = $wd['type'] === 'affiliate' ? 'comissao_disponivel' : 'balance';
                $pdo->prepare("UPDATE users SET $column = $column + ? WHERE id = ?")->execute([(float)$wd['amount'], (int)$wd['user_id']]);
            }
            $pdo->commit();
        }
        http_response_code(200); echo json_encode(['ok' => true]);
        break;

    case 'withdraw/create':
        $user_id = requireAuth();
        $amount = (float)($body['amount'] ?? 0);
        $pix_key = trim($body['pix_key'] ?? '');
        $pix_type = strtoupper(trim($body['pix_type'] ?? 'CPF'));

        debugSaqueLog('withdraw_create_start', [
            'user_id' => $user_id,
            'amount' => $amount,
            'pix_type' => $pix_type,
            'pix_key_len' => strlen($pix_key)
        ]);

        $u = $pdo->prepare("SELECT balance, COALESCE(rollover_atual, 0) as rollover_atual, COALESCE(rollover_meta, 0) as rollover_meta, is_demo FROM users WHERE id = ?");
        $u->execute([$user_id]);
        $user = $u->fetch();

        // Contas DEMO podem solicitar saque para fins de teste sem restrição de rollover
        // Removido o bloqueio total de saque para Demo para permitir testes de fluxo completo.

        if (empty($pix_key)) {
            debugSaqueLog('withdraw_create_blocked_no_pix', ['user_id' => $user_id]);
            jsonResponse(false, 'Chave PIX obrigatória.', 400);
        }

        $settings = getGlobalSettings($pdo);
        $minS = (float)getNumericSetting($settings, 'min_saque', 10.00);
        $maxS = (float)getNumericSetting($settings, 'max_saque', 5000.00);

        if ($amount < $minS) {
            debugSaqueLog('withdraw_create_blocked_min', ['user_id' => $user_id, 'amount' => $amount, 'min' => $minS]);
            jsonResponse(false, "O saque mínimo permitido é de R$ " . number_format($minS, 2, ',', '.'), 400);
        }
        if ($amount > $maxS) {
            debugSaqueLog('withdraw_create_blocked_max', ['user_id' => $user_id, 'amount' => $amount, 'max' => $maxS]);
            jsonResponse(false, "O saque máximo permitido é de R$ " . number_format($maxS, 2, ',', '.'), 400);
        }

        $rollover_atual = (float)$user['rollover_atual'];
        $rollover_meta = (float)$user['rollover_meta'];

        // Validação de rollover - Ignorada para contas DEMO
        if (!$user['is_demo'] && $rollover_meta > 0.01 && $rollover_atual < ($rollover_meta - 0.01)) {
            $falta = $rollover_meta - $rollover_atual;
            debugSaqueLog('withdraw_create_blocked_rollover', [
                'user_id' => $user_id,
                'rollover_atual' => $rollover_atual,
                'rollover_meta' => $rollover_meta,
                'falta' => $falta
            ]);
            jsonResponse(false, "Rollover pendente! Voce ainda precisa apostar R$ " . number_format($falta, 2, ',', '.') . " para liberar o saque.", 400);
        }

        $pdo->beginTransaction();
        $stmtBalance = $pdo->prepare("SELECT balance FROM users WHERE id = ? FOR UPDATE");
        $stmtBalance->execute([$user_id]);
        $balanceAtual = (float)$stmtBalance->fetchColumn();
        if ($balanceAtual < $amount) {
            $pdo->rollBack();
            debugSaqueLog('withdraw_create_blocked_balance', ['user_id' => $user_id, 'balance' => $balanceAtual, 'amount' => $amount]);
            jsonResponse(false, 'Saldo insuficiente.');
        }

        $pdo->prepare("UPDATE users SET balance = balance - ? WHERE id = ?")->execute([$amount, $user_id]);
        
        $status = $user['is_demo'] ? 'completed' : 'pending';
        $type = $user['is_demo'] ? 'demo' : 'regular';
        
        $pdo->prepare("INSERT INTO withdrawals (user_id, amount, pix_type, pix_key, type, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())")
            ->execute([$user_id, $amount, $pix_type, $pix_key, $type, $status]);
            
        $withdrawId = (int)$pdo->lastInsertId();
        $pdo->commit();
        debugSaqueLog('withdraw_create_success', ['user_id' => $user_id, 'withdraw_id' => $withdrawId, 'amount' => $amount, 'type' => $type, 'status' => $status]);

        $msg = $user['is_demo'] ? 'Saque demo processado com sucesso!' : 'Saque solicitado com sucesso! Aguarde a aprovação.';
        jsonResponse(true, ['message' => $msg]);
        break;

    // --- SAQUES E STATUS AFILIADO ---
    case 'affiliate/stats':
        $user_id = requireAuth();
        $period = $_GET['period'] ?? 'all';
        $settings = getGlobalSettings($pdo);
        $commissionConfig = getAffiliateCommissionConfig($settings);
        $range = getAffiliatePeriodRange($period);

        $stmt = $pdo->prepare("SELECT id, affiliate_code, comissao_disponivel, tipo_conta FROM users WHERE id = ? LIMIT 1");
        $stmt->execute([$user_id]);
        $u = $stmt->fetch();

        if (!$u) {
            jsonResponse(false, 'UsuÃ¡rio nÃ£o encontrado.', 404);
        }

        $isAffiliate = in_array(($u['tipo_conta'] ?? 'JOGADOR'), ['AFILIADO', 'DEMO']);
        $leadRecords = $isAffiliate ? getAffiliateLeadRecords($pdo, $user_id, $settings) : [];
        $statusCounts = [
            'without_deposit' => 0,
            'awaiting_deposit' => 0,
            'processing' => 0,
            'confirmed' => 0
        ];

        foreach ($leadRecords as $leadRecord) {
            $statusKey = $leadRecord['status_key'] ?? 'without_deposit';
            if (!isset($statusCounts[$statusKey])) {
                $statusCounts[$statusKey] = 0;
            }
            $statusCounts[$statusKey]++;
        }

        $total_referrals = 0;
        $referrals_with_deposit = 0;
        $first_deposit_value = 0.0;
        $total_deposit_value = 0.0;
        $total_deposit_count = 0;

        if ($isAffiliate) {
            // Regra: Indicados = todos com CPF preenchido
            $stmtLeads = $pdo->prepare("SELECT id, created_at, cpf FROM users WHERE referred_by = ? AND is_demo = 0 AND (cpf IS NOT NULL AND cpf != '') ORDER BY id ASC");
            $stmtLeads->execute([$user_id]);
            $leads = $stmtLeads->fetchAll();

            if ($leads) {
                $leadIds = array_map(function($lead) {
                    return (int)$lead['id'];
                }, $leads);

                foreach ($leads as $lead) {
                    if (dateMatchesRange($lead['created_at'] ?? null, $range)) {
                        $total_referrals++;
                    }
                }

                $placeholders = implode(',', array_fill(0, count($leadIds), '?'));
                $stmtDeposits = $pdo->prepare("SELECT id, user_id, amount, status, created_at FROM deposits WHERE user_id IN ($placeholders) ORDER BY user_id ASC, id ASC");
                $stmtDeposits->execute($leadIds);
                $depositRows = $stmtDeposits->fetchAll();

                $depositsByUser = [];
                foreach ($depositRows as $depositRow) {
                    $leadId = (int)$depositRow['user_id'];
                    if (!isset($depositsByUser[$leadId])) {
                        $depositsByUser[$leadId] = [];
                    }
                    $depositsByUser[$leadId][] = $depositRow;
                }

                foreach ($leadIds as $leadId) {
                    $rows = $depositsByUser[$leadId] ?? [];
                    $eligibilityMap = buildCommissionEligibilityMap($rows, $commissionConfig);
                    $countedLead = false;

                    foreach ($rows as $depositRow) {
                        $depositId = (int)$depositRow['id'];
                        $eligibility = $eligibilityMap[$depositId] ?? null;
                        if (!$eligibility || !$eligibility['qualifies']) {
                            continue;
                        }
                        if (!dateMatchesRange($depositRow['created_at'] ?? null, $range)) {
                            continue;
                        }

                        $total_deposit_count++;
                        $total_deposit_value += (float)$depositRow['amount'];

                        if ($eligibility['sequence_index'] === 1) {
                            $first_deposit_value += (float)$depositRow['amount'];
                        }

                        if (!$countedLead) {
                            $referrals_with_deposit++;
                            $countedLead = true;
                        }
                    }
                }
            }
        }

        $generated_commission = 0.0;
        $paid_withdrawals = 0.0;

        if ($isAffiliate) {
            $stmt = $pdo->prepare("SELECT commission_amount, created_at FROM affiliate_commissions WHERE affiliate_user_id = ? AND status IN ('pending', 'paid')");
            $stmt->execute([$user_id]);
            foreach ($stmt->fetchAll() as $commissionRow) {
                if (!dateMatchesRange($commissionRow['created_at'] ?? null, $range)) {
                    continue;
                }
                $generated_commission += (float)$commissionRow['commission_amount'];
            }

            $stmt = $pdo->prepare("SELECT amount, created_at FROM withdrawals WHERE user_id = ? AND type = 'affiliate' AND status IN ('completed', 'paid')");
            $stmt->execute([$user_id]);
            foreach ($stmt->fetchAll() as $withdrawalRow) {
                if (!dateMatchesRange($withdrawalRow['created_at'] ?? null, $range)) {
                    continue;
                }
                $paid_withdrawals += (float)$withdrawalRow['amount'];
            }
        }

        jsonResponse(true, [
            'is_affiliate' => $isAffiliate,
            'commission_mode' => $commissionConfig['mode'],
            'skip_cpa' => $commissionConfig['skip_count'],
            'affiliate_link' => $isAffiliate ? (getPublicBaseUrl() . '/?ref=' . $u['affiliate_code']) : '',
            'total_referrals' => $total_referrals,
            'referrals_with_deposit' => $referrals_with_deposit,
            'first_deposit_value' => round($first_deposit_value, 2),
            'total_deposit_value' => round($total_deposit_value, 2),
            'total_deposit_count' => $total_deposit_count,
            'generated_commission' => round($generated_commission, 2),
            'total_commission' => round($generated_commission, 2),
            'available_commission' => $isAffiliate ? (float)$u['comissao_disponivel'] : 0.0,
            'paid_withdrawals' => round($paid_withdrawals, 2),
            'status_counts' => $statusCounts,
            'lead_records' => $leadRecords
        ]);
        break;

        // 1. total_referrals (Novos subordinados no período)
        $stmt = $pdo->prepare("SELECT COUNT(id) FROM users WHERE referred_by = ? AND is_demo = 0 $dateFilterUsers");
        $stmt->execute([$user_id]);
        $total_referrals = (int)$stmt->fetchColumn();

        $firstDepositCondition = "d.id = (SELECT MIN(d2.id) FROM deposits d2 WHERE d2.user_id = d.user_id AND d2.status = 'completed')";
        $depositModeFilter = $commissionMode === 'first_deposit_only' ? " AND $firstDepositCondition" : "";
        $commissionModeFilter = $commissionMode === 'first_deposit_only'
            ? " AND ac.deposit_id = (SELECT MIN(d3.id) FROM deposits d3 WHERE d3.user_id = ac.deposit_user_id AND d3.status = 'completed')"
            : "";

        // 2. referrals_with_deposit (Novos subordinados que depositaram)
        $stmt = $pdo->prepare("SELECT COUNT(DISTINCT u.id) FROM users u 
                               JOIN deposits d ON u.id = d.user_id 
                               WHERE u.referred_by = ? AND u.is_demo = 0 AND d.status = 'completed' $depositModeFilter $dateFilterReferralUsers");
        $stmt->execute([$user_id]);
        $referrals_with_deposit = (int)$stmt->fetchColumn();

        // 3. total_deposit_value (Soma de depósitos no período)
        $stmt = $pdo->prepare("SELECT SUM(d.amount) FROM deposits d
                               JOIN users u ON u.id = d.user_id
                               WHERE d.status = 'completed' 
                               AND u.referred_by = ? AND u.is_demo = 0
                               $depositModeFilter
                               $dateFilterDeposits");
        $stmt->execute([$user_id]);
        $total_deposit_value = (float)($stmt->fetchColumn() ?: 0);

        // 4. total_deposit_count (Qtd de depósitos no período)
        $stmt = $pdo->prepare("SELECT COUNT(d.id) FROM deposits d
                               JOIN users u ON u.id = d.user_id
                               WHERE d.status = 'completed' 
                               AND u.referred_by = ? AND u.is_demo = 0
                               $depositModeFilter
                               $dateFilterDeposits");
        $stmt->execute([$user_id]);
        $total_deposit_count = (int)$stmt->fetchColumn();

        // 5. first_deposit_value (Soma de 1ºs depósitos no período)
        $stmt = $pdo->prepare("SELECT SUM(amount) FROM deposits d
                               WHERE d.status = 'completed' 
                               AND d.user_id IN (SELECT id FROM users WHERE referred_by = ? AND is_demo = 0)
                               AND d.id = (SELECT MIN(id) FROM deposits d2 WHERE d2.user_id = d.user_id AND d2.status = 'completed')
                               $dateFilterDeposits");
        $stmt->execute([$user_id]);
        $first_deposit_value = (float)($stmt->fetchColumn() ?: 0);

        // 6. generated_commission (Comissões geradas/creditadas no período)
        $stmt = $pdo->prepare("SELECT SUM(ac.commission_amount) FROM affiliate_commissions ac
                               JOIN users u ON u.id = ac.deposit_user_id
                               WHERE ac.affiliate_user_id = ? AND ac.status IN ('pending', 'paid') AND u.is_demo = 0
                               $commissionModeFilter
                               $dateFilterCommissionsAliased");
        $stmt->execute([$user_id]);
        $generated_commission = (float)($stmt->fetchColumn() ?: 0);

        // 7. paid_withdrawals (Pagamentos reais aprovados ao afiliado no período)
        $stmt = $pdo->prepare("SELECT SUM(amount) FROM withdrawals
                               WHERE user_id = ? AND type = 'affiliate' AND status IN ('completed', 'paid')
                               $dateFilterWithdrawals");
        $stmt->execute([$user_id]);
        $paid_withdrawals = (float)($stmt->fetchColumn() ?: 0);

        // 8. available_commission & link
        $stmt = $pdo->prepare("SELECT affiliate_code, comissao_disponivel FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $u = $stmt->fetch();

        jsonResponse(true, [
            'affiliate_link' => 'https://'.$_SERVER['HTTP_HOST'].'/?ref='.$u['affiliate_code'],
            'total_referrals' => $total_referrals,
            'referrals_with_deposit' => $referrals_with_deposit,
            'first_deposit_value' => $first_deposit_value,
            'total_deposit_value' => $total_deposit_value,
            'total_deposit_count' => $total_deposit_count,
            'generated_commission' => $generated_commission,
            'total_commission' => $generated_commission,
            'paid_withdrawals' => $paid_withdrawals,
            'available_commission' => (float)$u['comissao_disponivel']
        ]);
        break;

    case 'affiliate/withdraw':
        $user_id = requireAuth();
        $amount = (float)($body['amount'] ?? 0);
        $pix_key = trim($body['pix_key'] ?? '');
        $pix_type = strtoupper(trim($body['pix_type'] ?? 'CPF'));
        debugSaqueLog('affiliate_withdraw_start', [
            'user_id' => $user_id,
            'amount' => $amount,
            'pix_type' => $pix_type,
            'pix_key_len' => strlen($pix_key)
        ]);

        $stmtAffiliate = $pdo->prepare("SELECT tipo_conta FROM users WHERE id = ? LIMIT 1");
        $stmtAffiliate->execute([$user_id]);
        $affiliateType = $stmtAffiliate->fetchColumn();
        if (!in_array($affiliateType, ['AFILIADO', 'DEMO'])) {
            debugSaqueLog('affiliate_withdraw_blocked_not_affiliate', ['user_id' => $user_id]);
            jsonResponse(false, 'Somente afiliados aprovados podem solicitar saque de comissão.', 403);
        }

        if ($amount < 10) {
            debugSaqueLog('affiliate_withdraw_blocked_min', ['user_id' => $user_id, 'amount' => $amount]);
            jsonResponse(false, 'Saque mínimo de afiliado é R$ 10,00', 400);
        }
        if (empty($pix_key)) {
            debugSaqueLog('affiliate_withdraw_blocked_no_pix', ['user_id' => $user_id]);
            jsonResponse(false, 'Chave PIX obrigatória.', 400);
        }

        $pdo->beginTransaction();
        $stmt = $pdo->prepare("SELECT comissao_disponivel FROM users WHERE id = ? FOR UPDATE");
        $stmt->execute([$user_id]);
        $com = (float)$stmt->fetchColumn();

        if ($com < $amount) { 
            $pdo->rollBack(); 
            debugSaqueLog('affiliate_withdraw_blocked_balance', ['user_id' => $user_id, 'comissao' => $com, 'amount' => $amount]);
            jsonResponse(false, 'Comissão insuficiente.', 400); 
        }

        $pdo->prepare("UPDATE users SET comissao_disponivel = comissao_disponivel - ? WHERE id = ?")->execute([$amount, $user_id]);
        $pdo->prepare("INSERT INTO withdrawals (user_id, amount, pix_type, pix_key, type, status, created_at) VALUES (?, ?, ?, ?, 'affiliate', 'pending', NOW())")->execute([$user_id, $amount, $pix_type, $pix_key]);
        $withdrawId = (int)$pdo->lastInsertId();
        $pdo->commit();
        debugSaqueLog('affiliate_withdraw_success', ['user_id' => $user_id, 'withdraw_id' => $withdrawId, 'amount' => $amount]);

        jsonResponse(true, ['message' => 'Saque de comissão solicitado com sucesso!']);
        break;

    default:
        jsonResponse(false, "Rota não encontrada ou método inválido ($route).", 404);
        break;
}

// ==========================================
// FUNCAO DE PROCESSAMENTO DE PAGAMENTO (WEBHOOK)
// ==========================================
function processarPagamento($pdo, $txId) {
    // 1. Antes de processar: verificar se já existe processado (Idempotência básica)
    $stmtCheck = $pdo->prepare("SELECT status FROM deposits WHERE transaction_id = ?");
    $stmtCheck->execute([$txId]);
    $existingStatus = $stmtCheck->fetchColumn();

    if ($existingStatus === 'completed' || $existingStatus === 'paid') {
        return true; 
    }

    // Busca o depósito pendente
    $stmt = $pdo->prepare("SELECT * FROM deposits WHERE transaction_id = ? AND status = 'pending' LIMIT 1");
    $stmt->execute([$txId]);
    $dep = $stmt->fetch();

    if (!$dep) {
        return false;
    }

    try {
        $pdo->beginTransaction();

        // 2. Dentro da transação: SELECT ... FOR UPDATE no depósito para evitar race conditions
        $stmtLock = $pdo->prepare("SELECT id, status, user_id, amount, bonus_amount FROM deposits WHERE id = ? FOR UPDATE");
        $stmtLock->execute([$dep['id']]);
        $depLocked = $stmtLock->fetch();

        // Re-verificar status após o lock
        if (!$depLocked || $depLocked['status'] !== 'pending') {
            $pdo->rollBack();
            return ($depLocked && ($depLocked['status'] === 'completed' || $depLocked['status'] === 'paid'));
        }

        // 3. Atualização segura: status = 'completed' WHERE id = ? AND status = 'pending'
        $stmtUpdate = $pdo->prepare("UPDATE deposits SET status = 'completed' WHERE id = ? AND status = 'pending'");
        $stmtUpdate->execute([$dep['id']]);

        // Verificar rowsAffected: se 0 -> abortar (já foi processado concorrentemente)
        if ($stmtUpdate->rowCount() === 0) {
            $pdo->rollBack();
            return true; 
        }

        // 4. Garantir que o saldo e rollover subam apenas uma vez
        $uDataStmt = $pdo->prepare("SELECT balance, id, referred_by, cpa_pago, is_demo, cpf FROM users WHERE id = ? FOR UPDATE");
        $uDataStmt->execute([$dep['user_id']]);
        $uData = $uDataStmt->fetch();
        $saldoAtual = (float)($uData['balance'] ?? 0);

        // Rollover deve acumular, não resetar cegamente no depósito.
        // O reset só deve ocorrer manualmente via admin ou se houver uma regra específica de expiração.
        // Removido o reset que ocorria quando o saldo era < 1.00.

        $settings = getGlobalSettings($pdo);
        $mult = (float)getNumericSetting($settings, 'rollover_multiplier', 1.0);
        if ($mult < 1.0) $mult = 1.0; 

        $valorReal = (float)$dep['amount'];
        $valorBonus = (float)$dep['bonus_amount'];
        
        // Só gera meta de rollover se NÃO for conta demo
        $metaAdd = 0;
        if (!$uData['is_demo']) {
            $metaAdd = ($valorReal + $valorBonus) * $mult;
        }

        // Usamos COALESCE para evitar problemas com valores NULL na adição
        $pdo->prepare("UPDATE users SET balance = COALESCE(balance, 0) + ? + ?, rollover_meta = COALESCE(rollover_meta, 0) + ? WHERE id = ?")
            ->execute([$valorReal, $valorBonus, $metaAdd, $dep['user_id']]);

        // 5. CPA só executa UMA vez
        if ($uData && !$uData['is_demo'] && (int)($uData['referred_by'] ?? 0) > 0 && !empty($uData['cpf'])) {
            $commissionConfig = getAffiliateCommissionConfig($settings);
            
            // Re-checar histórico para CPA
            $stmtHistory = $pdo->prepare("SELECT id, amount, status, created_at FROM deposits WHERE user_id = ? ORDER BY id ASC");
            $stmtHistory->execute([$dep['user_id']]);
            $depositHistory = $stmtHistory->fetchAll();

            $eligibilityMap = buildCommissionEligibilityMap($depositHistory, $commissionConfig);
            $currentEligibility = $eligibilityMap[(int)$dep['id']] ?? null;
            $paidAnyCpa = false;

            if ($currentEligibility && $currentEligibility['qualifies']) {
                $depositUserId = (int)$uData['id'];
                $level1Affiliate = (int)$uData['referred_by'];

                $stmtLvl1 = $pdo->prepare("SELECT id, referred_by, tipo_conta, comissao_cpa FROM users WHERE id = ? LIMIT 1");
                $stmtLvl1->execute([$level1Affiliate]);
                $level1User = $stmtLvl1->fetch();

                if ($level1User && in_array(($level1User['tipo_conta'] ?? 'JOGADOR'), ['AFILIADO', 'DEMO'])) {
                    $cpaPercentLvl1 = $level1User['comissao_cpa'] !== null
                        ? (float)$level1User['comissao_cpa']
                        : getDefaultAffiliateCpaPercent($settings, 1);
                    $cpaValueLvl1 = round(($valorReal * $cpaPercentLvl1) / 100, 2);
                    $level2Affiliate = (int)($level1User['referred_by'] ?? 0);

                    if ($cpaValueLvl1 > 0) {
                        // Evitar duplicação: verificar se já existe comissão para este depósito e nível
                        $stmtCheck1 = $pdo->prepare("SELECT id FROM affiliate_commissions WHERE deposit_id = ? AND level = 1");
                        $stmtCheck1->execute([$dep['id']]);
                        if (!$stmtCheck1->fetch()) {
                            $pdo->prepare("UPDATE users SET comissao_disponivel = comissao_disponivel + ? WHERE id = ?")
                                ->execute([$cpaValueLvl1, $level1Affiliate]);
                            $pdo->prepare("INSERT INTO affiliate_commissions (affiliate_user_id, referred_user_id, deposit_user_id, deposit_id, level, type, base_amount, percent, commission_amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())")
                                ->execute([$level1Affiliate, $depositUserId, $depositUserId, $dep['id'], 1, 'cpa', $valorReal, $cpaPercentLvl1, $cpaValueLvl1, 'pending']);
                            $paidAnyCpa = true;
                        }
                    }

                    if ($level2Affiliate > 0) {
                        $stmtLvl2 = $pdo->prepare("SELECT id, tipo_conta, comissao_cpa_nivel2 FROM users WHERE id = ? LIMIT 1");
                        $stmtLvl2->execute([$level2Affiliate]);
                        $level2User = $stmtLvl2->fetch();

                        if ($level2User && in_array(($level2User['tipo_conta'] ?? 'JOGADOR'), ['AFILIADO', 'DEMO'])) {
                            $cpaPercentLvl2 = $level2User['comissao_cpa_nivel2'] !== null
                                ? (float)$level2User['comissao_cpa_nivel2']
                                : getDefaultAffiliateCpaPercent($settings, 2);
                            $cpaValueLvl2 = round(($valorReal * $cpaPercentLvl2) / 100, 2);

                            if ($cpaValueLvl2 > 0) {
                                // Evitar duplicação: verificar se já existe comissão para este depósito e nível
                                $stmtCheck2 = $pdo->prepare("SELECT id FROM affiliate_commissions WHERE deposit_id = ? AND level = 2");
                                $stmtCheck2->execute([$dep['id']]);
                                if (!$stmtCheck2->fetch()) {
                                    $pdo->prepare("UPDATE users SET comissao_disponivel = comissao_disponivel + ? WHERE id = ?")
                                        ->execute([$cpaValueLvl2, $level2Affiliate]);
                                    $pdo->prepare("INSERT INTO affiliate_commissions (affiliate_user_id, referred_user_id, deposit_user_id, deposit_id, level, type, base_amount, percent, commission_amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())")
                                        ->execute([$level2Affiliate, $depositUserId, $depositUserId, $dep['id'], 2, 'cpa', $valorReal, $cpaPercentLvl2, $cpaValueLvl2, 'pending']);
                                    $paidAnyCpa = true;
                                }
                            }
                        }
                    }
                }
            }

            if (!empty($paidAnyCpa) && !$uData['cpa_pago']) {
                $pdo->prepare("UPDATE users SET cpa_pago = 1 WHERE id = ?")->execute([(int)$uData['id']]);
            }
        }

        $pdo->commit();
        return true;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        debugSaqueLog('deposit_process_error', [
            'transaction_id' => $txId,
            'error' => $e->getMessage()
        ]);
        return false;
    }
}

function mapPixTypeToAkad($pixType) {
    $t = strtolower(trim((string)$pixType));
    if ($t === 'cpf') return 'cpf';
    if ($t === 'cnpj') return 'cnpj';
    if ($t === 'email') return 'email';
    if ($t === 'phone' || $t === 'telefone' || $t === 'celular') return 'phone';
    if ($t === 'random' || $t === 'evp' || $t === 'aleatoria' || $t === 'aleatória') return 'random';
    return 'cpf';
}

function getSettingText($settings, $slug, $default = '') {
    $val = $settings[$slug] ?? null;
    if ($val === null || $val === '' || $val === '0' || $val === '0.00') return $default;
    return trim((string)$val);
}

function logGatewayWebhook($pdo, $provider, $webhookType, $transactionId, $status, $payloadRaw) {
    try {
        $stmt = $pdo->prepare("INSERT INTO gateway_webhooks (provider, webhook_type, transaction_id, status, payload) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$provider, $webhookType, $transactionId, $status, $payloadRaw]);
    } catch (Throwable $e) {
        // Evita quebrar processamento por falha de log
    }
}

function debugSaqueLog($event, $context = []) {
    $line = '[' . date('Y-m-d H:i:s') . '] ' . $event;
    if (!empty($context)) {
        $json = json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $line .= ' | ' . $json;
    }
    $line .= PHP_EOL;

    $dir = __DIR__ . '/logs';
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
    @file_put_contents($dir . '/saque_debug.log', $line, FILE_APPEND);
    @file_put_contents(__DIR__ . '/includes/debug_saque_admin.txt', $line, FILE_APPEND);
}




