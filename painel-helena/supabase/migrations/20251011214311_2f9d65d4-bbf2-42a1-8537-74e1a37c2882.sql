-- =====================================================
-- SISTEMA DE CONTRATAÇÃO DE PLANOS COM VERIFICAÇÃO WHATSAPP
-- + MELHORIAS: Pagamento Recorrente, Dashboard Público, Autoaprovação, Multi-Gateway
-- =====================================================

-- =====================================================
-- 1. TABELA PRINCIPAL: subscription_requests
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscription_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE RESTRICT NOT NULL,
  full_name TEXT NOT NULL,
  cpf_cnpj TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp_phone TEXT NOT NULL,
  verification_code TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_sent_at TIMESTAMPTZ,
  verification_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'pending_payment', 'payment_confirmed', 'completed', 'rejected')),
  payment_provider TEXT DEFAULT 'asaas',
  asaas_customer_id TEXT,
  asaas_payment_id TEXT,
  payment_data JSONB DEFAULT '{}',
  rejection_reason TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_subscription_requests_status ON public.subscription_requests(status);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_email ON public.subscription_requests(email);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_cpf_cnpj ON public.subscription_requests(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_verification_code ON public.subscription_requests(verification_code) WHERE verification_code IS NOT NULL;

-- RLS Policies
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create subscription requests"
  ON public.subscription_requests
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update subscription requests"
  ON public.subscription_requests
  FOR UPDATE
  USING (true);

CREATE POLICY "Admins can view all subscription requests"
  ON public.subscription_requests
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- 2. TABELA: subscription_request_tracking (Dashboard Público)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscription_request_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.subscription_requests(id) ON DELETE CASCADE NOT NULL,
  tracking_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracking_token ON public.subscription_request_tracking(tracking_token);
CREATE INDEX IF NOT EXISTS idx_tracking_request_id ON public.subscription_request_tracking(request_id);

-- RLS Policies
ALTER TABLE public.subscription_request_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tracking with valid token"
  ON public.subscription_request_tracking
  FOR SELECT
  USING (expires_at > now());

-- =====================================================
-- 3. ATUALIZAR asaas_subscriptions (Pagamento Recorrente)
-- =====================================================
ALTER TABLE public.asaas_subscriptions 
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS grace_period_days INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS auto_suspend_on_failure BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_attempt TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'asaas';

-- =====================================================
-- 4. TABELA: subscription_payment_history
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscription_payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.asaas_subscriptions(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  payment_attempt_date TIMESTAMPTZ DEFAULT now(),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('success', 'failed', 'pending')),
  payment_provider TEXT DEFAULT 'asaas',
  provider_payment_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  failure_reason TEXT,
  retry_number INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_subscription ON public.subscription_payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_client ON public.subscription_payment_history(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON public.subscription_payment_history(payment_status);

-- RLS Policies
ALTER TABLE public.subscription_payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all payment history"
  ON public.subscription_payment_history
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view their payment history"
  ON public.subscription_payment_history
  FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "System can insert payment history"
  ON public.subscription_payment_history
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 5. ATUALIZAR asaas_config (Autoaprovação)
-- =====================================================
ALTER TABLE public.asaas_config
  ADD COLUMN IF NOT EXISTS auto_approve_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_approve_max_value NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS auto_approve_plan_whitelist JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS auto_renew_default BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS default_grace_period_days INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS max_payment_retries INTEGER DEFAULT 3;

-- =====================================================
-- 6. TABELA: approval_audit_log
-- =====================================================
CREATE TABLE IF NOT EXISTS public.approval_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.subscription_requests(id) ON DELETE CASCADE NOT NULL,
  approval_type TEXT NOT NULL CHECK (approval_type IN ('automatic', 'manual')),
  approved_by UUID REFERENCES auth.users(id),
  approval_criteria_met JSONB DEFAULT '{}',
  approved_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_request ON public.approval_audit_log(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_type ON public.approval_audit_log(approval_type);

-- RLS Policies
ALTER TABLE public.approval_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view approval audit log"
  ON public.approval_audit_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit log"
  ON public.approval_audit_log
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 7. TABELA: payment_providers (Multi-Gateway)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payment_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  supported_payment_methods JSONB DEFAULT '[]',
  webhook_secret TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir providers padrão
INSERT INTO public.payment_providers (name, display_name, is_active, is_default, supported_payment_methods)
VALUES 
  ('asaas', 'Asaas', true, true, '["pix", "boleto", "credit_card"]'),
  ('stripe', 'Stripe', false, false, '["credit_card"]'),
  ('mercadopago', 'Mercado Pago', false, false, '["pix", "boleto", "credit_card"]')
ON CONFLICT (name) DO NOTHING;

-- RLS Policies
ALTER TABLE public.payment_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment providers"
  ON public.payment_providers
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active providers"
  ON public.payment_providers
  FOR SELECT
  USING (is_active = true);

-- =====================================================
-- 8. ATUALIZAR subscription_plans (adicionar provider preferencial)
-- =====================================================
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS preferred_payment_provider TEXT REFERENCES public.payment_providers(name);

-- =====================================================
-- 9. TRIGGERS para updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS update_subscription_requests_updated_at ON public.subscription_requests;
CREATE TRIGGER update_subscription_requests_updated_at
  BEFORE UPDATE ON public.subscription_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_providers_updated_at ON public.payment_providers;
CREATE TRIGGER update_payment_providers_updated_at
  BEFORE UPDATE ON public.payment_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 10. FUNÇÃO: Gerar código de verificação
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. FUNÇÃO: Gerar tracking token único
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..16 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;