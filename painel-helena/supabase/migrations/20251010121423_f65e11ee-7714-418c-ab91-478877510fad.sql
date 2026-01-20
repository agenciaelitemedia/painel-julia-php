-- Add whatsapp_phone column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp_phone text;

COMMENT ON COLUMN clients.whatsapp_phone IS 'WhatsApp phone number in international format without formatting (e.g., 5534988860163) for invoice notifications';