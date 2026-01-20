-- 003_rls_policies.sql
-- Políticas RLS alinhadas ao app

-- Clients
DO $$ BEGIN
  DROP POLICY IF EXISTS clients_admin_all ON public.clients;
  DROP POLICY IF EXISTS clients_client_select ON public.clients;
EXCEPTION WHEN undefined_object THEN null; END $$;

CREATE POLICY clients_admin_all ON public.clients
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY clients_client_select ON public.clients
  FOR SELECT
  USING (id = public.get_user_client_id(auth.uid()));

-- Client permissions
DO $$ BEGIN
  DROP POLICY IF EXISTS client_permissions_admin_all ON public.client_permissions;
  DROP POLICY IF EXISTS client_permissions_client_select ON public.client_permissions;
EXCEPTION WHEN undefined_object THEN null; END $$;

CREATE POLICY client_permissions_admin_all ON public.client_permissions
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY client_permissions_client_select ON public.client_permissions
  FOR SELECT
  USING (client_id = public.get_user_client_id(auth.uid()));

-- Client plan history
DO $$ BEGIN
  DROP POLICY IF EXISTS cph_admin_select ON public.client_plan_history;
  DROP POLICY IF EXISTS cph_client_select ON public.client_plan_history;
  DROP POLICY IF EXISTS cph_system_insert ON public.client_plan_history;
EXCEPTION WHEN undefined_object THEN null; END $$;

CREATE POLICY cph_admin_select ON public.client_plan_history
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY cph_client_select ON public.client_plan_history
  FOR SELECT
  USING (client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY cph_system_insert ON public.client_plan_history
  FOR INSERT
  WITH CHECK (true);

-- Subscription requests (apenas admin; criação via função backend)
DO $$ BEGIN
  DROP POLICY IF EXISTS subreq_admin_select ON public.subscription_requests;
EXCEPTION WHEN undefined_object THEN null; END $$;

CREATE POLICY subreq_admin_select ON public.subscription_requests
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Subscription request tracking (apenas admin; criação via backend)
DO $$ BEGIN
  DROP POLICY IF EXISTS subreq_track_admin_select ON public.subscription_request_tracking;
  DROP POLICY IF EXISTS subreq_track_system_insert ON public.subscription_request_tracking;
EXCEPTION WHEN undefined_object THEN null; END $$;

CREATE POLICY subreq_track_admin_select ON public.subscription_request_tracking
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY subreq_track_system_insert ON public.subscription_request_tracking
  FOR INSERT
  WITH CHECK (true);

-- Recursos (contagens usadas na migração de plano)
DO $$ BEGIN
  DROP POLICY IF EXISTS wapp_client_select ON public.whatsapp_instances;
  DROP POLICY IF EXISTS julia_client_select ON public.julia_agents;
  DROP POLICY IF EXISTS team_client_select ON public.team_members;
EXCEPTION WHEN undefined_object THEN null; END $$;

CREATE POLICY wapp_client_select ON public.whatsapp_instances
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY julia_client_select ON public.julia_agents
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY team_client_select ON public.team_members
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR client_id = public.get_user_client_id(auth.uid()));

-- RLS já habilitado na 001
-- Observação: se necessário, crie mapeamentos em user_clients/user_roles após provisionar usuários.
