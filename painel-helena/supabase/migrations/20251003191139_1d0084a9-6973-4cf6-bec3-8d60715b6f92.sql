-- Adicionar novos módulos ao enum system_module
ALTER TYPE system_module ADD VALUE IF NOT EXISTS 'team';
ALTER TYPE system_module ADD VALUE IF NOT EXISTS 'help';