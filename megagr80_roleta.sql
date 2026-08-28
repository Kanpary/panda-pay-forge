-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Tempo de geração: 29/12/2025 às 20:50
-- Versão do servidor: 5.7.23-23
-- Versão do PHP: 8.1.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `megagr80_roleta`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Despejando dados para a tabela `admins`
--

INSERT INTO `admins` (`id`, `username`, `password`, `created_at`) VALUES
(1, 'admin', '$2y$10$S0KQq8Pn.viGAKXP2RRz1ONiDvcDgujoS74uszhmnRAEadDam56hi', '2025-12-21 18:29:04');

-- --------------------------------------------------------

--
-- Estrutura para tabela `affiliate_logs`
--

CREATE TABLE `affiliate_logs` (
  `id` int(11) NOT NULL,
  `referrer_id` int(11) NOT NULL,
  `referred_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `type` enum('registration','deposit_commission') NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura para tabela `deposits`
--

CREATE TABLE `deposits` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','paid','failed') DEFAULT 'pending',
  `external_id` varchar(255) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `qrcode` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura para tabela `game_history`
--

CREATE TABLE `game_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `bet_amount` decimal(10,2) NOT NULL,
  `win_amount` decimal(10,2) DEFAULT '0.00',
  `result` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura para tabela `gateway_config`
--

CREATE TABLE `gateway_config` (
  `id` int(11) NOT NULL,
  `gateway_name` varchar(50) NOT NULL,
  `client_id` varchar(255) DEFAULT NULL,
  `client_secret` varchar(255) DEFAULT NULL,
  `webhook_secret` varchar(255) DEFAULT NULL,
  `base_url` varchar(255) DEFAULT 'https://onixpay.space/api/v2',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Despejando dados para a tabela `gateway_config`
--

INSERT INTO `gateway_config` (`id`, `gateway_name`, `client_id`, `client_secret`, `webhook_secret`, `base_url`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'onixpay', '', '', NULL, 'https://onixpay.space/api/v2', 1, '2025-12-21 17:06:13', '2026-08-16 00:00:00');

-- --------------------------------------------------------

--
-- Estrutura para tabela `multiplicadores`
--

CREATE TABLE `multiplicadores` (
  `id` int(11) NOT NULL,
  `valor` int(11) NOT NULL,
  `chance` decimal(5,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Despejando dados para a tabela `multiplicadores`
--

INSERT INTO `multiplicadores` (`id`, `valor`, `chance`) VALUES
(1, 1, 30.00),
(2, 2, 20.00),
(3, 3, 0.00),
(4, 4, 0.00);

-- --------------------------------------------------------

--
-- Estrutura para tabela `multiplicadores_influencer`
--

CREATE TABLE `multiplicadores_influencer` (
  `id` int(11) NOT NULL,
  `valor` int(11) NOT NULL,
  `chance` decimal(5,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Despejando dados para a tabela `multiplicadores_influencer`
--

INSERT INTO `multiplicadores_influencer` (`id`, `valor`, `chance`) VALUES
(1, 1, 50.00),
(2, 2, 0.00),
(3, 3, 100.00),
(4, 4, 0.00);

-- --------------------------------------------------------

--
-- Estrutura para tabela `probabilidade`
--

CREATE TABLE `probabilidade` (
  `id` int(11) NOT NULL,
  `valor` int(11) NOT NULL,
  `chance` decimal(5,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Despejando dados para a tabela `probabilidade`
--

INSERT INTO `probabilidade` (`id`, `valor`, `chance`) VALUES
(1, 0, 30.00),
(2, 2, 0.00),
(3, 5, 0.00),
(4, 10, 0.00),
(5, 15, 0.00),
(6, 20, 0.00),
(7, 50, 0.00),
(8, 100, 0.00);

-- --------------------------------------------------------

--
-- Estrutura para tabela `probabilidade_influencer`
--

CREATE TABLE `probabilidade_influencer` (
  `id` int(11) NOT NULL,
  `valor` int(11) NOT NULL,
  `chance` decimal(5,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Despejando dados para a tabela `probabilidade_influencer`
--

INSERT INTO `probabilidade_influencer` (`id`, `valor`, `chance`) VALUES
(1, 0, 50.00),
(2, 2, 0.00),
(3, 5, 0.00),
(4, 10, 0.00),
(5, 15, 0.00),
(6, 20, 0.00),
(7, 50, 0.00),
(8, 100, 80.00);

-- --------------------------------------------------------

--
-- Estrutura para tabela `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Despejando dados para a tabela `settings`
--

INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `updated_at`) VALUES
(1, 'min_deposit', '10', '2025-12-29 18:39:40'),
(2, 'min_withdrawal', '100.00', '2025-12-21 23:38:02'),
(3, 'rollover_multiplier', '1', '2025-12-21 18:29:04'),
(4, 'roulette_prob_win', NULL, '2025-12-21 23:38:02'),
(5, 'roulette_multiplier_1', '2.00', '2025-12-21 18:29:04'),
(6, 'roulette_multiplier_2', '5.00', '2025-12-21 18:29:04'),
(7, 'gateway_client_id', '', '2025-12-21 18:29:04'),
(8, 'gateway_client_secret', '', '2025-12-21 18:29:04');

-- --------------------------------------------------------

--
-- Estrutura para tabela `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `nome_completo` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `cpf` varchar(11) NOT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `senha` varchar(255) NOT NULL,
  `saldo` decimal(10,2) DEFAULT '0.00',
  `affiliate_code` varchar(50) DEFAULT NULL,
  `comissao` int(11) DEFAULT '10',
  `referred_by` int(11) DEFAULT NULL,
  `status` enum('online','offline') DEFAULT 'offline',
  `last_seen` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `role` enum('user','admin') DEFAULT 'user',
  `commission_type` enum('rev','cpa') DEFAULT 'rev',
  `cpa_value` decimal(10,2) DEFAULT '10.00',
  `is_influencer` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura para tabela `withdrawals`
--

CREATE TABLE `withdrawals` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `pix_key_type` varchar(50) NOT NULL,
  `pix_key` varchar(255) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `cpf` varchar(20) NOT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Índices de tabela `affiliate_logs`
--
ALTER TABLE `affiliate_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `referrer_id` (`referrer_id`),
  ADD KEY `referred_id` (`referred_id`);

--
-- Índices de tabela `deposits`
--
ALTER TABLE `deposits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Índices de tabela `game_history`
--
ALTER TABLE `game_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Índices de tabela `gateway_config`
--
ALTER TABLE `gateway_config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `gateway_name` (`gateway_name`);

--
-- Índices de tabela `multiplicadores`
--
ALTER TABLE `multiplicadores`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `multiplicadores_influencer`
--
ALTER TABLE `multiplicadores_influencer`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `probabilidade`
--
ALTER TABLE `probabilidade`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `probabilidade_influencer`
--
ALTER TABLE `probabilidade_influencer`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`);

--
-- Índices de tabela `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `cpf` (`cpf`),
  ADD UNIQUE KEY `affiliate_code` (`affiliate_code`),
  ADD KEY `referred_by` (`referred_by`);

--
-- Índices de tabela `withdrawals`
--
ALTER TABLE `withdrawals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `transaction_id` (`transaction_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `affiliate_logs`
--
ALTER TABLE `affiliate_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `deposits`
--
ALTER TABLE `deposits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `game_history`
--
ALTER TABLE `game_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `gateway_config`
--
ALTER TABLE `gateway_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `multiplicadores`
--
ALTER TABLE `multiplicadores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `multiplicadores_influencer`
--
ALTER TABLE `multiplicadores_influencer`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `probabilidade`
--
ALTER TABLE `probabilidade`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de tabela `probabilidade_influencer`
--
ALTER TABLE `probabilidade_influencer`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de tabela `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de tabela `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `withdrawals`
--
ALTER TABLE `withdrawals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `affiliate_logs`
--
ALTER TABLE `affiliate_logs`
  ADD CONSTRAINT `affiliate_logs_ibfk_1` FOREIGN KEY (`referrer_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `affiliate_logs_ibfk_2` FOREIGN KEY (`referred_id`) REFERENCES `users` (`id`);

--
-- Restrições para tabelas `deposits`
--
ALTER TABLE `deposits`
  ADD CONSTRAINT `deposits_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Restrições para tabelas `game_history`
--
ALTER TABLE `game_history`
  ADD CONSTRAINT `game_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Restrições para tabelas `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`referred_by`) REFERENCES `users` (`id`);

--
-- Restrições para tabelas `withdrawals`
--
ALTER TABLE `withdrawals`
  ADD CONSTRAINT `withdrawals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
