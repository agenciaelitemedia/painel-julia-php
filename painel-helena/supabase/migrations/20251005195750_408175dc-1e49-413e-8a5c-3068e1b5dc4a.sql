-- Add julia_agent_codes column to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS julia_agent_codes TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.clients.julia_agent_codes IS 'Array of Julia agent codes assigned to this client';