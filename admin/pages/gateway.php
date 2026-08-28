<?php
if (!isset($pdo)) { die("Acesso restrito."); }
$mensagem = '';
$erro = '';
function upsertGatewaySetting($pdo, $slug, $value) {
    $stmt = $pdo->prepare("INSERT INTO game_settings (slug, value, description) VALUES (?, 0, ?) ON DUPLICATE KEY UPDATE value = 0, description = VALUES(description)");
    $stmt->execute([$slug, trim((string)$value)]);
}
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_onixpay'])) {
    try {
        $pdo->beginTransaction();
        upsertGatewaySetting($pdo, 'onix_client_id', $_POST['onix_client_id'] ?? '');
        upsertGatewaySetting($pdo, 'onix_client_secret', $_POST['onix_client_secret'] ?? '');
        upsertGatewaySetting($pdo, 'onix_webhook_secret', $_POST['onix_webhook_secret'] ?? '');
        $pdo->commit();
        $mensagem = 'Configurações da OnixPay salvas com sucesso.';
    } catch (Exception $e) { if ($pdo->inTransaction()) $pdo->rollBack(); $erro = $e->getMessage(); }
}
$stmt = $pdo->query("SELECT slug, value, description FROM game_settings"); $g = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) $g[$row['slug']] = $row['description'] !== '' ? $row['description'] : $row['value'];
$clientId = trim((string)($g['onix_client_id'] ?? ''));
$clientSecret = trim((string)($g['onix_client_secret'] ?? ''));
$webhookSecret = trim((string)($g['onix_webhook_secret'] ?? ''));
?>
<div class="w-full max-w-4xl mx-auto pb-24 animate-fade-in">
    <div class="mb-10"><h2 class="text-3xl font-black text-white tracking-tighter uppercase italic"><i class="fas fa-lock text-green-500"></i> OnixPay</h2><p class="text-sm text-zinc-500 mt-1 font-medium">Gateway único para depósitos PIX e transferências PIX.</p></div>
    <?php if ($mensagem): ?><div class="mb-6 bg-green-500/10 border border-green-500/30 text-green-400 px-5 py-3 rounded-xl text-sm font-bold"><?= htmlspecialchars($mensagem) ?></div><?php endif; ?>
    <?php if ($erro): ?><div class="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-3 rounded-xl text-sm font-bold"><?= htmlspecialchars($erro) ?></div><?php endif; ?>
    <div class="mb-6 bg-blue-500/10 border border-blue-500/30 text-blue-300 px-5 py-4 rounded-xl text-sm">Consulte suas credenciais em <a class="underline font-bold" href="https://onixpay.space/keys" target="_blank" rel="noopener noreferrer">onixpay.space/keys</a>. O segredo nunca é enviado ao navegador dos jogadores.</div>
    <form method="POST" class="bg-dark-900 border border-white/5 rounded-[2rem] p-8 space-y-5">
        <input type="hidden" name="save_onixpay" value="1">
        <div><label class="block text-[10px] font-black uppercase text-zinc-500 mb-2">Client ID</label><input type="text" name="onix_client_id" value="<?= htmlspecialchars($clientId) ?>" class="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white font-mono outline-none focus:border-green-500" required></div>
        <div><label class="block text-[10px] font-black uppercase text-zinc-500 mb-2">Client Secret</label><input type="password" name="onix_client_secret" value="<?= htmlspecialchars($clientSecret) ?>" class="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white font-mono outline-none focus:border-green-500" required></div>
        <div><label class="block text-[10px] font-black uppercase text-zinc-500 mb-2">Webhook Secret (opcional)</label><input type="password" name="onix_webhook_secret" value="<?= htmlspecialchars($webhookSecret) ?>" class="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white font-mono outline-none focus:border-green-500"><p class="text-xs text-zinc-500 mt-2">Preencha somente se a assinatura HMAC estiver ativada no painel OnixPay.</p></div>
        <button type="submit" class="w-full mt-2 py-4 rounded-xl font-black uppercase tracking-widest text-xs bg-green-600 hover:bg-green-500 text-white transition-all">Salvar configurações OnixPay</button>
    </form>
</div>
