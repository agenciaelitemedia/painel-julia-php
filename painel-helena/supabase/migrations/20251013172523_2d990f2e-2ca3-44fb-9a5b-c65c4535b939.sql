-- Criar tabela para logs do webhook
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Identificação
  event_type TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'uazap',
  
  -- Resolução
  instance_token TEXT,
  resolved_client_id UUID REFERENCES public.clients(id),
  resolved_instance_id UUID REFERENCES public.whatsapp_instances(id),
  resolution_method TEXT,
  
  -- Dados da mensagem
  phone TEXT,
  remote_jid TEXT,
  contact_name TEXT,
  message_type TEXT,
  is_from_me BOOLEAN,
  is_group BOOLEAN,
  
  -- Payload completo
  request_headers JSONB DEFAULT '{}'::jsonb,
  request_body JSONB NOT NULL,
  
  -- Status do processamento
  processing_status TEXT NOT NULL DEFAULT 'received',
  error_message TEXT,
  
  -- Métricas
  processing_time_ms INTEGER,
  
  -- Índices para busca
  created_at_idx TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todos os logs
CREATE POLICY "Admins can view all webhook logs"
ON public.webhook_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role));

-- Clients podem ver seus próprios logs
CREATE POLICY "Clients can view their webhook logs"
ON public.webhook_logs
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR resolved_client_id = get_user_client_id(auth.uid())
);

-- Sistema pode inserir logs
CREATE POLICY "System can insert webhook logs"
ON public.webhook_logs
FOR INSERT
WITH CHECK (true);

-- Criar índices para performance
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_client_id ON public.webhook_logs(resolved_client_id);
CREATE INDEX idx_webhook_logs_phone ON public.webhook_logs(phone);
CREATE INDEX idx_webhook_logs_event_type ON public.webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_status ON public.webhook_logs(processing_status);