-- Adicionar coluna helena_contact_id na tabela tickets
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS helena_contact_id text;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_tickets_helena_contact_id ON public.tickets(helena_contact_id);

-- Comentário para documentação
COMMENT ON COLUMN public.tickets.helena_contact_id IS 'ID do contato na plataforma Helena - vínculo principal';