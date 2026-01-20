-- Adicionar colunas para suporte a múltiplas APIs na tabela whatsapp_instances
ALTER TABLE whatsapp_instances 
ADD COLUMN IF NOT EXISTS api_provider TEXT NOT NULL DEFAULT 'uazap' 
  CHECK (api_provider IN ('uazap', 'evolution', 'official')),
ADD COLUMN IF NOT EXISTS api_url TEXT,
ADD COLUMN IF NOT EXISTS api_token TEXT,
ADD COLUMN IF NOT EXISTS business_phone_id TEXT,
ADD COLUMN IF NOT EXISTS waba_id TEXT;

-- Criar índice para melhorar performance nas consultas por provider
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_api_provider 
ON whatsapp_instances(api_provider);

-- Comentários para documentação
COMMENT ON COLUMN whatsapp_instances.api_provider IS 'Provedor da API: uazap, evolution, ou official';
COMMENT ON COLUMN whatsapp_instances.api_url IS 'URL base da API (para uazap e evolution)';
COMMENT ON COLUMN whatsapp_instances.api_token IS 'Token de autenticação da API';
COMMENT ON COLUMN whatsapp_instances.business_phone_id IS 'Phone Number ID para WhatsApp Official API';
COMMENT ON COLUMN whatsapp_instances.waba_id IS 'WhatsApp Business Account ID para Official API';