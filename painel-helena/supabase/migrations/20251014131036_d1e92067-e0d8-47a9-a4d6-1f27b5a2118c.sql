-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remover job existente se houver (ignora erro se não existir)
DO $$
BEGIN
  PERFORM cron.unschedule('monitor-conversations-job');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Criar cron job para executar monitor-conversations a cada 2 minutos
SELECT cron.schedule(
  'monitor-conversations-job',
  '*/2 * * * *', -- A cada 2 minutos
  $$
  SELECT
    net.http_post(
        url:='https://qoifgfawfkdukjakhssv.supabase.co/functions/v1/monitor-conversations',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvaWZnZmF3ZmtkdWtqYWtoc3N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNTcxNTUsImV4cCI6MjA3NDgzMzE1NX0.BoRq5msmZWJUaxyC-wev1ECNKWVho5h6O6aBH8GbuL4"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);