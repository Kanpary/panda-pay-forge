-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Tempo de geração: 20-Abr-2026 às 16:50
-- Versão do servidor: 11.8.6-MariaDB-log
-- versão do PHP: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Estrutura da tabela `affiliate_commissions`
--

CREATE TABLE IF NOT EXISTS `affiliate_commissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `affiliate_user_id` int(11) NOT NULL,
  `referred_user_id` int(11) NOT NULL,
  `deposit_user_id` int(11) NOT NULL,
  `deposit_id` int(11) DEFAULT NULL,
  `level` tinyint(1) NOT NULL,
  `type` enum('cpa','revshare') NOT NULL DEFAULT 'cpa',
  `base_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `percent` decimal(10,2) NOT NULL DEFAULT 0.00,
  `commission_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_affiliate` (`affiliate_user_id`),
  KEY `idx_referred` (`referred_user_id`),
  KEY `idx_deposit_user` (`deposit_user_id`),
  KEY `idx_level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `config_jogo`
--

CREATE TABLE IF NOT EXISTS `config_jogo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `logo_url` varchar(255) DEFAULT NULL,
  `banner_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed config_jogo
INSERT IGNORE INTO `config_jogo` (`id`, `logo_url`, `banner_url`) VALUES (1, 'assets/uploads/logo_1713636600.png', 'assets/uploads/bg_1713636600.png');

-- --------------------------------------------------------

--
-- Estrutura da tabela `config_pixels`
--

CREATE TABLE IF NOT EXISTS `config_pixels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `facebook_pixel` text DEFAULT NULL,
  `google_analytics` text DEFAULT NULL,
  `tiktok_pixel` text DEFAULT NULL,
  `kwai_pixel` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed config_pixels
INSERT IGNORE INTO `config_pixels` (`id`) VALUES (1);

-- --------------------------------------------------------

-- --------------------------------------------------------


--
-- Estrutura da tabela `deposits`
--

