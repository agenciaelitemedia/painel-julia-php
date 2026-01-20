-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar tabela de logs de execução de cron (se não existir)
CREATE TABLE IF NOT EXISTS cron_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  execution_type TEXT NOT NULL,
  status TEXT NOT NULL,
  result JSONB,
  error_message TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS se ainda não estiver
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'cron_execution_logs' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE cron_execution_logs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Criar políticas apenas se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'cron_execution_logs' 
    AND policyname = 'Admins can view cron logs'
  ) THEN
    CREATE POLICY "Admins can view cron logs"
    ON cron_execution_logs
    FOR SELECT
    USING (has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'cron_execution_logs' 
    AND policyname = 'System can insert cron logs'
  ) THEN
    CREATE POLICY "System can insert cron logs"
    ON cron_execution_logs
    FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;

-- Remover cron job existente se houver
SELECT cron.unschedule('send-followup-messages') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-followup-messages'
);

-- Criar o cron job que executa a cada minuto
SELECT cron.schedule(
  'send-followup-messages',
  '* * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://qoifgfawfkdukjakhssv.supabase.co/functions/v1/send-followup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvaWZnZmF3ZmtkdWtqYWtoc3N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNTcxNTUsImV4cCI6MjA3NDgzMzE1NX0.BoRq5msmZWJUaxyC-wev1ECNKWVho5h6O6aBH8GbuL4"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);