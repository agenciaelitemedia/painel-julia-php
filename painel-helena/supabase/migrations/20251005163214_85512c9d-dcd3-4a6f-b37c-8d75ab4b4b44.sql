-- Adicionar campos instance_id e agent_type na tabela julia_agents
ALTER TABLE public.julia_agents
ADD COLUMN instance_id uuid REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
ADD COLUMN agent_type text NOT NULL DEFAULT 'julia' CHECK (agent_type IN ('julia', 'custom'));

-- Criar índice para melhor performance nas consultas por instance_id
CREATE INDEX idx_julia_agents_instance_id ON public.julia_agents(instance_id);

-- Comentários explicativos
COMMENT ON COLUMN public.julia_agents.instance_id IS 'Referência à instância WhatsApp que o agente vai atender';
COMMENT ON COLUMN public.julia_agents.agent_type IS 'Tipo do agente: julia (agente completo da Julia) ou custom (personalizado pelo usuário)';