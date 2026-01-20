-- Add provider column to whatsapp_instances table to support multiple WhatsApp API providers
ALTER TABLE public.whatsapp_instances 
ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'uazap' 
CHECK (provider IN ('uazap', 'evolution', 'official'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_provider 
ON public.whatsapp_instances(provider);

-- Add comment to document the new column
COMMENT ON COLUMN public.whatsapp_instances.provider IS 'WhatsApp API provider: uazap, evolution, or official (Meta/Facebook)';