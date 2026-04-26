-- ============================================================
--  KeaFlow — Schema SQL
--  Banco: MySQL 8.0.13+
--  Empresa: KeaLabs Inovação
-- ============================================================

CREATE DATABASE IF NOT EXISTS keaflow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE keaflow;

SET FOREIGN_KEY_CHECKS = 0;
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ============================================================
--  1. CLIENTES
-- ============================================================

CREATE TABLE clients (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255)     NULL,
  cpf_cnpj    VARCHAR(20)      NULL,
  phone       VARCHAR(20)      NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  UNIQUE KEY (email),
  UNIQUE KEY (cpf_cnpj)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci
  ROW_FORMAT=DYNAMIC;

-- ============================================================
--  2. ORÇAMENTOS
-- ============================================================

CREATE TABLE quotes (
  id                CHAR(36)     NOT NULL DEFAULT (UUID()),
  client_id         CHAR(36)     NOT NULL,
  service_type      ENUM('WEB','BI','MINI_SITE','AI_AGENT') NOT NULL,
  status            ENUM('PENDING','APPROVED','REJECTED')   NOT NULL DEFAULT 'PENDING',
  description       TEXT             NULL,
  setup_value       DECIMAL(10,2)    NOT NULL,
  monthly_value     DECIMAL(10,2)    NOT NULL,
  asaas_customer_id VARCHAR(100)     NULL COMMENT 'ID do customer no Asaas',
  asaas_charge_id   VARCHAR(100)     NULL COMMENT 'ID da cobrança no Asaas',
  created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  INDEX (client_id),
  INDEX (status),
  INDEX (service_type),
  INDEX (created_at DESC)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci
  ROW_FORMAT=DYNAMIC;

-- ============================================================
--  3. BREAKDOWN DE PREÇOS
-- ============================================================

CREATE TABLE quote_breakdown (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  quote_id   CHAR(36)        NOT NULL,
  item_key   VARCHAR(100)    NOT NULL COMMENT 'ex: base, extraMenus, n8nAutomation, hosting',
  item_value DECIMAL(10,2)   NOT NULL,

  PRIMARY KEY (id),
  INDEX (quote_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
--  4. DETALHES — SERVIÇO WEB
-- ============================================================

CREATE TABLE quote_detail_web (
  quote_id                  CHAR(36)   NOT NULL,
  menu_count                TINYINT    NOT NULL DEFAULT 6,
  include_asaas_integration TINYINT(1) NOT NULL DEFAULT 0,

  PRIMARY KEY (quote_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
--  5. DETALHES — MINI SITE
-- ============================================================

CREATE TABLE quote_detail_mini_site (
  quote_id                CHAR(36)   NOT NULL,
  page_count              TINYINT    NOT NULL DEFAULT 3,
  include_instagram       TINYINT(1) NOT NULL DEFAULT 0,
  include_whatsapp_button TINYINT(1) NOT NULL DEFAULT 0,

  PRIMARY KEY (quote_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
--  6. DETALHES — BUSINESS INTELLIGENCE
-- ============================================================

CREATE TABLE quote_detail_bi (
  quote_id   CHAR(36)                    NOT NULL,
  complexity ENUM('standard','advanced') NOT NULL DEFAULT 'standard',

  PRIMARY KEY (quote_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

-- Fontes de dados BI (multi-select)
CREATE TABLE quote_bi_sources (
  id       BIGINT UNSIGNED                NOT NULL AUTO_INCREMENT,
  quote_id CHAR(36)                       NOT NULL,
  source   ENUM('excel','api','database') NOT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY (quote_id, source),
  INDEX (quote_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
--  7. DETALHES — AI AGENT
-- ============================================================

CREATE TABLE quote_detail_ai_agent (
  quote_id      CHAR(36)                                  NOT NULL,
  plan          ENUM('free','starter','pro','enterprise') NOT NULL DEFAULT 'free',
  agent_count   TINYINT                                   NOT NULL DEFAULT 1,
  include_rag   TINYINT(1)                                NOT NULL DEFAULT 0,
  include_voice TINYINT(1)                                NOT NULL DEFAULT 0,

  PRIMARY KEY (quote_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
--  8. MÓDULOS ADICIONAIS
-- ============================================================

CREATE TABLE quote_modules (
  quote_id              CHAR(36)         NOT NULL,
  n8n_automation        TINYINT(1)       NOT NULL DEFAULT 0,
  whatsapp_gateway      TINYINT(1)       NOT NULL DEFAULT 0,
  agile_setup           TINYINT(1)       NOT NULL DEFAULT 0,
  agile_mentoring_hours TINYINT UNSIGNED NOT NULL DEFAULT 0,
  hosting_plan          ENUM('single','premium','business','vps-starter','vps-pro','vps-ultra') NULL DEFAULT NULL,

  PRIMARY KEY (quote_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
--  9. HISTÓRICO DE STATUS
-- ============================================================

CREATE TABLE quote_status_history (
  id          BIGINT UNSIGNED                         NOT NULL AUTO_INCREMENT,
  quote_id    CHAR(36)                                NOT NULL,
  from_status ENUM('PENDING','APPROVED','REJECTED')       NULL COMMENT 'NULL = criação',
  to_status   ENUM('PENDING','APPROVED','REJECTED')   NOT NULL,
  note        TEXT                                        NULL,
  changed_at  DATETIME(3)                             NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  INDEX (quote_id),
  INDEX (changed_at DESC)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci
  ROW_FORMAT=DYNAMIC;

-- ============================================================
--  10. CHAT — SESSÕES
-- ============================================================

CREATE TABLE chat_sessions (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()),
  client_id  CHAR(36)         NULL COMMENT 'NULL = visitante anônimo',
  quote_id   CHAR(36)         NULL COMMENT 'Orçamento gerado a partir desta conversa',
  agent_name VARCHAR(100) NOT NULL DEFAULT 'Kea',
  agent_role VARCHAR(100) NOT NULL DEFAULT 'Consultora Comercial',
  agent_tone ENUM('formal','friendly','technical','consultive') NOT NULL DEFAULT 'consultive',
  llm_model  VARCHAR(100) NOT NULL DEFAULT 'gemini-2.0-flash',
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  INDEX (client_id),
  INDEX (created_at DESC)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
--  11. CHAT — MENSAGENS
-- ============================================================

CREATE TABLE chat_messages (
  id         BIGINT UNSIGNED      NOT NULL AUTO_INCREMENT,
  session_id CHAR(36)             NOT NULL,
  role       ENUM('user','model') NOT NULL,
  content    TEXT                 NOT NULL,
  sent_at    DATETIME(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  INDEX (session_id),
  INDEX (sent_at ASC)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci
  ROW_FORMAT=DYNAMIC;

-- ============================================================
--  12. CONFIGURAÇÕES DO SISTEMA
-- ============================================================

CREATE TABLE system_settings (
  setting_key   VARCHAR(100) NOT NULL,
  setting_value VARCHAR(500) NOT NULL,
  description   VARCHAR(255)     NULL,
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (setting_key)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
--  13. PERFIL DO AGENTE COMERCIAL
-- ============================================================

CREATE TABLE agent_profiles (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  name          VARCHAR(100) NOT NULL DEFAULT 'Kea',
  company       VARCHAR(100) NOT NULL DEFAULT 'KeaLabs',
  role          VARCHAR(100) NOT NULL DEFAULT 'Consultora Comercial',
  tone          ENUM('formal','friendly','technical','consultive') NOT NULL DEFAULT 'consultive',
  llm_model     VARCHAR(100) NOT NULL DEFAULT 'gemini-2.0-flash',
  services      TEXT         NOT NULL,
  objections    TEXT         NOT NULL,
  closing_style TEXT         NOT NULL,
  system_prompt TEXT             NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci
  ROW_FORMAT=DYNAMIC;

-- ============================================================
--  VIEWS
-- ============================================================

CREATE OR REPLACE VIEW vw_quotes_full AS
SELECT
  q.id                AS quote_id,
  q.service_type,
  q.status,
  q.setup_value,
  q.monthly_value,
  q.description,
  q.asaas_customer_id,
  q.asaas_charge_id,
  q.created_at,
  q.updated_at,
  c.id                AS client_id,
  c.name              AS client_name,
  c.email             AS client_email,
  c.cpf_cnpj          AS client_cpf_cnpj,
  c.phone             AS client_phone
FROM quotes q
INNER JOIN clients c ON c.id = q.client_id;

CREATE OR REPLACE VIEW vw_quotes_breakdown AS
SELECT
  q.id          AS quote_id,
  c.name        AS client_name,
  q.service_type,
  q.status,
  q.setup_value,
  q.monthly_value,
  GROUP_CONCAT(
    CONCAT(b.item_key, ': R$ ', FORMAT(b.item_value, 2, 'pt_BR'))
    ORDER BY b.id
    SEPARATOR ' | '
  )             AS breakdown_summary,
  q.created_at
FROM quotes q
INNER JOIN clients c ON c.id = q.client_id
LEFT  JOIN quote_breakdown b ON b.quote_id = q.id
GROUP BY q.id, c.name, q.service_type, q.status, q.setup_value, q.monthly_value, q.created_at;

CREATE OR REPLACE VIEW vw_metrics_by_service AS
SELECT
  service_type,
  COUNT(*)                     AS total_quotes,
  SUM(status = 'APPROVED')     AS approved,
  SUM(status = 'REJECTED')     AS rejected,
  SUM(status = 'PENDING')      AS pending,
  ROUND(AVG(setup_value),   2) AS avg_setup,
  ROUND(SUM(setup_value),   2) AS total_setup_value,
  ROUND(SUM(monthly_value), 2) AS total_monthly_value
FROM quotes
GROUP BY service_type;

CREATE OR REPLACE VIEW vw_metrics_monthly AS
SELECT
  DATE_FORMAT(created_at, '%Y-%m')  AS month,
  COUNT(*)                          AS total_quotes,
  SUM(status = 'APPROVED')          AS approved,
  ROUND(SUM(setup_value),   2)      AS total_setup_value,
  ROUND(SUM(monthly_value), 2)      AS total_monthly_value
FROM quotes
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY month DESC;

-- ============================================================
--  TRIGGERS
-- ============================================================

DELIMITER $$

CREATE TRIGGER trg_quotes_after_insert
AFTER INSERT ON quotes
FOR EACH ROW
BEGIN
  INSERT INTO quote_status_history (quote_id, from_status, to_status, note)
  VALUES (NEW.id, NULL, NEW.status, 'Orçamento criado');
END$$

CREATE TRIGGER trg_quotes_after_update
AFTER UPDATE ON quotes
FOR EACH ROW
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO quote_status_history (quote_id, from_status, to_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
END$$

DELIMITER ;

-- ============================================================
--  SEED — DADOS INICIAIS
-- ============================================================

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('web_base',                 '3000',   'Valor base setup Site Web'),
  ('web_free_menus',           '6',      'Menus incluídos no Web'),
  ('web_extra_menu_price',     '300',    'Preço por menu extra Web'),
  ('web_asaas_integration',    '1000',   'Integração Asaas no Web'),
  ('mini_site_base',           '1200',   'Valor base setup Mini Site'),
  ('mini_site_free_pages',     '3',      'Páginas incluídas no Mini Site'),
  ('mini_site_extra_page',     '200',    'Preço por página extra Mini Site'),
  ('mini_site_instagram',      '600',    'Integração Instagram'),
  ('mini_site_whatsapp',       '200',    'Botão WhatsApp'),
  ('bi_excel',                 '2000',   'Fonte Excel BI'),
  ('bi_api',                   '3500',   'Fonte API BI'),
  ('bi_database',              '5000',   'Fonte Database BI'),
  ('bi_advanced_multiplier',   '1.3',    'Multiplicador complexidade Advanced'),
  ('agent_free_setup',         '800',    'AI Agent Free — setup'),
  ('agent_free_monthly',       '0',      'AI Agent Free — mensalidade'),
  ('agent_starter_setup',      '1800',   'AI Agent Starter — setup'),
  ('agent_starter_monthly',    '149',    'AI Agent Starter — mensalidade'),
  ('agent_pro_setup',          '3500',   'AI Agent Pro — setup'),
  ('agent_pro_monthly',        '349',    'AI Agent Pro — mensalidade'),
  ('agent_enterprise_setup',   '8000',   'AI Agent Enterprise — setup'),
  ('agent_enterprise_monthly', '799',    'AI Agent Enterprise — mensalidade'),
  ('agent_extra_agent_price',  '400',    'Preço por agente extra'),
  ('agent_rag',                '1200',   'Add-on RAG'),
  ('agent_voice',              '900',    'Add-on Canal de Voz'),
  ('module_n8n',               '1200',   'Módulo n8n Automation'),
  ('module_whatsapp',          '900',    'Módulo WhatsApp Gateway'),
  ('module_agile_setup',       '1500',   'Módulo Agile Setup'),
  ('module_mentoring_hour',    '200',    'Mentoria Ágil por hora'),
  ('monthly_support_rate',     '0.1',    'Taxa suporte mensal % do setup'),
  ('hosting_single',           '12.99',  'Hospedagem Single/mês'),
  ('hosting_premium',          '17.99',  'Hospedagem Premium/mês'),
  ('hosting_business',         '26.99',  'Hospedagem Business/mês'),
  ('hosting_vps_starter',      '49.90',  'VPS Starter/mês'),
  ('hosting_vps_pro',          '89.90',  'VPS Pro/mês'),
  ('hosting_vps_ultra',        '149.90', 'VPS Ultra/mês');

INSERT INTO agent_profiles
  (name, company, role, tone, llm_model, services, objections, closing_style, system_prompt, is_active)
VALUES (
  'Kea',
  'KeaLabs',
  'Consultora Comercial',
  'consultive',
  'gemini-2.0-flash',
  'Sites Web, Mini Sites com Instagram, Business Intelligence, AI Agents',
  'Reconheça a objeção, valide a preocupação do cliente e reposicione o valor antes do preço.',
  'Proponha um próximo passo concreto: agendar uma call, enviar uma proposta ou iniciar um projeto piloto.',
  NULL,
  1
);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  FIM DO SCHEMA
-- ============================================================
