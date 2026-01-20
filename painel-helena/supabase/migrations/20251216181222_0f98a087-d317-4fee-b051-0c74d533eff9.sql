-- Tabela para módulos extras da calculadora de preços
CREATE TABLE public.extra_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  icon_name TEXT DEFAULT 'package',
  has_quantity BOOLEAN DEFAULT false,
  quantity_label TEXT,
  price_per_unit NUMERIC(10,2),
  base_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para tipos de implementação
CREATE TABLE public.implementation_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  included_items TEXT[],
  badge_text TEXT,
  badge_color TEXT DEFAULT 'blue',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para configurações da calculadora
CREATE TABLE public.calculator_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.extra_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implementation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculator_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (sem autenticação necessária)
CREATE POLICY "Anyone can view active extra modules" 
ON public.extra_modules 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage extra modules" 
ON public.extra_modules 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Anyone can view active implementation types" 
ON public.implementation_types 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage implementation types" 
ON public.implementation_types 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Anyone can view calculator settings" 
ON public.calculator_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage calculator settings" 
ON public.calculator_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Inserir dados iniciais de módulos extras
INSERT INTO public.extra_modules (name, description, price, icon_name, has_quantity, quantity_label, price_per_unit, base_quantity, display_order) VALUES
('Atendimento Multi-canal', 'Integração com Instagram, Facebook Messenger e Telegram', 149.90, 'message-circle', false, null, null, 1, 1),
('Ramais Adicionais', 'Ramais extras para atendimento simultâneo', 29.90, 'phone', true, 'ramais', 29.90, 1, 2),
('Usuários Adicionais', 'Usuários extras para acesso ao sistema', 19.90, 'users', true, 'usuários', 19.90, 1, 3),
('Agendamento Online', 'Sistema de agendamento integrado com calendário', 99.90, 'calendar', false, null, null, 1, 4),
('CRM Avançado', 'Gestão completa de leads e pipeline de vendas', 199.90, 'briefcase', false, null, null, 1, 5),
('Relatórios Avançados', 'Dashboards e relatórios personalizados', 149.90, 'bar-chart-3', false, null, null, 1, 6),
('Automação de Follow-up', 'Sequências automáticas de mensagens', 129.90, 'repeat', false, null, null, 1, 7),
('API de Integração', 'Acesso à API para integrações customizadas', 299.90, 'code', false, null, null, 1, 8);

-- Inserir tipos de implementação
INSERT INTO public.implementation_types (name, description, price, included_items, badge_text, badge_color, display_order) VALUES
('Self-Service', 'Você mesmo configura seguindo nossa documentação', 0, ARRAY['Acesso à documentação completa', 'Vídeos tutoriais', 'Suporte via chat'], null, 'gray', 1),
('Implementação Assistida', 'Nossa equipe ajuda na configuração inicial', 497.00, ARRAY['Reunião de kickoff', 'Configuração inicial do sistema', 'Treinamento básico (2h)', 'Suporte prioritário por 30 dias'], 'Mais Popular', 'blue', 2),
('Implementação Completa', 'Implementação total com consultoria personalizada', 1497.00, ARRAY['Análise de processos', 'Configuração completa personalizada', 'Integrações customizadas', 'Treinamento completo da equipe (8h)', 'Acompanhamento por 60 dias', 'Gerente de sucesso dedicado'], 'Premium', 'amber', 3);

-- Inserir configurações da calculadora
INSERT INTO public.calculator_settings (setting_key, setting_value, description) VALUES
('openai_cost_per_1k_tokens', '{"input": 0.01, "output": 0.03}', 'Custo por 1000 tokens OpenAI (USD)'),
('meta_api_cost_per_message', '{"utility": 0.0315, "marketing": 0.0625, "service": 0.0188}', 'Custo por mensagem Meta API (USD)'),
('dollar_rate', '5.50', 'Taxa de conversão USD para BRL'),
('annual_discount_percent', '10', 'Percentual de desconto para pagamento anual'),
('avg_tokens_per_conversation', '2000', 'Média de tokens por conversa'),
('avg_messages_per_conversation', '8', 'Média de mensagens por conversa'),
('whatsapp_number', '5511999999999', 'Número do WhatsApp para contato'),
('proposal_validity_days', '15', 'Validade da proposta em dias');

-- Trigger para atualizar updated_at
CREATE TRIGGER update_extra_modules_updated_at
BEFORE UPDATE ON public.extra_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calculator_settings_updated_at
BEFORE UPDATE ON public.calculator_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();