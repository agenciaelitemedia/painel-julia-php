-- Corrigir o nome do ícone do dashboard para o nome correto do Lucide React
UPDATE system_modules 
SET icon_name = 'LayoutDashboard' 
WHERE module_key = 'dashboard';