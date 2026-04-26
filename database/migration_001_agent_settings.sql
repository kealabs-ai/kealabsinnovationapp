-- ============================================================
--  KeaFlow — Migration 001
--  Descrição: Configurações completas do agente, parcelamento,
--             comissão e system_prompt na sessão de chat
--  Banco: MySQL 8.0.13+
-- ============================================================

USE keaflow;

-- ============================================================
--  1. chat_sessions — adiciona system_prompt e api_key
--     (o backend precisa persistir o prompt montado pelo frontend)
-- ============================================================

ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS system_prompt MEDIUMTEXT NULL
    COMMENT 'System prompt completo enviado ao LLM nesta sessão'
    AFTER llm_model,
  ADD COLUMN IF NOT EXISTS api_key VARCHAR(255) NULL
    COMMENT 'API key usada nesta sessão (sobrescreve a do servidor)'
    AFTER system_prompt;

-- ============================================================
--  2. agent_profiles — garante que todos os campos existem
--     (compatibilidade com instâncias antigas)
-- ============================================================

ALTER TABLE agent_profiles
  MODIFY COLUMN system_prompt MEDIUMTEXT NULL
    COMMENT 'Instruções adicionais livres para o agente',
  MODIFY COLUMN services      MEDIUMTEXT NOT NULL,
  MODIFY COLUMN objections    MEDIUMTEXT NOT NULL,
  MODIFY COLUMN closing_style MEDIUMTEXT NOT NULL;

-- ============================================================
--  3. system_settings — seeds de parcelamento e comissão
--     (INSERT IGNORE para não duplicar em re-execuções)
-- ============================================================

INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
  -- Parcelamento
  ('installment_limit',              '12',   'Número máximo de parcelas'),
  ('installment_interest_rate',      '0',    'Taxa de juros base (legado)'),
  ('installment_mdr_1x',             '2.99', 'MDR cartão 1x (%)'),
  ('installment_mdr_2_6x',           '3.49', 'MDR cartão 2–6x (%)'),
  ('installment_mdr_7_12x',          '3.99', 'MDR cartão 7–12x (%)'),
  ('installment_mdr_13x',            '4.29', 'MDR cartão 13x+ (%)'),
  ('installment_taxa_fixa',          '0.49', 'Taxa fixa por transação (R$)'),
  ('installment_antecipacao_mensal', '1.7',  'Taxa de antecipação mensal (%)'),
  ('installment_ciclo_dias',         '32',   'Ciclo de liquidação em dias'),
  -- Comissão
  ('commission_rate',                '0',    'Taxa de comissão repassada ao cliente (%)');

-- ============================================================
--  4. system_settings — garante seeds das API keys
-- ============================================================

INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
  ('llm_key_gemini',    '', 'API Key Google Gemini'),
  ('llm_key_openai',    '', 'API Key OpenAI'),
  ('llm_key_groq',      '', 'API Key Groq'),
  ('llm_key_anthropic', '', 'API Key Anthropic');

-- ============================================================
--  5. agent_profiles — seed do agente padrão
--     (só insere se a tabela estiver vazia)
-- ============================================================

INSERT INTO agent_profiles
  (name, company, role, tone, llm_model, services, objections, closing_style, system_prompt, is_active)
SELECT
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
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM agent_profiles LIMIT 1);

-- ============================================================
--  6. View — sessões com dados do agente para o histórico
-- ============================================================

CREATE OR REPLACE VIEW vw_chat_sessions_full AS
SELECT
  cs.id                AS session_id,
  cs.agent_name,
  cs.agent_role,
  cs.agent_tone,
  cs.llm_model,
  cs.system_prompt,
  cs.created_at,
  cs.updated_at,
  COUNT(cm.id)         AS message_count,
  MAX(cm.sent_at)      AS last_message_at,
  -- Primeira mensagem do usuário como prévia da conversa
  (
    SELECT content FROM chat_messages
    WHERE session_id = cs.id AND role = 'user'
    ORDER BY sent_at ASC LIMIT 1
  )                    AS first_user_message
FROM chat_sessions cs
LEFT JOIN chat_messages cm ON cm.session_id = cs.id
GROUP BY
  cs.id, cs.agent_name, cs.agent_role, cs.agent_tone,
  cs.llm_model, cs.system_prompt, cs.created_at, cs.updated_at;

-- ============================================================
--  FIM DA MIGRATION 001
-- ============================================================
