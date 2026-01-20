-- Adicionar coluna release_customization na tabela clients
ALTER TABLE public.clients
ADD COLUMN release_customization boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.clients.release_customization IS 'Permite que agentes custom deste cliente tenham o prompt editável';