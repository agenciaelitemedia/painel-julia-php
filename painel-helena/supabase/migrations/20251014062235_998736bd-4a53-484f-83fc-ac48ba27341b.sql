-- Adicionar o módulo 'campaigns' ao enum system_module se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'campaigns' AND enumtypid = 'system_module'::regtype) THEN
        ALTER TYPE system_module ADD VALUE 'campaigns';
    END IF;
END $$;

-- Inserir o módulo campaigns na tabela system_modules
INSERT INTO system_modules (module_key, label, description, icon_name, is_active, display_order)
VALUES ('campaigns', 'Campanhas', 'Rastreamento de campanhas de marketing (ads)', 'TrendingUp', true, 70)
ON CONFLICT (module_key) DO UPDATE 
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    icon_name = EXCLUDED.icon_name,
    is_active = EXCLUDED.is_active,
    display_order = EXCLUDED.display_order;

-- Conceder permissão do módulo campaigns para o cliente de teste
INSERT INTO client_permissions (client_id, module)
SELECT id, 'campaigns'::system_module
FROM clients
WHERE email = 'teste@teste.com'
ON CONFLICT DO NOTHING;