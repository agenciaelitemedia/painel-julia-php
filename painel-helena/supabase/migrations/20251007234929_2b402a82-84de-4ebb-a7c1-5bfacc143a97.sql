-- Add notes field to contacts table
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

COMMENT ON COLUMN public.contacts.notes IS 'Internal notes about the contact';