-- Adicionar campo para limitar membros da equipe
ALTER TABLE public.clients
ADD COLUMN max_team_members INTEGER NOT NULL DEFAULT 5;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.clients.max_team_members IS 'Limite de membros da equipe. 0 = ilimitado';