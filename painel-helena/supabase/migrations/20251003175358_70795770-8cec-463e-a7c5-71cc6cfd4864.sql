-- Add admin modules to system_module enum
ALTER TYPE system_module ADD VALUE IF NOT EXISTS 'clients';
ALTER TYPE system_module ADD VALUE IF NOT EXISTS 'webhook';