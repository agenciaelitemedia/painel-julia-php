-- Atualizar todos os contatos que não têm instance_id associado
-- com a instância ativa (status = 'connected')
UPDATE contacts
SET instance_id = (
  SELECT id 
  FROM whatsapp_instances 
  WHERE status = 'connected' 
    AND client_id = contacts.client_id
  LIMIT 1
)
WHERE instance_id IS NULL
  AND client_id IS NOT NULL;