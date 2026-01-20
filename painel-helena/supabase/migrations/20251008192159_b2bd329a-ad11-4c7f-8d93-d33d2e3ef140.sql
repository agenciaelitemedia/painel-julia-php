-- Criar enum para status de campanha
CREATE TYPE campaign_status AS ENUM (
  'pending',
  'scheduled', 
  'running',
  'paused',
  'completed',
  'failed'
);

-- Criar enum para status de envio de registro
CREATE TYPE record_send_status AS ENUM (
  'pending',
  'sending',
  'sent',
  'failed'
);

-- Tabela de campanhas de processo
CREATE TABLE IF NOT EXISTS public.process_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  whatsapp_instance_id UUID NOT NULL REFERENCES public.whatsapp_instances(id) ON DELETE RESTRICT,
  status campaign_status NOT NULL DEFAULT 'pending',
  scheduled_start_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_records INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  batch_size INTEGER NOT NULL DEFAULT 15,
  interval_between_messages_ms INTEGER NOT NULL DEFAULT 30000,
  interval_between_batches_ms INTEGER NOT NULL DEFAULT 60000,
  message_template TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de registros individuais de processo
CREATE TABLE IF NOT EXISTS public.process_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.process_campaigns(id) ON DELETE CASCADE,
  process_number TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  process_status TEXT NOT NULL,
  message_text TEXT NOT NULL,
  send_status record_send_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_process_campaigns_client_id ON public.process_campaigns(client_id);
CREATE INDEX idx_process_campaigns_status ON public.process_campaigns(status);
CREATE INDEX idx_process_campaigns_scheduled_start ON public.process_campaigns(scheduled_start_at);
CREATE INDEX idx_process_records_campaign_id ON public.process_records(campaign_id);
CREATE INDEX idx_process_records_send_status ON public.process_records(send_status);

-- Habilitar RLS
ALTER TABLE public.process_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies para process_campaigns
CREATE POLICY "Users can view their client campaigns"
  ON public.process_campaigns
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    client_id = get_user_client_id(auth.uid())
  );

CREATE POLICY "Users can insert their client campaigns"
  ON public.process_campaigns
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::user_role) OR 
    client_id = get_user_client_id(auth.uid())
  );

CREATE POLICY "Users can update their client campaigns"
  ON public.process_campaigns
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    client_id = get_user_client_id(auth.uid())
  );

CREATE POLICY "Users can delete their client campaigns"
  ON public.process_campaigns
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    client_id = get_user_client_id(auth.uid())
  );

-- RLS Policies para process_records
CREATE POLICY "Users can view their campaign records"
  ON public.process_records
  FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM public.process_campaigns 
      WHERE client_id = get_user_client_id(auth.uid()) OR has_role(auth.uid(), 'admin'::user_role)
    )
  );

CREATE POLICY "System can insert records"
  ON public.process_records
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update records"
  ON public.process_records
  FOR UPDATE
  USING (true);

-- Trigger para atualizar updated_at em process_campaigns
CREATE TRIGGER update_process_campaigns_updated_at
  BEFORE UPDATE ON public.process_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir módulo no sistema
INSERT INTO public.system_modules (
  module_key, 
  label, 
  description, 
  icon_name, 
  display_order, 
  is_active
) VALUES (
  'process_campaigns', 
  'Andamento de Processo', 
  'Envio massivo de notificações de processos via WhatsApp',
  'FileText',
  5,
  true
) ON CONFLICT (module_key) DO NOTHING;