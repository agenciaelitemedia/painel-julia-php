-- Add unique constraint to settings table for key + client_id
ALTER TABLE public.settings DROP CONSTRAINT IF EXISTS settings_key_client_id_unique;
ALTER TABLE public.settings ADD CONSTRAINT settings_key_client_id_unique UNIQUE (key, client_id);