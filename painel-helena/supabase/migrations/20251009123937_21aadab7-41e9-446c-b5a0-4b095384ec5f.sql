-- Criar tabela de configuração Asaas (Admin)
CREATE TABLE IF NOT EXISTS asaas_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_token text NOT NULL,
  wallet_id text,
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  split_config jsonb DEFAULT '{}'::jsonb,
  webhook_url text,
  whatsapp_notifications_enabled boolean DEFAULT false,
  whatsapp_instance_id uuid REFERENCES whatsapp_instances(id) ON DELETE SET NULL,
  notification_templates jsonb DEFAULT '{
    "invoice_created": "Olá {nome}! Nova fatura gerada no valor de R$ {valor}, vencimento em {data_vencimento}. {link_pagamento}",
    "payment_received": "Pagamento confirmado! Obrigado pelo pagamento da fatura {numero_fatura} no valor de R$ {valor}.",
    "payment_overdue": "Olá {nome}, sua fatura {numero_fatura} no valor de R$ {valor} está vencida desde {data_vencimento}. Por favor, regularize sua situação.",
    "subscription_created": "Sua assinatura {plano} foi ativada com sucesso! Próxima cobrança em {proxima_data}.",
    "subscription_expiring": "Sua assinatura {plano} vence em {dias} dias. Mantenha seus pagamentos em dia."
  }'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Criar tabela de integração Asaas por cliente
CREATE TABLE IF NOT EXISTS client_asaas_integration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  asaas_customer_id text,
  asaas_wallet_id text,
  split_percentage numeric(5,2) DEFAULT 0 CHECK (split_percentage >= 0 AND split_percentage <= 100),
  is_active boolean DEFAULT true,
  whatsapp_notifications_enabled boolean DEFAULT true,
  notification_phone text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

-- Criar tabela de faturas/cobranças
CREATE TABLE IF NOT EXISTS asaas_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  asaas_payment_id text UNIQUE,
  invoice_number text NOT NULL,
  description text,
  value numeric(10,2) NOT NULL CHECK (value > 0),
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'received', 'overdue', 'cancelled')),
  billing_type text NOT NULL CHECK (billing_type IN ('BOLETO', 'CREDIT_CARD', 'PIX', 'UNDEFINED')),
  invoice_url text,
  pix_qrcode text,
  pix_code text,
  payment_date timestamptz,
  split_data jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Criar tabela de assinaturas
CREATE TABLE IF NOT EXISTS asaas_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  asaas_subscription_id text UNIQUE,
  plan_name text NOT NULL,
  description text,
  value numeric(10,2) NOT NULL CHECK (value > 0),
  cycle text NOT NULL CHECK (cycle IN ('MONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY')),
  billing_type text NOT NULL CHECK (billing_type IN ('BOLETO', 'CREDIT_CARD', 'PIX')),
  next_due_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'cancelled')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Criar tabela de webhooks
CREATE TABLE IF NOT EXISTS asaas_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  payment_id text,
  subscription_id text,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Criar tabela de notificações WhatsApp
CREATE TABLE IF NOT EXISTS asaas_whatsapp_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES asaas_invoices(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES asaas_subscriptions(id) ON DELETE SET NULL,
  notification_type text NOT NULL,
  phone_number text NOT NULL,
  message_text text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  whatsapp_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_asaas_invoices_client ON asaas_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_asaas_invoices_status ON asaas_invoices(status);
CREATE INDEX IF NOT EXISTS idx_asaas_invoices_due_date ON asaas_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_asaas_subscriptions_client ON asaas_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_asaas_subscriptions_status ON asaas_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_processed ON asaas_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_asaas_notifications_client ON asaas_whatsapp_notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_asaas_notifications_status ON asaas_whatsapp_notifications(status);
CREATE INDEX IF NOT EXISTS idx_asaas_notifications_type ON asaas_whatsapp_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_asaas_notifications_created ON asaas_whatsapp_notifications(created_at DESC);

-- Triggers para updated_at
CREATE TRIGGER update_asaas_config_updated_at BEFORE UPDATE ON asaas_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_asaas_integration_updated_at BEFORE UPDATE ON client_asaas_integration
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asaas_invoices_updated_at BEFORE UPDATE ON asaas_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asaas_subscriptions_updated_at BEFORE UPDATE ON asaas_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE asaas_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_asaas_integration ENABLE ROW LEVEL SECURITY;
ALTER TABLE asaas_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE asaas_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE asaas_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE asaas_whatsapp_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para asaas_config
CREATE POLICY "Admins can view config"
  ON asaas_config FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage config"
  ON asaas_config FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Políticas RLS para client_asaas_integration
CREATE POLICY "Admins can view all integrations"
  ON client_asaas_integration FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view their integration"
  ON client_asaas_integration FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Admins can manage integrations"
  ON client_asaas_integration FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Políticas RLS para asaas_invoices
CREATE POLICY "Admins can view all invoices"
  ON asaas_invoices FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view their invoices"
  ON asaas_invoices FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Admins can manage invoices"
  ON asaas_invoices FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can create invoices"
  ON asaas_invoices FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update invoices"
  ON asaas_invoices FOR UPDATE
  USING (true);

-- Políticas RLS para asaas_subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON asaas_subscriptions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view their subscriptions"
  ON asaas_subscriptions FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Admins can manage subscriptions"
  ON asaas_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can create subscriptions"
  ON asaas_subscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update subscriptions"
  ON asaas_subscriptions FOR UPDATE
  USING (true);

-- Políticas RLS para asaas_webhooks
CREATE POLICY "Admins can view webhooks"
  ON asaas_webhooks FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert webhooks"
  ON asaas_webhooks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update webhooks"
  ON asaas_webhooks FOR UPDATE
  USING (true);

-- Políticas RLS para asaas_whatsapp_notifications
CREATE POLICY "Admins can view all notifications"
  ON asaas_whatsapp_notifications FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view their notifications"
  ON asaas_whatsapp_notifications FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "System can insert notifications"
  ON asaas_whatsapp_notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update notifications"
  ON asaas_whatsapp_notifications FOR UPDATE
  USING (true);

-- Adicionar módulo billing ao enum e tabela system_modules
DO $$ 
BEGIN
  -- Adicionar valor ao enum se não existir
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'system_module' AND e.enumlabel = 'billing') THEN
    ALTER TYPE system_module ADD VALUE 'billing';
  END IF;
END $$;

-- Inserir módulo billing
INSERT INTO system_modules (module_key, label, description, icon_name, display_order, is_active)
VALUES ('billing', 'Financeiro', 'Gestão de cobranças e assinaturas', 'dollar-sign', 11, true)
ON CONFLICT (module_key) DO NOTHING;