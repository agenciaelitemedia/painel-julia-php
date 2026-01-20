-- Adicionar campo max_monthly_contacts à tabela clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS max_monthly_contacts integer NOT NULL DEFAULT 100;

-- Adicionar campo max_monthly_contacts à tabela subscription_plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS max_monthly_contacts integer NOT NULL DEFAULT 100;

-- Comentários para documentação
COMMENT ON COLUMN public.clients.max_monthly_contacts IS 'Número máximo de novos contatos que podem ser criados por mês';
COMMENT ON COLUMN public.subscription_plans.max_monthly_contacts IS 'Número máximo de novos contatos permitidos por mês no plano';