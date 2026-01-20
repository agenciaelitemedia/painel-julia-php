-- Add missing 'dashboard' value to system_module enum
ALTER TYPE system_module ADD VALUE IF NOT EXISTS 'dashboard';