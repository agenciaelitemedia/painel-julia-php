-- Criar tabela de pipelines (etapas do CRM)
CREATE TABLE IF NOT EXISTS public.crm_pipelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de deals (cards do CRM)
CREATE TABLE IF NOT EXISTS public.crm_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  pipeline_id UUID REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id),
  title TEXT NOT NULL,
  description TEXT,
  value DECIMAL(10, 2),
  position INTEGER NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de atividades do CRM
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies para pipelines
CREATE POLICY "Users can view their client pipelines"
  ON public.crm_pipelines FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()) OR get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Users can insert their client pipelines"
  ON public.crm_pipelines FOR INSERT
  WITH CHECK (client_id = get_user_client_id(auth.uid()) OR get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Users can update their client pipelines"
  ON public.crm_pipelines FOR UPDATE
  USING (client_id = get_user_client_id(auth.uid()) OR get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Users can delete their client pipelines"
  ON public.crm_pipelines FOR DELETE
  USING (client_id = get_user_client_id(auth.uid()) OR get_user_role(auth.uid()) = 'admin'::user_role);

-- RLS policies para deals
CREATE POLICY "Users can view their client deals"
  ON public.crm_deals FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()) OR get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Users can insert their client deals"
  ON public.crm_deals FOR INSERT
  WITH CHECK (client_id = get_user_client_id(auth.uid()) OR get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Users can update their client deals"
  ON public.crm_deals FOR UPDATE
  USING (client_id = get_user_client_id(auth.uid()) OR get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Users can delete their client deals"
  ON public.crm_deals FOR DELETE
  USING (client_id = get_user_client_id(auth.uid()) OR get_user_role(auth.uid()) = 'admin'::user_role);

-- RLS policies para activities
CREATE POLICY "Users can view their client activities"
  ON public.crm_activities FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()) OR get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Users can insert their client activities"
  ON public.crm_activities FOR INSERT
  WITH CHECK (client_id = get_user_client_id(auth.uid()) OR get_user_role(auth.uid()) = 'admin'::user_role);

-- Criar índices para melhor performance
CREATE INDEX idx_crm_pipelines_client_id ON public.crm_pipelines(client_id);
CREATE INDEX idx_crm_deals_client_id ON public.crm_deals(client_id);
CREATE INDEX idx_crm_deals_pipeline_id ON public.crm_deals(pipeline_id);
CREATE INDEX idx_crm_deals_contact_id ON public.crm_deals(contact_id);
CREATE INDEX idx_crm_activities_deal_id ON public.crm_activities(deal_id);

-- Trigger para updated_at
CREATE TRIGGER update_crm_pipelines_updated_at
  BEFORE UPDATE ON public.crm_pipelines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_deals_updated_at
  BEFORE UPDATE ON public.crm_deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();