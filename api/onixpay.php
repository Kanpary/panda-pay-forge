<?php
require_once '../db.php';

class OnixPay
{
    private PDO $pdo;
    private string $clientId;
    private string $clientSecret;
    private ?string $webhookSecret = null;
    private string $baseUrl = 'https://onixpay.space/api/v2/';

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->loadConfig();
    }

    private function loadConfig(): void
    {
        $stmt = $this->pdo->prepare(
            "SELECT client_id, client_secret, webhook_secret, base_url
             FROM gateway_config
             WHERE gateway_name = 'onixpay' AND is_active = 1
             LIMIT 1"
        );
        $stmt->execute();
        $config = $stmt->fetch(PDO::FETCH_ASSOC);

        $envClientId = trim((string) getenv('ONIXPAY_CLIENT_ID'));
        $envClientSecret = trim((string) getenv('ONIXPAY_CLIENT_SECRET'));
        $envWebhookSecret = trim((string) getenv('ONIXPAY_WEBHOOK_SECRET'));

        if (!$config) {
            $config = [];
        }

        // Keep the original database configuration, with a server-only fallback
        // for deployments that provide credentials through protected environment variables.
        $this->clientId = trim((string) ($config['client_id'] ?? '')) ?: $envClientId;
        $this->clientSecret = trim((string) ($config['client_secret'] ?? '')) ?: $envClientSecret;
        $this->webhookSecret = trim((string) ($config['webhook_secret'] ?? '')) ?: ($envWebhookSecret ?: null);

        if ($this->clientId === '' || $this->clientSecret === '') {
            throw new RuntimeException('OnixPay não configurada. Informe client_id e client_secret no painel administrativo.');
        }

        if (!empty($config['base_url'])) {
            $this->baseUrl = rtrim($config['base_url'], '/') . '/';
        }
    }

    public function getWebhookSecret(): ?string
    {
        return $this->webhookSecret;
    }

    public function getCallbackUrl(string $path = '/api/callback.php'): string
    {
        $forwardedProto = $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '';
        $scheme = $forwardedProto ?: ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http');
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        return $scheme . '://' . $host . '/' . ltrim($path, '/');
    }

    public function createDeposit(float $amount, string $name, string $cpf, ?string $callbackUrl = null): array
    {
        if ($amount < 10) {
            throw new InvalidArgumentException('O valor mínimo para depósito é R$ 10,00.');
        }

        return $this->request('pix/qrcode.php', [
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'nome' => trim($name),
            'cpf' => preg_replace('/\D/', '', $cpf),
            'valor' => number_format($amount, 2, '.', ''),
            'descricao' => 'Depósito na roleta',
            'urlnoty' => $callbackUrl ?: $this->getCallbackUrl(),
        ]);
    }

    public function createPayment(float $amount, string $name, string $cpf, string $pixKey, ?string $callbackUrl = null): array
    {
        if ($amount <= 0) {
            throw new InvalidArgumentException('O valor da transferência deve ser maior que zero.');
        }

        return $this->request('pix/payment.php', [
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'nome' => trim($name),
            'cpf' => preg_replace('/\D/', '', $cpf),
            'valor' => number_format($amount, 2, '.', ''),
            'chave_pix' => trim($pixKey),
            'descricao' => 'Saque da roleta',
            'urlnoty' => $callbackUrl ?: $this->getCallbackUrl('/api/callback_saida.php'),
        ]);
    }

    public function getStatus(?string $transactionId = null, ?string $referenceCode = null): array
    {
        if (!$transactionId && !$referenceCode) {
            throw new InvalidArgumentException('Informe transaction_id ou reference_code.');
        }

        $params = [
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
        ];
        if ($transactionId) {
            $params['transaction_id'] = $transactionId;
        }
        if ($referenceCode) {
            $params['reference_code'] = $referenceCode;
        }

        return $this->request('pix/status.php?' . http_build_query($params), null, 'GET');
    }

    private function request(string $endpoint, ?array $payload = null, string $method = 'POST'): array
    {
        $curl = curl_init($this->baseUrl . ltrim($endpoint, '/'));
        $options = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded', 'Accept: application/json'],
        ];

        if ($payload !== null) {
            $options[CURLOPT_POSTFIELDS] = http_build_query($payload);
        }

        curl_setopt_array($curl, $options);
        $response = curl_exec($curl);
        $error = curl_error($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        if ($error) {
            throw new RuntimeException('Erro de comunicação com a OnixPay: ' . $error);
        }

        $data = json_decode((string)$response, true);
        if (!is_array($data)) {
            throw new RuntimeException('A OnixPay retornou uma resposta inválida. HTTP ' . $httpCode);
        }

        if ($httpCode < 200 || $httpCode >= 300) {
            throw new RuntimeException('Erro OnixPay: ' . ($data['message'] ?? json_encode($data, JSON_UNESCAPED_UNICODE)));
        }

        return $data;
    }
}
