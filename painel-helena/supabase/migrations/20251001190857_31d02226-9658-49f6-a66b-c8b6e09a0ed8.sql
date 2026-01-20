-- Drop existing type if needed and recreate
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'client');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create clients table (tenants)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  max_connections INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create users/profiles table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'client',
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add client_id to existing tables (only if column doesn't exist)
DO $$ BEGIN
  ALTER TABLE public.contacts ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE public.messages ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE public.settings ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_client_id ON public.users(client_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_contacts_client_id ON public.contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON public.messages(client_id);
CREATE INDEX IF NOT EXISTS idx_settings_client_id ON public.settings(client_id);

-- Enable RLS on new tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

-- Create security definer function to get user client_id
CREATE OR REPLACE FUNCTION public.get_user_client_id(user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id FROM public.users WHERE id = user_id;
$$;

-- RLS Policies for clients table
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;
CREATE POLICY "Admins can view all clients" ON public.clients
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can insert clients" ON public.clients;
CREATE POLICY "Admins can insert clients" ON public.clients
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can update clients" ON public.clients;
CREATE POLICY "Admins can update clients" ON public.clients
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Clients can view their own data" ON public.clients;
CREATE POLICY "Clients can view their own data" ON public.clients
  FOR SELECT USING (id = public.get_user_client_id(auth.uid()));

-- RLS Policies for users table
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
CREATE POLICY "Admins can insert users" ON public.users
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can update users" ON public.users;
CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- Update RLS Policies for contacts table
DROP POLICY IF EXISTS "Permitir leitura pública de contatos" ON public.contacts;
DROP POLICY IF EXISTS "Permitir inserção pública de contatos" ON public.contacts;
DROP POLICY IF EXISTS "Permitir atualização pública de contatos" ON public.contacts;
DROP POLICY IF EXISTS "Users can view their client contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert their client contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update their client contacts" ON public.contacts;

CREATE POLICY "Users can view their client contacts" ON public.contacts
  FOR SELECT USING (client_id = public.get_user_client_id(auth.uid()) OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can insert their client contacts" ON public.contacts
  FOR INSERT WITH CHECK (client_id = public.get_user_client_id(auth.uid()) OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can update their client contacts" ON public.contacts
  FOR UPDATE USING (client_id = public.get_user_client_id(auth.uid()) OR public.get_user_role(auth.uid()) = 'admin');

-- Update RLS Policies for messages table
DROP POLICY IF EXISTS "Permitir leitura pública de mensagens" ON public.messages;
DROP POLICY IF EXISTS "Permitir inserção pública de mensagens" ON public.messages;
DROP POLICY IF EXISTS "Permitir atualização pública de mensagens" ON public.messages;
DROP POLICY IF EXISTS "Users can view their client messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their client messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their client messages" ON public.messages;

CREATE POLICY "Users can view their client messages" ON public.messages
  FOR SELECT USING (client_id = public.get_user_client_id(auth.uid()) OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can insert their client messages" ON public.messages
  FOR INSERT WITH CHECK (client_id = public.get_user_client_id(auth.uid()) OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can update their client messages" ON public.messages
  FOR UPDATE USING (client_id = public.get_user_client_id(auth.uid()) OR public.get_user_role(auth.uid()) = 'admin');

-- Update RLS Policies for settings table
DROP POLICY IF EXISTS "Allow public read" ON public.settings;
DROP POLICY IF EXISTS "Allow public insert" ON public.settings;
DROP POLICY IF EXISTS "Allow public update" ON public.settings;
DROP POLICY IF EXISTS "Users can view their client settings" ON public.settings;
DROP POLICY IF EXISTS "Users can insert their client settings" ON public.settings;
DROP POLICY IF EXISTS "Users can update their client settings" ON public.settings;

CREATE POLICY "Users can view their client settings" ON public.settings
  FOR SELECT USING (client_id = public.get_user_client_id(auth.uid()) OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can insert their client settings" ON public.settings
  FOR INSERT WITH CHECK (client_id = public.get_user_client_id(auth.uid()) OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can update their client settings" ON public.settings
  FOR UPDATE USING (client_id = public.get_user_client_id(auth.uid()) OR public.get_user_role(auth.uid()) = 'admin');

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup and create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();