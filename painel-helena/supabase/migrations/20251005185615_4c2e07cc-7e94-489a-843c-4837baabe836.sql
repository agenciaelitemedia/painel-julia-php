-- Adicionar coluna max_julia_agents na tabela clients
ALTER TABLE public.clients 
ADD COLUMN max_julia_agents integer NOT NULL DEFAULT 1;

-- Adicionar constraint para garantir que max_julia_agents <= max_agents
ALTER TABLE public.clients
ADD CONSTRAINT check_max_julia_agents 
CHECK (max_julia_agents <= max_agents);