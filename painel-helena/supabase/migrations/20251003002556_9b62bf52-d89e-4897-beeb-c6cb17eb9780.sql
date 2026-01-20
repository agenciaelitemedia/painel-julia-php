-- Adicionar coluna instance_id na tabela contacts
ALTER TABLE public.contacts 
ADD COLUMN instance_id uuid REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL;