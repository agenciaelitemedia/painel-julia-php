-- Adicionar módulo Desempenho da Julia ao sistema
INSERT INTO public.system_modules (
  module_key,
  label,
  description,
  icon_name,
  category,
  display_order,
  is_active
) VALUES (
  'julia_performance',
  'Desempenho da Julia',
  'Visualize métricas e desempenho dos agentes Julia',
  'BarChart3',
  'admin',
  95,
  true
) ON CONFLICT (module_key) DO NOTHING;