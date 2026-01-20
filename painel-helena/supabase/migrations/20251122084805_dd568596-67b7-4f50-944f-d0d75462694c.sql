-- Atualizar módulo Desempenho da Julia para categoria main
UPDATE public.system_modules 
SET category = 'main',
    display_order = 85
WHERE module_key = 'julia_performance';