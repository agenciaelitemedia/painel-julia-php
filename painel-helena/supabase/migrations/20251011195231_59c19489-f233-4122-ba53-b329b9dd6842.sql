-- Criar enums
CREATE TYPE billing_cycle AS ENUM ('monthly', 'quarterly', 'semiannual', 'annual', 'custom');
CREATE TYPE plan_change_type AS ENUM ('initial', 'upgrade', 'downgrade', 'change', 'cancellation');

-- Tabela de planos de assinatura
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações básicas
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Precificação
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
  custom_cycle_days INTEGER,
  
  -- Recursos do plano
  max_connections INTEGER NOT NULL DEFAULT 1,
  max_agents INTEGER NOT NULL DEFAULT 1,
  max_julia_agents INTEGER NOT NULL DEFAULT 1,
  max_team_members INTEGER NOT NULL DEFAULT 5,
  release_customization BOOLEAN NOT NULL DEFAULT true,
  
  -- Módulos habilitados
  enabled_modules TEXT[] NOT NULL DEFAULT '{}',
  
  -- Status e ordenação
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Configurações comerciais
  setup_fee NUMERIC(10,2) DEFAULT 0.00,
  trial_days INTEGER DEFAULT 0,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Validações
  CONSTRAINT valid_custom_cycle CHECK (
    (billing_cycle != 'custom') OR (custom_cycle_days IS NOT NULL AND custom_cycle_days > 0)
  ),
  CONSTRAINT positive_price CHECK (price >= 0),
  CONSTRAINT positive_resources CHECK (
    max_connections > 0 AND 
    max_agents > 0 AND 
    max_julia_agents >= 0 AND 
    max_team_members >= 0
  )
);

-- Índices para subscription_plans
CREATE INDEX idx_subscription_plans_active ON public.subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_order ON public.subscription_plans(display_order);
CREATE INDEX idx_subscription_plans_featured ON public.subscription_plans(is_featured) WHERE is_featured = true;

-- Tabela de histórico de mudanças de planos
CREATE TABLE public.client_plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  old_plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  new_plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  
  -- Tipo e motivo da mudança
  change_type plan_change_type NOT NULL,
  reason TEXT,
  notes TEXT,
  
  -- Valores no momento da mudança
  old_price NUMERIC(10,2),
  new_price NUMERIC(10,2),
  old_billing_cycle billing_cycle,
  new_billing_cycle billing_cycle,
  
  -- Snapshot dos recursos
  old_resources JSONB,
  new_resources JSONB,
  
  -- Dados de quem fez a mudança
  changed_by UUID REFERENCES auth.users(id),
  changed_by_role TEXT,
  
  -- Datas
  effective_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Flags
  is_automatic BOOLEAN NOT NULL DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id)
);

-- Índices para client_plan_history
CREATE INDEX idx_client_plan_history_client ON public.client_plan_history(client_id);
CREATE INDEX idx_client_plan_history_old_plan ON public.client_plan_history(old_plan_id);
CREATE INDEX idx_client_plan_history_new_plan ON public.client_plan_history(new_plan_id);
CREATE INDEX idx_client_plan_history_date ON public.client_plan_history(effective_date DESC);
CREATE INDEX idx_client_plan_history_type ON public.client_plan_history(change_type);

-- Adicionar colunas em clients
ALTER TABLE public.clients
ADD COLUMN plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
ADD COLUMN plan_started_at TIMESTAMPTZ,
ADD COLUMN plan_expires_at TIMESTAMPTZ,
ADD COLUMN next_billing_date DATE,
ADD COLUMN is_trial BOOLEAN DEFAULT false;

CREATE INDEX idx_clients_plan_id ON public.clients(plan_id);
CREATE INDEX idx_clients_plan_expires ON public.clients(plan_expires_at) WHERE plan_expires_at IS NOT NULL;
CREATE INDEX idx_clients_next_billing ON public.clients(next_billing_date);

-- RLS Policies para subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage plans"
  ON public.subscription_plans FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Everyone can view active plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

-- RLS Policies para client_plan_history
ALTER TABLE public.client_plan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all history"
  ON public.client_plan_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Clients can view their own history"
  ON public.client_plan_history FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "System can insert history"
  ON public.client_plan_history FOR INSERT
  WITH CHECK (true);

-- Trigger para updated_at em subscription_plans
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para registrar mudança de plano automaticamente
CREATE OR REPLACE FUNCTION public.register_plan_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old_plan subscription_plans%ROWTYPE;
  v_new_plan subscription_plans%ROWTYPE;
  v_change_type plan_change_type;
BEGIN
  -- Só registrar se plan_id mudou
  IF OLD.plan_id IS DISTINCT FROM NEW.plan_id THEN
    -- Buscar dados dos planos
    IF OLD.plan_id IS NOT NULL THEN
      SELECT * INTO v_old_plan FROM subscription_plans WHERE id = OLD.plan_id;
    END IF;
    
    IF NEW.plan_id IS NOT NULL THEN
      SELECT * INTO v_new_plan FROM subscription_plans WHERE id = NEW.plan_id;
    END IF;
    
    -- Determinar tipo de mudança
    IF OLD.plan_id IS NULL THEN
      v_change_type := 'initial';
    ELSIF NEW.plan_id IS NULL THEN
      v_change_type := 'cancellation';
    ELSIF v_new_plan.price > v_old_plan.price THEN
      v_change_type := 'upgrade';
    ELSIF v_new_plan.price < v_old_plan.price THEN
      v_change_type := 'downgrade';
    ELSE
      v_change_type := 'change';
    END IF;
    
    -- Inserir no histórico
    INSERT INTO client_plan_history (
      client_id,
      old_plan_id,
      new_plan_id,
      change_type,
      old_price,
      new_price,
      old_billing_cycle,
      new_billing_cycle,
      old_resources,
      new_resources,
      changed_by,
      changed_by_role,
      effective_date,
      is_automatic
    ) VALUES (
      NEW.id,
      OLD.plan_id,
      NEW.plan_id,
      v_change_type,
      v_old_plan.price,
      v_new_plan.price,
      v_old_plan.billing_cycle,
      v_new_plan.billing_cycle,
      jsonb_build_object(
        'max_connections', OLD.max_connections,
        'max_agents', OLD.max_agents,
        'max_julia_agents', OLD.max_julia_agents,
        'max_team_members', OLD.max_team_members,
        'release_customization', OLD.release_customization
      ),
      jsonb_build_object(
        'max_connections', NEW.max_connections,
        'max_agents', NEW.max_agents,
        'max_julia_agents', NEW.max_julia_agents,
        'max_team_members', NEW.max_team_members,
        'release_customization', NEW.release_customization
      ),
      auth.uid(),
      CASE 
        WHEN has_role(auth.uid(), 'admin'::user_role) THEN 'admin'
        ELSE 'client'
      END,
      now(),
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para registrar mudanças automaticamente
CREATE TRIGGER on_client_plan_change
  AFTER UPDATE OF plan_id ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.register_plan_change();