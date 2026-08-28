<?php
// Endpoint legado mantido como alias compatível para a notificação de depósito OnixPay.
$_GET['route'] = 'webhook/onixpay/deposit';
require __DIR__ . '/api.php';
