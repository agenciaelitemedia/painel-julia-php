-- Remove campos relacionados a múltiplos providers da tabela whatsapp_instances
ALTER TABLE public.whatsapp_instances 
DROP COLUMN IF EXISTS api_provider,
DROP COLUMN IF EXISTS business_phone_id,
DROP COLUMN IF EXISTS waba_id;

-- Simplificar a estrutura para manter apenas o necessário para UAZAP
-- instance_id = nome da instância (usado na URL)
-- api_token = token de autenticação (usado no header)
-- api_url = URL base da API UAZAP