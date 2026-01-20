-- Create whatsapp_instances table to store real connections
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  instance_id TEXT NOT NULL UNIQUE,
  instance_name TEXT NOT NULL,
  phone_number TEXT,
  profile_name TEXT,
  profile_picture_url TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected',
  qr_code TEXT,
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Policies for whatsapp_instances
CREATE POLICY "Users can view their client instances"
  ON public.whatsapp_instances
  FOR SELECT
  USING (
    client_id = get_user_client_id(auth.uid())
    OR get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Users can insert their client instances"
  ON public.whatsapp_instances
  FOR INSERT
  WITH CHECK (
    client_id = get_user_client_id(auth.uid())
    OR get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Users can update their client instances"
  ON public.whatsapp_instances
  FOR UPDATE
  USING (
    client_id = get_user_client_id(auth.uid())
    OR get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Users can delete their client instances"
  ON public.whatsapp_instances
  FOR DELETE
  USING (
    client_id = get_user_client_id(auth.uid())
    OR get_user_role(auth.uid()) = 'admin'
  );

-- Add trigger for updated_at
CREATE TRIGGER update_whatsapp_instances_updated_at
  BEFORE UPDATE ON public.whatsapp_instances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();