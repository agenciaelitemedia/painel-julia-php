-- FASE 1: Estrutura de Dados para Sistema Completo de Tickets

-- 1.1 Adicionar campo de nível de suporte nos setores
ALTER TABLE ticket_sectors ADD COLUMN IF NOT EXISTS support_level text DEFAULT 'n1';
COMMENT ON COLUMN ticket_sectors.support_level IS 'Nível de suporte: n1, n2, n3';

-- 1.2 Adicionar campo de nível de suporte nos membros da equipe
ALTER TABLE ticket_team_members ADD COLUMN IF NOT EXISTS support_level text DEFAULT 'n1';
COMMENT ON COLUMN ticket_team_members.support_level IS 'Nível de suporte do atendente: n1, n2, n3';

-- 1.3 Adicionar campos de rastreamento no ticket
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS current_level text DEFAULT 'n1';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS escalation_count integer DEFAULT 0;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS first_response_at timestamptz;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS last_customer_message_at timestamptz;

-- 1.4 Criar tabela de escalonamentos
CREATE TABLE IF NOT EXISTS ticket_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  from_sector_id uuid REFERENCES ticket_sectors(id),
  to_sector_id uuid REFERENCES ticket_sectors(id),
  from_user_id text,
  from_user_name text,
  to_user_id text,
  to_user_name text,
  from_level text,
  to_level text,
  escalation_type text DEFAULT 'manual', -- manual, automatic, transfer
  reason text,
  escalated_by_id text NOT NULL,
  escalated_by_name text,
  created_at timestamptz DEFAULT now()
);

-- Índices para escalations
CREATE INDEX IF NOT EXISTS idx_ticket_escalations_ticket_id ON ticket_escalations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_escalations_created_at ON ticket_escalations(created_at DESC);

-- 1.5 Criar tabela de notificações de ticket
CREATE TABLE IF NOT EXISTS ticket_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  count_id text NOT NULL,
  notification_type text NOT NULL, -- created, updated, resolved, escalated, comment
  channel text DEFAULT 'whatsapp',
  recipient_phone text,
  recipient_name text,
  message text NOT NULL,
  status text DEFAULT 'pending', -- pending, sent, failed
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_ticket_notifications_ticket_id ON ticket_notifications(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_notifications_status ON ticket_notifications(status);
CREATE INDEX IF NOT EXISTS idx_ticket_notifications_created_at ON ticket_notifications(created_at DESC);

-- 1.6 Criar tabela de configuração de templates de notificação
CREATE TABLE IF NOT EXISTS ticket_notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id text NOT NULL,
  notification_type text NOT NULL, -- created, updated, resolved, escalated
  is_enabled boolean DEFAULT true,
  template_message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(count_id, notification_type)
);

-- Índice para templates
CREATE INDEX IF NOT EXISTS idx_ticket_notification_templates_count_id ON ticket_notification_templates(count_id);

-- Enable RLS on new tables
ALTER TABLE ticket_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_notification_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ticket_escalations (permitir acesso via service role)
CREATE POLICY "Allow all access to ticket_escalations" ON ticket_escalations FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for ticket_notifications
CREATE POLICY "Allow all access to ticket_notifications" ON ticket_notifications FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for ticket_notification_templates
CREATE POLICY "Allow all access to ticket_notification_templates" ON ticket_notification_templates FOR ALL USING (true) WITH CHECK (true);