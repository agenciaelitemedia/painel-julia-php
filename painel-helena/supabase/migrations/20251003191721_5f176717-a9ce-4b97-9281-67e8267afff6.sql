-- Criar tabela para gerenciar metadados dos módulos do sistema
CREATE TABLE IF NOT EXISTS public.system_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_modules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage system modules"
  ON public.system_modules
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view active modules"
  ON public.system_modules
  FOR SELECT
  USING (is_active = true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_system_modules_updated_at
  BEFORE UPDATE ON public.system_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir módulos padrão
INSERT INTO public.system_modules (module_key, label, description, icon_name, display_order) VALUES
  ('chat', 'Atendimentos', 'Gerenciar conversas do WhatsApp', 'MessageSquare', 1),
  ('contacts', 'Contatos', 'Gerenciar contatos', 'Contact', 2),
  ('crm', 'CRM', 'Gerenciar pipeline e negócios', 'Users', 3),
  ('connections', 'Conexões', 'Gerenciar instâncias do WhatsApp', 'Smartphone', 4),
  ('settings', 'Ajustes', 'Configurações do sistema', 'Settings', 5),
  ('webhook', 'Webhook', 'Configurar webhooks', 'Zap', 6),
  ('team', 'Minha Equipe', 'Gerenciar membros da equipe', 'UserCog', 7),
  ('help', 'Ajuda', 'Acessar central de ajuda', 'HelpCircle', 8)
ON CONFLICT (module_key) DO NOTHING;