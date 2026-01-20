-- Relax clients SELECT policy to avoid dependency on user_roles while still enforcing tenant isolation
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'clients' 
      AND policyname = 'Clients can view their own data'
  ) THEN
    DROP POLICY "Clients can view their own data" ON public.clients;
  END IF;
END $$;

CREATE POLICY "Clients can view their own data"
ON public.clients
FOR SELECT
USING (id = get_user_client_id(auth.uid()));
