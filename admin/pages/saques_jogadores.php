<?php
if (!isset($pdo)) { die("Acesso restrito."); }

$mensagem = "";
$erro_msg = "";

function debugAdminSaqueLog($event, $context = []) {
    $line = '[' . date('Y-m-d H:i:s') . '] ' . $event;
    if (!empty($context)) {
        $line .= ' | ' . json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    $line .= PHP_EOL;
    @file_put_contents(__DIR__ . '/../../includes/debug_saque_admin.txt', $line, FILE_APPEND);
}

function getAdminPublicBaseUrl() {
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $isHttps = false;
    if (!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off') $isHttps = true;
    if (!$isHttps && strtolower((string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https') $isHttps = true;
    if (!$isHttps && stripos($host, 'localhost') === false && stripos($host, '127.0.0.1') === false) $isHttps = true;
    return ($isHttps ? 'https' : 'http') . '://' . $host;
}


function getGameSettings($pdo) {
    $stmt = $pdo->query("SELECT slug, value, description FROM game_settings");
    $settings = [];
    while ($row = $stmt->fetch()) {
        $settings[$row['slug']] = ($row['value'] != 0) ? $row['value'] : $row['description'];
        $settings[$row['slug'].'_raw'] = (float)$row['value'];
    }
    return $settings;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    try {
        $saque_id = (int)($_POST['saque_id'] ?? 0);
        debugAdminSaqueLog('admin_regular_action_start', [
            'saque_id' => $saque_id,
            'action' => $_POST['action'] ?? ''
        ]);

        // Centralizado: aceita saques 'regular' e 'affiliate'
        $stmt = $pdo->prepare("SELECT s.*, u.id as user_id, u.nome, u.cpf, u.telefone, u.is_demo, u.tipo_conta FROM withdrawals s LEFT JOIN users u ON s.user_id = u.id WHERE s.id = ?");
        $stmt->execute([$saque_id]);
        $saque = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$saque) {
            debugAdminSaqueLog('admin_regular_not_found', ['saque_id' => $saque_id]);
            throw new Exception("Saque não encontrado.");
        }

        if ($saque['status'] !== 'pending') {
            debugAdminSaqueLog('admin_regular_not_pending', ['saque_id' => $saque_id, 'status' => $saque['status']]);
            throw new Exception("Este saque já foi processado ou não está mais pendente.");
        }

        if ($_POST['action'] === 'approve') {
            $token_informado = trim($_POST['security_token'] ?? '');
            $stmt_admin = $pdo->prepare("SELECT senha FROM users WHERE id = ? AND is_admin = 1");
            $stmt_admin->execute([$_SESSION['admin_id'] ?? 0]);
            $admin_senha_hash = $stmt_admin->fetchColumn();

            if (!$admin_senha_hash || !password_verify($token_informado, $admin_senha_hash)) {
                throw new Exception("Senha de autorização inválida.");
            }

            // ATOMIC UPDATE to prevent double processing
            $up_proc = $pdo->prepare("UPDATE withdrawals SET status = 'processing' WHERE id = ? AND status = 'pending'");
            $up_proc->execute([$saque_id]);
            if ($up_proc->rowCount() === 0) {
                debugAdminSaqueLog('admin_regular_already_processing', ['saque_id' => $saque_id]);
                throw new Exception("Este saque já está sendo processado por outra instância.");
            }

            try {
                $settings = getGameSettings($pdo);
                $clientId = trim((string)($settings['onix_client_id'] ?? ''));
                $clientSecret = trim((string)($settings['onix_client_secret'] ?? ''));
                if ($clientId === '' || $clientSecret === '') throw new Exception("Credenciais OnixPay não configuradas.");
                $webhookUrl = getAdminPublicBaseUrl() . "/api.php?route=webhook/onixpay/withdraw";
                $nome = trim((string)($saque['nome'] ?? 'Beneficiário PandaPix'));
                $cpf = preg_replace('/\D/', '', (string)($saque['cpf'] ?? '00000000000'));
                if (strlen($cpf) < 11) $cpf = str_pad($cpf, 11, '0', STR_PAD_LEFT);
                $payload = [
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                    'nome' => $nome,
                    'cpf' => substr($cpf, 0, 11),
                    'valor' => round((float)$saque['amount'], 2),
                    'chave_pix' => trim((string)$saque['pix_key']),
                    'descricao' => 'Saque PandaPix #' . $saque_id,
                    'urlnoty' => $webhookUrl
                ];
                $ch = curl_init('https://onixpay.space/api/v2/pix/payment.php');
                curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => http_build_query($payload), CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded', 'Accept: application/json'], CURLOPT_SSL_VERIFYPEER => true, CURLOPT_TIMEOUT => 30]);
                $response = curl_exec($ch); $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); $curlError = curl_error($ch); curl_close($ch);
                $resGateway = json_decode((string)$response, true) ?: [];
                $gatewayTx = (string)($resGateway['transactionId'] ?? $resGateway['external_id'] ?? '');
                $gatewayStatus = strtoupper((string)($resGateway['status'] ?? 'PENDING'));
                if ($curlError !== '' || $httpCode < 200 || $httpCode > 299 || $gatewayTx === '') {
                    $pdo->prepare("UPDATE withdrawals SET status = 'pending' WHERE id = ? AND status = 'processing'")->execute([$saque_id]);
                    throw new Exception('OnixPay: ' . ($curlError !== '' ? $curlError : ($resGateway['message'] ?? 'Resposta inválida da API')));
                }
                $statusLocal = $gatewayStatus === 'PAID' ? 'completed' : 'processing';
                $up = $pdo->prepare('UPDATE withdrawals SET status = ?, transaction_id = ? WHERE id = ?'); $up->execute([$statusLocal, $gatewayTx, $saque_id]);
                $mensagem = $statusLocal === 'completed' ? 'Saque aprovado e marcado como pago.' : 'Saque enviado para processamento pela OnixPay.';
            } catch (Exception $e_gate) {
                // Em caso de erro na comunicação, garantir que não fique em 'processing' para sempre se possível
                $pdo->prepare("UPDATE withdrawals SET status = 'pending' WHERE id = ? AND status = 'processing'")->execute([$saque_id]);
                throw $e_gate;
            }
        } elseif ($_POST['action'] === 'reject') {
            $pdo->beginTransaction();
            $up_rej = $pdo->prepare("UPDATE withdrawals SET status = 'rejected' WHERE id = ? AND status = 'pending'");
            $up_rej->execute([$saque_id]);
            if ($up_rej->rowCount() > 0) {
                $pdo->prepare("UPDATE users SET balance = balance + ? WHERE id = ?")->execute([$saque['amount'], $saque['user_id']]);
                $pdo->commit();
                debugAdminSaqueLog('admin_regular_rejected', ['saque_id' => $saque_id]);
                $mensagem = "Saque rejeitado e saldo estornado para a conta do jogador.";
            } else {
                $pdo->rollBack();
                throw new Exception("Não foi possível rejeitar este saque (já processado ou em processamento).");
            }
        }
    } catch (Exception $e) {
        if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
        debugAdminSaqueLog('admin_regular_exception', [
            'saque_id' => $saque_id ?? null,
            'error' => $e->getMessage()
        ]);
        $erro_msg = $e->getMessage();
    }
}

$search = trim($_GET['search'] ?? '');
$where = "WHERE 1=1";
if ($search !== '') { $where .= " AND (u.nome LIKE :s OR u.email LIKE :s OR u.telefone LIKE :s)"; }

$stats = $pdo->query("SELECT 
    COUNT(*) as total_count,
    SUM(CASE WHEN status IN ('pending','processing') THEN 1 ELSE 0 END) as pending_count,
    SUM(CASE WHEN status IN ('completed', 'paid') THEN 1 ELSE 0 END) as completed_count,
    SUM(CASE WHEN status IN ('rejected', 'cancelled') THEN 1 ELSE 0 END) as rejected_count,
    SUM(CASE WHEN status IN ('pending','processing') THEN amount ELSE 0 END) as pendente_valor,
    SUM(CASE WHEN status IN ('completed', 'paid') THEN amount ELSE 0 END) as pago_valor
    FROM withdrawals")->fetch(PDO::FETCH_ASSOC);

$sql = "SELECT s.*, u.nome as usuario, u.email, u.telefone, u.is_demo, u.tipo_conta FROM withdrawals s LEFT JOIN users u ON s.user_id = u.id $where ORDER BY s.created_at DESC";
$stmt = $pdo->prepare($sql);
if ($search !== '') { $stmt->bindValue(':s', "%$search%"); }
$stmt->execute();
$saques = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<div class="space-y-8 animate-fade-in pb-12">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
            <h2 class="text-3xl font-black text-white tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Saques PandaPix</h2>
            <p class="text-zinc-500 text-sm">Aprove ou recuse os pagamentos (JOGADOR, DEMO ou AFILIADO CPA).</p>
        </div>
        <form method="GET" class="relative">
            <input type="hidden" name="page" value="saques_jogadores">
            <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"></i>
            <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="Buscar jogador..." class="bg-dark-900 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-white outline-none w-full sm:w-64 focus:border-green-500/50 transition-all">
        </form>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Card: Total de Saques -->
        <div class="p-6 rounded-[2rem] bg-dark-900 border border-white/5 relative overflow-hidden group hover:border-blue-500/30 transition-all">
            <div class="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl"></div>
            <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1"><i class="fas fa-list text-blue-500 mr-1"></i> Total de Saques</p>
            <h3 class="text-2xl font-black text-white italic"><?= number_format($stats['total_count'] ?? 0, 0, ',', '.') ?></h3>
        </div>

        <!-- Card: Saques Pendentes -->
        <div class="p-6 rounded-[2rem] bg-dark-900 border border-white/5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
            <div class="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl"></div>
            <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1"><i class="fas fa-clock text-amber-500 mr-1"></i> Saques Pendentes</p>
            <h3 class="text-2xl font-black text-white italic text-amber-500"><?= number_format($stats['pending_count'] ?? 0, 0, ',', '.') ?></h3>
        </div>

        <!-- Card: Saques Pagos -->
        <div class="p-6 rounded-[2rem] bg-dark-900 border border-white/5 relative overflow-hidden group hover:border-green-500/30 transition-all">
            <div class="absolute -right-4 -top-4 w-20 h-20 bg-green-500/10 rounded-full blur-2xl"></div>
            <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1"><i class="fas fa-check-circle text-green-500 mr-1"></i> Saques Pagos</p>
            <h3 class="text-2xl font-black text-white italic text-green-500"><?= number_format($stats['completed_count'] ?? 0, 0, ',', '.') ?></h3>
        </div>

        <!-- Card: Saques Cancelados -->
        <div class="p-6 rounded-[2rem] bg-dark-900 border border-white/5 relative overflow-hidden group hover:border-red-500/30 transition-all">
            <div class="absolute -right-4 -top-4 w-20 h-20 bg-red-500/10 rounded-full blur-2xl"></div>
            <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1"><i class="fas fa-times-circle text-red-500 mr-1"></i> Saques Cancelados</p>
            <h3 class="text-2xl font-black text-white italic text-red-500"><?= number_format($stats['rejected_count'] ?? 0, 0, ',', '.') ?></h3>
        </div>

        <!-- Card: Valor Total Pendente -->
        <div class="p-6 rounded-[2rem] bg-dark-900 border border-white/5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
            <div class="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl"></div>
            <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1"><i class="fas fa-hand-holding-usd text-amber-500 mr-1"></i> Valor Pendente</p>
            <h3 class="text-2xl font-black text-white italic text-amber-500">R$ <?= number_format($stats['pendente_valor'] ?? 0, 2, ',', '.') ?></h3>
        </div>

        <!-- Card: Valor Total Pago -->
        <div class="p-6 rounded-[2rem] bg-dark-900 border border-white/5 relative overflow-hidden group hover:border-green-500/30 transition-all">
            <div class="absolute -right-4 -top-4 w-20 h-20 bg-green-500/10 rounded-full blur-2xl"></div>
            <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1"><i class="fas fa-money-bill-wave text-green-500 mr-1"></i> Total Pago</p>
            <h3 class="text-2xl font-black text-white italic text-green-500">R$ <?= number_format($stats['pago_valor'] ?? 0, 2, ',', '.') ?></h3>
        </div>
    </div>

    <?php if($mensagem): ?>
        <div class="bg-green-600/10 border border-green-500/20 text-green-400 p-4 rounded-2xl text-sm font-bold flex items-center gap-3">
            <i class="fas fa-check-circle text-lg"></i> <?= htmlspecialchars($mensagem) ?>
        </div>
    <?php endif; ?>

    <?php if($erro_msg): ?>
        <div class="bg-red-600/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm font-bold flex items-center gap-3">
            <i class="fas fa-exclamation-triangle text-lg"></i> <?= htmlspecialchars($erro_msg) ?>
        </div>
    <?php endif; ?>

    <div class="bg-dark-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] bg-white/[0.02]">
                        <th class="py-6 px-8">Solicitante</th>
                        <th class="py-6 px-4 text-center">Valor</th>
                        <th class="py-6 px-4">Chave PIX</th>
                        <th class="py-6 px-4 text-center">Status</th>
                        <th class="py-6 px-4 text-center">Data</th>
                        <th class="py-6 px-4 text-center">Tipo</th>
                        <th class="py-6 px-8 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    <?php if(empty($saques)): ?>
                        <tr><td colspan="7" class="py-12 text-center">
                            <i class="fas fa-inbox text-4xl text-zinc-800 mb-4 block"></i>
                            <p class="text-zinc-600 italic font-bold text-sm">Nenhum saque encontrado até o momento.</p>
                        </td></tr>
                    <?php endif; ?>

                    <?php foreach ($saques as $s): 
                        $statusStr = strtolower($s['status']);
                        if ($statusStr === 'completed' || $statusStr === 'paid') {
                            $statusClass = 'text-green-500 bg-green-500/10 border-green-500/20';
                            $statusLabel = 'PAGO';
                        } elseif ($statusStr === 'pending' || $statusStr === 'processing') {
                            $statusClass = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
                            $statusLabel = ($statusStr === 'processing') ? 'PROCESSANDO' : 'PENDENTE';
                        } else {
                            $statusClass = 'text-red-500 bg-red-500/10 border-red-500/20';
                            $statusLabel = 'RECUSADO';
                        }
                    ?>
                    <tr class="group hover:bg-white/[0.01]">
                        <td class="py-5 px-8">
                            <p class="text-sm font-bold text-white"><?= htmlspecialchars($s['usuario'] ?? 'N/A') ?></p>
                            <div class="flex flex-col gap-0.5 mt-1">
                                <p class="text-[10px] text-zinc-500"><i class="fas fa-phone-alt mr-1"></i> <?= htmlspecialchars($s['telefone']) ?></p>
                                <?php if($s['email']): ?>
                                    <p class="text-[10px] text-zinc-500"><i class="fas fa-envelope mr-1 text-[8px]"></i> <?= htmlspecialchars($s['email']) ?></p>
                                <?php endif; ?>
                            </div>
                        </td>
                        <td class="py-5 px-4 text-center">
                            <span class="font-black text-white italic text-lg tracking-wider">R$ <?= number_format($s['amount'], 2, ',', '.') ?></span>
                        </td>
                        <td class="py-5 px-4 text-xs font-medium text-zinc-400">
                            <span class="inline-block text-[9px] text-green-500 bg-green-500/10 px-2 py-0.5 rounded font-black uppercase mb-1"><?= $s['pix_type'] ?></span><br>
                            <?= htmlspecialchars($s['pix_key']) ?>
                        </td>
                        <td class="py-5 px-4 text-center">
                            <span class="text-[9px] font-black px-3 py-1 rounded-md border <?= $statusClass ?> tracking-widest">
                                <?= $statusLabel ?>
                            </span>
                        </td>
                        <td class="py-5 px-4 text-center">
                            <span class="text-[10px] text-zinc-500 font-bold"><?= date('d/m/Y', strtotime($s['created_at'])) ?></span><br>
                            <span class="text-[9px] text-zinc-600"><?= date('H:i', strtotime($s['created_at'])) ?></span>
                        </td>
                        <td class="py-5 px-4 text-center">
                            <?php
                                if (($s['type'] ?? '') === 'demo' || !empty($s['is_demo'])) {
                                    $tipoLabel = 'DEMO';
                                    $tipoClass = 'text-amber-400 bg-amber-500/10 border border-amber-500/20';
                                } elseif (($s['type'] ?? 'regular') === 'affiliate') {
                                    $tipoLabel = 'AFILIADO (CPA)';
                                    $tipoClass = 'text-purple-400 bg-purple-500/10 border border-purple-500/20';
                                } else {
                                    $tipoLabel = 'JOGADOR';
                                    $tipoClass = 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
                                }
                            ?>
                            <span class="text-[9px] font-black px-3 py-1 rounded-md tracking-widest <?= $tipoClass ?>"><?= $tipoLabel ?></span>
                        </td>
                        <td class="py-5 px-8 text-right">
                            <div class="flex justify-end gap-2">
                                <?php if($statusStr === 'pending' && ($s['type'] ?? '') !== 'demo'): ?>
                                    <button onclick="openApprovalModal(<?= $s['id'] ?>, '<?= number_format($s['amount'], 2, ',', '.') ?>')" class="w-10 h-10 rounded-xl bg-green-600/10 text-green-500 hover:bg-green-600 hover:text-white transition-all flex items-center justify-center border border-green-500/20 shadow-lg" title="Aprovar e Pagar Agora">
                                        <i class="fas fa-check text-xs"></i>
                                    </button>
                                    <form method="POST" onsubmit="return confirm('Recusar e estornar valor para a banca do jogador?')" class="m-0 p-0">
                                        <input type="hidden" name="action" value="reject">
                                        <input type="hidden" name="saque_id" value="<?= $s['id'] ?>">
                                        <button type="submit" class="w-10 h-10 rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center border border-red-500/20 shadow-lg" title="Reprovar e Estornar">
                                            <i class="fas fa-times text-xs"></i>
                                        </button>
                                    </form>
                                <?php else: ?>
                                    <span class="w-10 h-10 rounded-xl bg-zinc-800/30 text-zinc-700 flex items-center justify-center border border-white/5" title="Processado">
                                        <i class="fas fa-lock text-[10px]"></i>
                                    </span>
                                <?php endif; ?>
                            </div>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<div id="modalAprovar" class="fixed inset-0 z-[100] hidden items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="bg-dark-900 border border-green-500/20 rounded-[2.5rem] w-full max-w-md p-10 animate-zoom-in shadow-2xl">
        <h3 class="text-xl font-black text-white uppercase italic mb-2"><i class="fas fa-shield-alt text-green-500 mr-2"></i> Liberar PIX</h3>
        <p class="text-zinc-500 text-xs mb-8">Autorizando o saque de <span class="text-green-400 font-black text-sm" id="txtValor"></span></p>
        
        <form method="POST" class="space-y-4">
            <input type="hidden" name="action" value="approve">
            <input type="hidden" name="saque_id" id="modal_saque_id">
            
            <div class="p-6 bg-black/40 rounded-3xl border border-white/5 shadow-inner">
                <label class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 block text-center">Sua Senha de Admin</label>
                <input type="password" name="security_token" required placeholder="Digite sua senha..." 
                    class="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white text-center text-lg font-black focus:border-green-500 outline-none transition-all shadow-inner">
            </div>

            <button type="submit" class="w-full py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-green-600/20 transition-all active:scale-95">
                Autorizar Pagamento
            </button>
            <button type="button" onclick="closeApprovalModal()" class="w-full text-zinc-600 text-[10px] font-bold uppercase mt-3 hover:text-zinc-400 transition-colors">Cancelar Operação</button>
        </form>
    </div>
</div>

<script>
function openApprovalModal(id, valor) {
    document.getElementById('modal_saque_id').value = id;
    document.getElementById('txtValor').innerText = 'R$ ' + valor;
    document.getElementById('modalAprovar').classList.replace('hidden', 'flex');
}
function closeApprovalModal() {
    document.getElementById('modalAprovar').classList.replace('flex', 'hidden');
}
</script>

<style>
@keyframes zoom-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
.animate-zoom-in { animation: zoom-in 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
</style>
