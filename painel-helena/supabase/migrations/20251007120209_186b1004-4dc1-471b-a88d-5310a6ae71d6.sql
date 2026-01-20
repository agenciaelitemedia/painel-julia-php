-- Fase 1: Infraestrutura Base - Schemas do Sistema SaaS de Agentes IA

-- 1. Tabela de configuração de modelos IA (Admin only)
CREATE TABLE ai_models_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'openai',
  model_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  max_tokens INTEGER DEFAULT 4096,
  temperature NUMERIC(3,2) DEFAULT 0.7,
  pricing_per_1k_input NUMERIC(10,4),
  pricing_per_1k_output NUMERIC(10,4),
  capabilities JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir modelos OpenAI padrões
INSERT INTO ai_models_config (provider, model_name, display_name, description, is_default, max_tokens, temperature, pricing_per_1k_input, pricing_per_1k_output, capabilities) VALUES
('openai', 'gpt-4o', 'GPT-4o', 'Modelo mais avançado da OpenAI com visão e raciocínio superior', true, 4096, 0.7, 2.50, 10.00, '{"vision": true, "function_calling": true}'::jsonb),
('openai', 'gpt-4o-mini', 'GPT-4o Mini', 'Versão compacta e rápida do GPT-4o com melhor custo-benefício', false, 4096, 0.7, 0.15, 0.60, '{"vision": true, "function_calling": true}'::jsonb),
('openai', 'gpt-4-turbo', 'GPT-4 Turbo', 'Modelo GPT-4 otimizado para velocidade', false, 4096, 0.7, 10.00, 30.00, '{"vision": true, "function_calling": true}'::jsonb),
('openai', 'gpt-3.5-turbo', 'GPT-3.5 Turbo', 'Modelo rápido e econômico para tarefas simples', false, 4096, 0.7, 0.50, 1.50, '{"function_calling": true}'::jsonb);

-- RLS para ai_models_config
ALTER TABLE ai_models_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage AI models"
  ON ai_models_config FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view active models"
  ON ai_models_config FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 2. Atualizar tabela julia_agents com campos de IA
ALTER TABLE julia_agents
ADD COLUMN IF NOT EXISTS ai_model_id UUID REFERENCES ai_models_config(id),
ADD COLUMN IF NOT EXISTS ai_temperature NUMERIC(3,2) DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS ai_max_tokens INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS conversation_context JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS system_instructions TEXT;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_julia_agents_ai_model ON julia_agents(ai_model_id);
CREATE INDEX IF NOT EXISTS idx_julia_agents_instance_active ON julia_agents(instance_id, is_active);

-- 3. Tabela de conversações por agente
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES julia_agents(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  client_id UUID REFERENCES clients(id) NOT NULL,
  remote_jid TEXT NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para agent_conversations
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their client conversations"
  ON agent_conversations FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR 
    client_id = get_user_client_id(auth.uid())
  );

CREATE POLICY "System can insert conversations"
  ON agent_conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    client_id = get_user_client_id(auth.uid())
  );

CREATE POLICY "System can update conversations"
  ON agent_conversations FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR 
    client_id = get_user_client_id(auth.uid())
  );

-- Índices para agent_conversations
CREATE INDEX idx_agent_conversations_agent ON agent_conversations(agent_id);
CREATE INDEX idx_agent_conversations_contact ON agent_conversations(contact_id);
CREATE INDEX idx_agent_conversations_remote_jid ON agent_conversations(remote_jid);
CREATE INDEX idx_agent_conversations_client ON agent_conversations(client_id);
CREATE INDEX idx_agent_conversations_last_msg ON agent_conversations(last_message_at DESC);

-- 4. Tabela de logs de uso (billing/métricas)
CREATE TABLE agent_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES julia_agents(id),
  client_id UUID REFERENCES clients(id) NOT NULL,
  model_used TEXT NOT NULL,
  tokens_input INTEGER NOT NULL,
  tokens_output INTEGER NOT NULL,
  cost_input NUMERIC(10,6),
  cost_output NUMERIC(10,6),
  total_cost NUMERIC(10,6),
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para agent_usage_logs
ALTER TABLE agent_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their client usage"
  ON agent_usage_logs FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR 
    client_id = get_user_client_id(auth.uid())
  );

CREATE POLICY "System can insert usage logs"
  ON agent_usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Índices para relatórios
CREATE INDEX idx_agent_usage_client ON agent_usage_logs(client_id, created_at DESC);
CREATE INDEX idx_agent_usage_agent ON agent_usage_logs(agent_id, created_at DESC);
CREATE INDEX idx_agent_usage_date ON agent_usage_logs(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_agent_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_conversations_updated_at
  BEFORE UPDATE ON agent_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_conversations_updated_at();

-- Comentários nas tabelas
COMMENT ON TABLE ai_models_config IS 'Configuração global dos modelos de IA disponíveis (Admin only)';
COMMENT ON TABLE agent_conversations IS 'Histórico de conversações por agente para contexto';
COMMENT ON TABLE agent_usage_logs IS 'Logs de uso de tokens e custos para billing e métricas';