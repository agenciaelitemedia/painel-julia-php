-- Adicionar campos para rastrear quem editou as notas
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS notes_updated_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS notes_updated_by_name text,
ADD COLUMN IF NOT EXISTS notes_updated_at timestamp with time zone;