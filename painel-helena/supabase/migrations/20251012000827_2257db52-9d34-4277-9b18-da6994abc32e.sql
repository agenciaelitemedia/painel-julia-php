-- Ensure RLS allows admins to delete subscription requests
DO $$ BEGIN
  -- Enable RLS (safe if already enabled)
  EXECUTE 'ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN others THEN NULL; END $$;

-- Allow admins to DELETE
DO $$ BEGIN
  CREATE POLICY "Admins can delete subscription requests"
  ON public.subscription_requests
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::user_role));
EXCEPTION WHEN duplicate_object THEN
  -- Policy already exists
  NULL;
END $$;