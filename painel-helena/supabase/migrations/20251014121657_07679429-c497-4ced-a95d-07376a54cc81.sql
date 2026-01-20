-- Add followup module to system_modules table
INSERT INTO public.system_modules (module_key, label, description, icon_name, is_active, display_order)
VALUES (
  'followup',
  'Follow-up Automático',
  'Configure sequências automáticas de mensagens para reengajamento de contatos inativos',
  'Repeat',
  true,
  100
)
ON CONFLICT (module_key) DO UPDATE
SET 
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  is_active = EXCLUDED.is_active;