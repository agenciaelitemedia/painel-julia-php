-- Adicionar módulo Julia Agents ao sistema
INSERT INTO system_modules (
  module_key,
  label,
  description,
  icon_name,
  is_active,
  display_order
) VALUES (
  'julia_agents',
  'Agents Julia',
  'Gerenciamento de agents de IA do banco externo',
  'bot',
  true,
  100
) ON CONFLICT (module_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  is_active = EXCLUDED.is_active,
  updated_at = now();
