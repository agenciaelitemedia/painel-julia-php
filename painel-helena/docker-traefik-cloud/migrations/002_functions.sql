-- 002_functions.sql
-- Funções utilitárias e gatilhos

-- Atualiza coluna updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Código de verificação (6 dígitos)
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS text AS $$
DECLARE
  code text;
BEGIN
  code := lpad(((random() * 1000000)::int)::text, 6, '0');
  IF code = '000000' THEN
    code := '000001';
  END IF;
  RETURN code;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Mapeia usuário -> cliente (para RLS)
CREATE OR REPLACE FUNCTION public.get_user_client_id(p_user_id uuid)
RETURNS uuid AS $$
DECLARE
  cid uuid;
BEGIN
  SELECT uc.client_id INTO cid
  FROM public.user_clients uc
  WHERE uc.user_id = p_user_id
  LIMIT 1;
  RETURN cid;
END;
$$ LANGUAGE plpgsql STABLE;

-- Verifica papel do usuário
CREATE OR REPLACE FUNCTION public.has_role(p_user_id uuid, p_role public.user_role)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
      AND ur.role = p_role
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger para logar mudanças de plano e recursos
CREATE OR REPLACE FUNCTION public.log_client_plan_change()
RETURNS trigger AS $$
DECLARE
  v_change public.plan_change_type := 'change';
BEGIN
  IF (NEW.plan_id IS DISTINCT FROM OLD.plan_id)
     OR (NEW.max_connections IS DISTINCT FROM OLD.max_connections)
     OR (NEW.max_agents IS DISTINCT FROM OLD.max_agents)
     OR (NEW.max_julia_agents IS DISTINCT FROM OLD.max_julia_agents)
     OR (NEW.max_team_members IS DISTINCT FROM OLD.max_team_members)
     OR (NEW.release_customization IS DISTINCT FROM OLD.release_customization) THEN

    IF COALESCE((SELECT price FROM public.subscription_plans WHERE id = OLD.plan_id), 0)
       < COALESCE((SELECT price FROM public.subscription_plans WHERE id = NEW.plan_id), 0) THEN
      v_change := 'upgrade';
    ELSIF COALESCE((SELECT price FROM public.subscription_plans WHERE id = OLD.plan_id), 0)
       > COALESCE((SELECT price FROM public.subscription_plans WHERE id = NEW.plan_id), 0) THEN
      v_change := 'downgrade';
    ELSE
      v_change := 'change';
    END IF;

    INSERT INTO public.client_plan_history (
      client_id,
      old_plan_id, new_plan_id,
      old_price, new_price,
      old_billing_cycle, new_billing_cycle,
      old_resources, new_resources,
      change_type,
      effective_date,
      is_automatic,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.plan_id, NEW.plan_id,
      (SELECT price FROM public.subscription_plans WHERE id = OLD.plan_id),
      (SELECT price FROM public.subscription_plans WHERE id = NEW.plan_id),
      NULL, NULL,
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
      v_change,
      COALESCE(NEW.plan_started_at, now()),
      true,
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_clients_plan_change
  AFTER UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.log_client_plan_change();
EXCEPTION WHEN duplicate_object THEN null; END $$;
