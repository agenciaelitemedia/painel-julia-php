-- Tabela para auditar invocações de ferramentas dos agentes
CREATE TABLE IF NOT EXISTS public.agent_tool_invocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agent_id UUID NOT NULL REFERENCES public.julia_agents(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  remote_jid TEXT NOT NULL,
  function_name TEXT NOT NULL,
  arguments JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  execution_time_ms INTEGER
);

-- Índices para performance
CREATE INDEX idx_tool_invocations_agent ON public.agent_tool_invocations(agent_id, created_at DESC);
CREATE INDEX idx_tool_invocations_conversation ON public.agent_tool_invocations(conversation_id, created_at DESC);
CREATE INDEX idx_tool_invocations_client ON public.agent_tool_invocations(client_id, created_at DESC);

-- RLS Policies
ALTER TABLE public.agent_tool_invocations ENABLE ROW LEVEL SECURITY;

-- Admins podem ver tudo
CREATE POLICY "Admins can view all tool invocations"
ON public.agent_tool_invocations
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Clientes podem ver suas próprias invocações
CREATE POLICY "Clients can view their tool invocations"
ON public.agent_tool_invocations
FOR SELECT
TO authenticated
USING (client_id = get_user_client_id(auth.uid()));

-- Sistema pode inserir (via service role ou authenticated)
CREATE POLICY "System can insert tool invocations"
ON public.agent_tool_invocations
FOR INSERT
TO authenticated
WITH CHECK (true);