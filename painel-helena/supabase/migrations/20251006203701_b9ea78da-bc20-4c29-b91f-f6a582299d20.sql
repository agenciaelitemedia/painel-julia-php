-- Criar tabela julia_queue_logs para armazenar logs dos JSONs enviados ao RabbitMQ
CREATE TABLE public.julia_queue_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação do agente
  cod_agente TEXT NOT NULL,
  agent_id UUID NOT NULL REFERENCES public.julia_agents(id) ON DELETE CASCADE,
  
  -- Identificação da mensagem
  message_id TEXT NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  
  -- Dados da mensagem
  message_text TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  message_from_me BOOLEAN NOT NULL DEFAULT false,
  message_url TEXT,
  
  -- Dados do destinatário/remetente
  remote_jid TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  
  -- Dados da instância WhatsApp
  phone_number TEXT NOT NULL,
  instance_code TEXT NOT NULL,
  
  -- JSON completo enviado
  json_payload JSONB NOT NULL,
  
  -- Status do envio
  sent_to_rabbitmq BOOLEAN NOT NULL DEFAULT false,
  rabbitmq_queue_name TEXT,
  error_message TEXT,
  
  -- Auditoria
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

-- Índices para otimizar consultas
CREATE INDEX idx_julia_queue_logs_cod_agente ON public.julia_queue_logs(cod_agente);
CREATE INDEX idx_julia_queue_logs_agent_id ON public.julia_queue_logs(agent_id);
CREATE INDEX idx_julia_queue_logs_message_id ON public.julia_queue_logs(message_id);
CREATE INDEX idx_julia_queue_logs_client_id ON public.julia_queue_logs(client_id);
CREATE INDEX idx_julia_queue_logs_created_at ON public.julia_queue_logs(created_at DESC);
CREATE INDEX idx_julia_queue_logs_sent_to_rabbitmq ON public.julia_queue_logs(sent_to_rabbitmq, created_at DESC);

-- Comentários para documentação
COMMENT ON TABLE public.julia_queue_logs IS 'Log de todos os JSONs enviados para o RabbitMQ pelos agentes Julia';
COMMENT ON COLUMN public.julia_queue_logs.cod_agente IS 'Código do agente Julia (selected_julia_code)';
COMMENT ON COLUMN public.julia_queue_logs.json_payload IS 'JSON completo enviado para o RabbitMQ';
COMMENT ON COLUMN public.julia_queue_logs.sent_to_rabbitmq IS 'Indica se o JSON foi enviado com sucesso para o RabbitMQ';

-- Habilitar RLS
ALTER TABLE public.julia_queue_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can view all julia queue logs"
  ON public.julia_queue_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Clients can view their julia queue logs"
  ON public.julia_queue_logs
  FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Service role can insert julia queue logs"
  ON public.julia_queue_logs
  FOR INSERT
  WITH CHECK (true);