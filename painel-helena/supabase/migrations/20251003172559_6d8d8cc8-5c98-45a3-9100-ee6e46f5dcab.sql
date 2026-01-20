-- Criar enum para os módulos do sistema
CREATE TYPE public.system_module AS ENUM (
  'chat',
  'contacts',
  'crm',
  'connections',
  'settings',
  'reports'
);

-- Tabela de permissões dos clientes (quais módulos o admin liberou)
CREATE TABLE public.client_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  module system_module NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, module)
);

-- Tabela de membros da equipe do cliente
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, user_id)
);

-- Tabela de permissões dos membros da equipe
CREATE TABLE public.team_member_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  module system_module NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_member_id, module)
);

-- Índices para performance
CREATE INDEX idx_client_permissions_client ON public.client_permissions(client_id);
CREATE INDEX idx_team_members_client ON public.team_members(client_id);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);
CREATE INDEX idx_team_member_permissions_member ON public.team_member_permissions(team_member_id);

-- Enable RLS
ALTER TABLE public.client_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_member_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies para client_permissions
CREATE POLICY "Admins can manage all client permissions"
  ON public.client_permissions
  FOR ALL
  USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Clients can view their own permissions"
  ON public.client_permissions
  FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()));

-- RLS Policies para team_members
CREATE POLICY "Admins can view all team members"
  ON public.team_members
  FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Clients can manage their team members"
  ON public.team_members
  FOR ALL
  USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Team members can view their own record"
  ON public.team_members
  FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policies para team_member_permissions
CREATE POLICY "Admins can view all team permissions"
  ON public.team_member_permissions
  FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Clients can manage their team permissions"
  ON public.team_member_permissions
  FOR ALL
  USING (
    team_member_id IN (
      SELECT id FROM public.team_members 
      WHERE client_id = get_user_client_id(auth.uid())
    )
  );

CREATE POLICY "Team members can view their own permissions"
  ON public.team_member_permissions
  FOR SELECT
  USING (
    team_member_id IN (
      SELECT id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função helper para verificar se usuário tem permissão para um módulo
CREATE OR REPLACE FUNCTION public.user_has_module_permission(
  _user_id UUID,
  _module system_module
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_client_id UUID;
  user_role_val user_role;
BEGIN
  -- Admin tem acesso a tudo
  SELECT role INTO user_role_val FROM users WHERE id = _user_id;
  IF user_role_val = 'admin' THEN
    RETURN true;
  END IF;

  -- Buscar client_id do usuário
  SELECT client_id INTO user_client_id FROM users WHERE id = _user_id;
  
  IF user_client_id IS NULL THEN
    RETURN false;
  END IF;

  -- Se for role 'client', verificar permissões do cliente
  IF user_role_val = 'client' THEN
    RETURN EXISTS (
      SELECT 1 FROM client_permissions 
      WHERE client_id = user_client_id 
      AND module = _module
    );
  END IF;

  -- Se for membro da equipe, verificar permissões do membro
  RETURN EXISTS (
    SELECT 1 
    FROM team_member_permissions tmp
    JOIN team_members tm ON tm.id = tmp.team_member_id
    WHERE tm.user_id = _user_id 
    AND tm.client_id = user_client_id
    AND tmp.module = _module
    AND tm.is_active = true
  );
END;
$$;