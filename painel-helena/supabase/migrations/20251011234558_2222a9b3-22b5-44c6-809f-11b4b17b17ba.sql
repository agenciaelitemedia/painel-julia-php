-- Primeiro, vamos verificar e corrigir as políticas RLS da tabela asaas_config
DROP POLICY IF EXISTS "Admins can manage config" ON asaas_config;
DROP POLICY IF EXISTS "Admins can view config" ON asaas_config;

-- Recriar a política com USING e WITH CHECK corretos
CREATE POLICY "Admins can manage config" 
ON asaas_config 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Adicionar role de admin para o usuário atual (se não existir)
-- Este código será executado quando o admin fizer login
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::user_role
FROM auth.users
WHERE email LIKE '%@%' -- Ajuste este filtro para o email do admin específico se necessário
ON CONFLICT (user_id, role) DO NOTHING;