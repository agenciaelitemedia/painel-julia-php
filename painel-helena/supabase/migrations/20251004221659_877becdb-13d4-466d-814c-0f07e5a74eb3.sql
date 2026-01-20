-- Adicionar coluna deleted_at na tabela whatsapp_instances
ALTER TABLE whatsapp_instances 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Índice para performance em queries de instâncias deletadas
CREATE INDEX idx_whatsapp_instances_deleted_at 
ON whatsapp_instances(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- Índice composto para queries de importação por cliente
CREATE INDEX idx_whatsapp_instances_client_deleted 
ON whatsapp_instances(client_id, deleted_at);

-- Função para verificar se uma instância possui contatos vinculados
CREATE OR REPLACE FUNCTION has_linked_contacts(instance_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM contacts 
    WHERE instance_id = instance_uuid
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Atualizar política de visualização para excluir instâncias deletadas logicamente por padrão
DROP POLICY IF EXISTS "Multi-tenant: view instances" ON whatsapp_instances;

CREATE POLICY "Multi-tenant: view instances" 
ON whatsapp_instances FOR SELECT 
USING (
  (has_role(auth.uid(), 'admin'::user_role) OR 
   (client_id = get_user_client_id(auth.uid())))
  AND deleted_at IS NULL
);

-- Nova política para visualizar instâncias deletadas (necessário para importação)
CREATE POLICY "Multi-tenant: view deleted instances for import" 
ON whatsapp_instances FOR SELECT 
USING (
  (has_role(auth.uid(), 'admin'::user_role) OR 
   (client_id = get_user_client_id(auth.uid())))
  AND deleted_at IS NOT NULL
);