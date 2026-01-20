-- Criar índices para otimizar queries de mensagens
-- Índice para buscar mensagens por contato ordenadas por timestamp
CREATE INDEX IF NOT EXISTS idx_messages_contact_timestamp 
ON public.messages(contact_id, timestamp DESC);

-- Índice para contar mensagens não lidas por contato
CREATE INDEX IF NOT EXISTS idx_messages_contact_unread 
ON public.messages(contact_id, from_me, status) 
WHERE from_me = false AND status != 'read';

-- Índice para ordenar contatos por atualização
CREATE INDEX IF NOT EXISTS idx_contacts_updated_at 
ON public.contacts(updated_at DESC) 
WHERE is_archived = false;