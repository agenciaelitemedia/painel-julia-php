-- Criar tabela de agentes da Julia
CREATE TABLE public.julia_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  agent_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.julia_agents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their client agents"
  ON public.julia_agents
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    client_id = get_user_client_id(auth.uid())
  );

CREATE POLICY "Users can insert their client agents"
  ON public.julia_agents
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::user_role) OR 
    client_id = get_user_client_id(auth.uid())
  );

CREATE POLICY "Users can update their client agents"
  ON public.julia_agents
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    client_id = get_user_client_id(auth.uid())
  );

CREATE POLICY "Users can delete their client agents"
  ON public.julia_agents
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    client_id = get_user_client_id(auth.uid())
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_julia_agents_updated_at
  BEFORE UPDATE ON public.julia_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_julia_agents_client_id ON public.julia_agents(client_id);
CREATE INDEX idx_julia_agents_agent_code ON public.julia_agents(agent_code);