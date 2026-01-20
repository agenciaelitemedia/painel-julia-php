-- Add is_group column to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS is_group boolean DEFAULT false;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_contacts_is_group ON public.contacts(is_group);
CREATE INDEX IF NOT EXISTS idx_contacts_client_id_is_group ON public.contacts(client_id, is_group);