CREATE TABLE IF NOT EXISTS `deposits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `transaction_id` varchar(100) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `bonus_amount` decimal(10,2) DEFAULT 0.00,
  `status` enum('pending','completed','paid','cancelled') DEFAULT 'pending',
  `qrcode` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_status` (`user_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `game_history`
--

CREATE TABLE IF NOT EXISTS `game_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `bet_amount` decimal(10,2) DEFAULT 0.00,
  `win_amount` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `game_sessions`
--

CREATE TABLE IF NOT EXISTS `game_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `bet_amount` decimal(10,2) NOT NULL,
  `max_win_amount` decimal(10,2) NOT NULL,
  `win_amount` decimal(10,2) DEFAULT 0.00,
  `status` enum('active','finished','lost','cancelled') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `finished_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_status` (`user_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `game_settings`
--

CREATE TABLE IF NOT EXISTS `game_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(50) NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Extraindo dados da tabela `game_settings`
INSERT IGNORE INTO `game_settings` (`id`, `slug`, `value`, `description`) VALUES
(1, 'rtp_real', 30.00, 'RTP para contas reais (0-100)'),
(2, 'rtp_demo', 80.00, 'RTP para contas demo (0-100)'),
(3, 'flower_mult_real', 1.00, 'Multiplicador de flores para conta real'),
(4, 'flower_mult_demo', 2.50, 'Multiplicador de flores para conta demo'),
(5, 'obstacle_mult_real', 2.00, 'Multiplicador de obstáculos para conta real'),
(6, 'obstacle_mult_demo', 0.20, 'Multiplicador de obstáculos para conta demo'),
(7, 'bonus_max_real', 1.00, 'Valor máximo do presente na conta real'),
(8, 'bonus_max_demo', 100.00, 'Valor máximo do presente na conta demo'),
(9, 'flower_value_real', 1.00, 'Pontos por flor na conta real'),
(10, 'flower_value_demo', 50.00, 'Pontos por flor na conta demo'),
(11, 'leaf_value_real', 0.00, 'Pontos por folha na conta real'),
(12, 'leaf_value_demo', 0.00, 'Pontos por folha na conta demo'),
(13, 'cpa_percent_lvl1', 60.00, 'Percentagem CPA Nível 1 sobre 1º depósito (%)'),
(14, 'cpa_percent_lvl2', 20.00, 'Percentagem CPA Nível 2 sobre 1º depósito (%)'),
(17, 'min_deposito_cpa', 10.00, 'Depósito mínimo para disparar o CPA'),
(58, 'gateway_ativo', 1.00, 'Gateway único: onixpay'),
(59, 'rollover_multiplier', 0.00, 'Multiplicador de aposta para libertar saque (ex: depósito x 2)'),
(62, 'split_id', 0.00, 'ID da carteira Split 1'),
(63, 'split_percent', 0.00, 'Percentagem Split 1 (%)'),
(64, 'split_id_2', 0.00, 'ID da carteira Split 2'),
(65, 'split_percent_2', 0.00, 'Percentagem Split 2 (%)'),
(66, 'split_id_3', 0.00, 'ID da carteira Split 3'),
(67, 'split_percent_3', 0.00, 'Percentagem Split 3 (%)'),
(68, 'split_id_4', 0.00, 'ID da carteira Split 4'),
(69, 'split_percent_4', 0.00, 'Percentagem Split 4 (%)'),
(70, 'min_deposito', 1.00, 'Valor mínimo para depósito via PIX'),
(71, 'max_deposito', 10000.00, 'Valor máximo para depósito via PIX'),
(72, 'min_saque', 10.00, 'Valor mínimo para solicitação de saque'),
(73, 'max_saque', 1000.00, 'Valor máximo para solicitação de saque por vez'),
(74, 'bonus_deposito_ativo', 0.00, 'Ativar bônus de depósito (1=Sim, 0=Não)'),
(75, 'card1_valor', 19.90, 'Valor do card 1'),
(76, 'card1_bonus', 10.00, 'Bônus do card 1'),
(77, 'card2_valor', 25.00, 'Valor do card 2'),
(78, 'card2_bonus', 20.00, 'Bônus do card 2'),
(79, 'card3_valor', 30.00, 'Valor do card 3'),
(80, 'card3_bonus', 30.00, 'Bônus do card 3'),
(81, 'onix_client_id', 0.00, ''),
(82, 'onix_client_secret', 0.00, ''),
(83, 'onix_webhook_secret', 0.00, ''),
(85, 'gift_value_real_1', 1.00, 'Valor 1 do presente na conta real'),
(86, 'gift_value_real_2', 1.00, 'Valor 2 do presente na conta real'),
(87, 'gift_value_real_3', 1.00, 'Valor 3 do presente na conta real'),
(88, 'gift_value_real_4', 1.00, 'Valor 4 do presente na conta real'),
(89, 'gift_value_demo_1', 50.00, 'Valor 1 do presente na conta demo'),
(90, 'gift_value_demo_2', 50.00, 'Valor 2 do presente na conta demo'),
(91, 'gift_value_demo_3', 50.00, 'Valor 3 do presente na conta demo'),
(92, 'gift_value_demo_4', 50.00, 'Valor 4 do presente na conta demo'),
(93, 'affiliate_commission_mode', 0.00, 'first_deposit_only'),
(94, 'pular_cpa', 0.00, 'Quantidade de depósitos que contam antes de pular o próximo'),
(95, 'flower_value_min', 1.00, 'Valor minimo da flor na conta real'),
(96, 'flower_value_max', 1.00, 'Valor maximo da flor na conta real'),
(97, 'flower_value_min_demo', 50.00, 'Valor minimo da flor na conta demo'),
(98, 'flower_value_max_demo', 50.00, 'Valor maximo da flor na conta demo');

-- --------------------------------------------------------

--
-- Estrutura da tabela `gateway_webhooks`
--

CREATE TABLE IF NOT EXISTS `gateway_webhooks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `provider` varchar(50) NOT NULL,
  `webhook_type` varchar(30) NOT NULL,
  `transaction_id` varchar(120) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `payload` longtext DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_provider_type` (`provider`,`webhook_type`),
  KEY `idx_transaction_id` (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `panda_premios`
--

CREATE TABLE IF NOT EXISTS `panda_premios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item` varchar(50) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `chance` decimal(10,2) NOT NULL,
  `tipo` enum('REAL','DEMO') DEFAULT 'REAL',
  `imagem_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `telefone` varchar(20) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `banido` tinyint(1) DEFAULT 0,
  `is_admin` tinyint(1) DEFAULT 0,
  `tipo_conta` enum('JOGADOR','AFILIADO','DEMO','ADMIN','INFLUENCER','AGENTE') DEFAULT 'JOGADOR',
  `balance` decimal(10,2) DEFAULT 0.00,
  `affiliate_code` varchar(50) DEFAULT NULL,
  `referred_by` int(11) DEFAULT NULL,
  `is_influencer` tinyint(1) DEFAULT 0,
  `panda_win_boost` int(11) DEFAULT 0,
  `rtp` int(11) DEFAULT 50,
  `is_demo` tinyint(1) DEFAULT 0,
  `flower_mult` decimal(5,2) DEFAULT 1.00,
  `obstacle_mult` decimal(5,2) DEFAULT 1.00,
  `comissao_disponivel` decimal(10,2) DEFAULT 0.00,
  `cpa_pago` tinyint(1) DEFAULT 0,
  `tipo_cpa` varchar(20) DEFAULT 'PRIMEIRO',
  `indicados_count` int(11) DEFAULT 0,
  `cpa_total` decimal(10,2) DEFAULT 0.00,
  `estado` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `rollover_meta` decimal(10,2) DEFAULT 0.00,
  `rollover_atual` decimal(10,2) DEFAULT 0.00,
  `comissao_cpa` decimal(10,2) DEFAULT 10.00,
  `comissao_cpa_nivel2` decimal(10,2) DEFAULT 5.00,
  `comissao_revshare` decimal(10,2) DEFAULT 30.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `telefone` (`telefone`),
  UNIQUE KEY `affiliate_code` (`affiliate_code`),
  KEY `idx_referred_by` (`referred_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Admin
INSERT IGNORE INTO `users` (`id`, `nome`, `email`, `telefone`, `senha`, `banido`, `is_admin`, `tipo_conta`, `balance`, `affiliate_code`, `referred_by`, `is_influencer`, `panda_win_boost`, `rtp`, `is_demo`, `flower_mult`, `obstacle_mult`, `comissao_disponivel`, `cpa_pago`, `created_at`, `rollover_meta`, `rollover_atual`, `comissao_cpa`, `comissao_cpa_nivel2`, `comissao_revshare`) VALUES
(1, 'admin', 'demodtx@gmail.com', '34234242343', '$2y$10$biaBGbjoemO0eqjzQz0OY.3TO8zpBhSdZgolF6kMyvCLiHFG7xD6y', 0, 1, 'JOGADOR', 100.00, 'admin_aff', NULL, 0, 0, 50, 0, 1.00, 1.00, 0.00, 0, current_timestamp(), 0.00, 0.00, 10.00, 5.00, 30.00);

-- --------------------------------------------------------


--
-- Estrutura da tabela `withdrawals`
--

CREATE TABLE IF NOT EXISTS `withdrawals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `pix_type` varchar(20) NOT NULL,
  `pix_key` varchar(100) NOT NULL,
  `transaction_id` varchar(100) DEFAULT NULL,
  `status` enum('pending','processing','completed','rejected','cancelled') DEFAULT 'pending',
  `type` enum('regular','affiliate') DEFAULT 'regular',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_type` (`user_id`, `type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
