-- Criar tabela de vínculo User-Agent
CREATE TABLE user_julia_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cod_agent TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, cod_agent)
);

-- Índices para performance
CREATE INDEX idx_user_julia_agents_user_id ON user_julia_agents(user_id);
CREATE INDEX idx_user_julia_agents_cod_agent ON user_julia_agents(cod_agent);

-- RLS Policies
ALTER TABLE user_julia_agents ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar todos
CREATE POLICY "Admins can manage all user_julia_agents"
  ON user_julia_agents FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Users podem ver seus próprios vínculos
CREATE POLICY "Users can view their own agents"
  ON user_julia_agents FOR SELECT
  USING (user_id = auth.uid());

-- Função para obter cod_agents de um usuário
CREATE OR REPLACE FUNCTION get_user_cod_agents(p_user_id UUID)
RETURNS TEXT[] 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(cod_agent)
  FROM user_julia_agents
  WHERE user_id = p_user_id;
$$;

-- Função para verificar se user tem acesso a um cod_agent específico
CREATE OR REPLACE FUNCTION user_has_cod_agent_access(p_user_id UUID, p_cod_agent TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_julia_agents
    WHERE user_id = p_user_id AND cod_agent = p_cod_agent
  );
$$;