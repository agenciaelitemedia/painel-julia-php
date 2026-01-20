-- Adicionar coluna category na tabela system_modules
ALTER TABLE system_modules 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'main';

-- Adicionar check constraint para valores válidos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'system_modules_category_check'
  ) THEN
    ALTER TABLE system_modules 
    ADD CONSTRAINT system_modules_category_check 
    CHECK (category IN ('main', 'admin', 'management'));
  END IF;
END $$;

-- Atualizar módulos existentes baseado no padrão atual
UPDATE system_modules 
SET category = 'main' 
WHERE module_key IN ('dashboard', 'chat', 'agent_julia', 'contacts', 'crm', 'calendar', 'process_campaigns', 'campaigns', 'connections', 'webhook', 'followup')
AND category IS NULL;

UPDATE system_modules 
SET category = 'management' 
WHERE module_key IN ('settings', 'help', 'team', 'agent-analytics', 'billing')
AND category IS NULL;

-- Atualizar o módulo julia_agents para categoria admin
UPDATE system_modules 
SET category = 'admin' 
WHERE module_key = 'julia_agents';