-- Adicionar valores faltantes ao enum system_module
DO $$ 
BEGIN
  -- Adicionar julia_agents se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'julia_agents' 
    AND enumtypid = 'system_module'::regtype
  ) THEN
    ALTER TYPE system_module ADD VALUE 'julia_agents';
  END IF;
  
  -- Adicionar julia_performance se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'julia_performance' 
    AND enumtypid = 'system_module'::regtype
  ) THEN
    ALTER TYPE system_module ADD VALUE 'julia_performance';
  END IF;
  
  -- Adicionar julia_contracts se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'julia_contracts' 
    AND enumtypid = 'system_module'::regtype
  ) THEN
    ALTER TYPE system_module ADD VALUE 'julia_contracts';
  END IF;
END $$;

-- Inserir módulo Contratos da Julia
INSERT INTO public.system_modules (
  module_key,
  label,
  description,
  icon_name,
  category,
  display_order,
  is_active
) VALUES (
  'julia_contracts',
  'Contratos da Julia',
  'Gerenciamento e validação de contratos jurídicos da Julia',
  'FileCheck',
  'main',
  90,
  true
) ON CONFLICT (module_key) DO NOTHING;

-- Garantir que julia_performance está na categoria main
UPDATE public.system_modules 
SET category = 'main',
    display_order = 85
WHERE module_key = 'julia_performance';