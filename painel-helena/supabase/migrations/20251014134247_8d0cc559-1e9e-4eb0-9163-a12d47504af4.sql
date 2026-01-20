-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar tabela de configuração de cron jobs se não existir
CREATE TABLE IF NOT EXISTS cron_job_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL UNIQUE,
  interval_minutes INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE cron_job_config ENABLE ROW LEVEL SECURITY;

-- Drop política se existir e recriar
DROP POLICY IF EXISTS "Admins can manage cron config" ON cron_job_config;
CREATE POLICY "Admins can manage cron config"
ON cron_job_config
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Inserir configuração padrão para send-followup
INSERT INTO cron_job_config (job_name, interval_minutes, is_active)
VALUES ('send-followup', 1, true)
ON CONFLICT (job_name) DO NOTHING;

-- Criar tabela de logs de execução
CREATE TABLE IF NOT EXISTS cron_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  execution_type TEXT NOT NULL,
  status TEXT NOT NULL,
  result JSONB,
  error_message TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE cron_execution_logs ENABLE ROW LEVEL SECURITY;

-- Drop políticas se existirem e recriar
DROP POLICY IF EXISTS "Admins can view cron logs" ON cron_execution_logs;
CREATE POLICY "Admins can view cron logs"
ON cron_execution_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "System can insert cron logs" ON cron_execution_logs;
CREATE POLICY "System can insert cron logs"
ON cron_execution_logs
FOR INSERT
WITH CHECK (true);

-- Remover cron job existente se houver
SELECT cron.unschedule('send-followup-messages');

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