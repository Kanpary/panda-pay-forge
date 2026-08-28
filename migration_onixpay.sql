-- Migração da gateway para OnixPay v2.
-- Execute uma única vez no banco de dados existente.

ALTER TABLE gateway_config
    ADD COLUMN webhook_secret varchar(255) DEFAULT NULL AFTER client_secret;

ALTER TABLE withdrawals
    ADD COLUMN transaction_id varchar(255) DEFAULT NULL AFTER cpf,
    ADD INDEX idx_withdrawals_transaction_id (transaction_id);

UPDATE gateway_config
SET gateway_name = 'onixpay',
    client_id = '',
    client_secret = '',
    webhook_secret = NULL,
    base_url = 'https://onixpay.space/api/v2',
    is_active = 1
WHERE gateway_name IN ('knucklespay', 'gerapix');

INSERT INTO gateway_config (gateway_name, client_id, client_secret, webhook_secret, base_url, is_active)
SELECT 'onixpay', '', '', NULL, 'https://onixpay.space/api/v2', 1
WHERE NOT EXISTS (SELECT 1 FROM gateway_config WHERE gateway_name = 'onixpay');

DELETE FROM gateway_config WHERE gateway_name <> 'onixpay';
