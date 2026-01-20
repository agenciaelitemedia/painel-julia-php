-- Aumentar tamanho do campo phone para suportar grupos
ALTER TABLE public.contacts 
ALTER COLUMN phone TYPE VARCHAR(100);

-- Remover unique constraint do phone pois grupos podem ter IDs longos
ALTER TABLE public.contacts 
DROP CONSTRAINT IF EXISTS contacts_phone_key;

-- Adicionar unique constraint composto (client_id + phone)
ALTER TABLE public.contacts 
ADD CONSTRAINT contacts_client_phone_unique UNIQUE (client_id, phone);