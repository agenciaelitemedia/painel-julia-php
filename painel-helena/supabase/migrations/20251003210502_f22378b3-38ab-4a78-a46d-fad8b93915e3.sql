-- Primeiro, atualizar os contatos sem client_id
-- associando-os ao client da instância a que pertencem
UPDATE contacts
SET client_id = (
  SELECT client_id 
  FROM whatsapp_instances 
  WHERE whatsapp_instances.id = contacts.instance_id
  LIMIT 1
)
WHERE client_id IS NULL AND instance_id IS NOT NULL;

-- Se ainda houver contatos sem client_id e sem instance_id,
-- associar ao primeiro cliente disponível (fallback)
UPDATE contacts
SET client_id = (SELECT id FROM clients LIMIT 1)
WHERE client_id IS NULL;