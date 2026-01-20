-- ============================================
-- FASE 1: ESTRUTURA PRE_FOLLOWUP
-- ============================================

-- Criar tabela pre_followup
CREATE TABLE pre_followup (
  -- Identificação
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES agent_conversations(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES julia_agents(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  remote_jid text NOT NULL,
  
  -- Dados da mensagem do agente
  agent_message_id text,
  agent_message_content text,
  agent_message_sent_at timestamptz NOT NULL DEFAULT now(),
  
  -- Controle de status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'cancelled', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Expiração e cancelamento
  expires_at timestamptz NOT NULL DEFAULT (now() + INTERVAL '48 hours'),
  cancelled_at timestamptz,
  cancelled_reason text,
  processed_at timestamptz,
  
  -- Metadados para auditoria
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Índices para performance
CREATE INDEX idx_pre_followup_conversation ON pre_followup(conversation_id);
CREATE INDEX idx_pre_followup_client_agent ON pre_followup(client_id, agent_id);
CREATE INDEX idx_pre_followup_status ON pre_followup(status) WHERE status = 'pending';
CREATE INDEX idx_pre_followup_trigger_check ON pre_followup(created_at, status, client_id) 
  WHERE status = 'pending';
CREATE INDEX idx_pre_followup_expires ON pre_followup(expires_at) 
  WHERE status = 'pending';

-- Constraint para evitar múltiplos registros pendentes
CREATE UNIQUE INDEX idx_unique_pending_pre_followup 
  ON pre_followup(conversation_id) 
  WHERE status = 'pending';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_pre_followup_updated_at
  BEFORE UPDATE ON pre_followup
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE pre_followup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage pre_followup"
  ON pre_followup FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view their client pre_followup"
  ON pre_followup FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::user_role) 
    OR client_id = get_user_client_id(auth.uid())
  );