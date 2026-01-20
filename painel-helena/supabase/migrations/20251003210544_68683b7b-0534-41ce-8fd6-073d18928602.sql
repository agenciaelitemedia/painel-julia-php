-- Primeiro, atualizar mensagens sem client_id
-- Obter client_id através do contato associado
UPDATE messages
SET client_id = contacts.client_id
FROM contacts
WHERE messages.contact_id = contacts.id
  AND messages.client_id IS NULL;

-- Deletar mensagens órfãs que não têm contato válido
DELETE FROM messages
WHERE client_id IS NULL;