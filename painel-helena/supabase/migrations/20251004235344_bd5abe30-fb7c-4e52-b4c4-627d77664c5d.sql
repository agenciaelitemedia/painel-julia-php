-- Adicionar novos campos à tabela clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS client_code TEXT,
ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT,
ADD COLUMN IF NOT EXISTS max_agents INTEGER NOT NULL DEFAULT 1;

-- Adicionar restrições de tamanho
ALTER TABLE public.clients 
ADD CONSTRAINT client_code_length CHECK (char_length(client_code) <= 20),
ADD CONSTRAINT cpf_cnpj_length CHECK (char_length(cpf_cnpj) <= 20);

-- Criar índice único para código do cliente (se for informado)
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_client_code ON public.clients(client_code) WHERE client_code IS NOT NULL;