-- Adicionar campo more_info à tabela subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS more_info TEXT;