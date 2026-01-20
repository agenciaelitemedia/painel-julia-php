-- Enable required extensions (idempotent and tolerant)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Safely unschedule existing job by name if it exists (avoid errors)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'invoke-send-followup-every-minute'
  ) THEN
    PERFORM cron.unschedule('invoke-send-followup-every-minute');
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignore any errors while unscheduling to keep migration idempotent
  NULL;
END $$;

-- Schedule the send-followup function to run every minute (recreate)
select
  cron.schedule(
    'invoke-send-followup-every-minute',
    '* * * * *',
    $$
    select
      net.http_post(
        url := 'https://qoifgfawfkdukjakhssv.supabase.co/functions/v1/send-followup',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvaWZnZmF3ZmtkdWtqYWtoc3N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNTcxNTUsImV4cCI6MjA3NDgzMzE1NX0.BoRq5msmZWJUaxyC-wev1ECNKWVho5h6O6aBH8GbuL4"}'::jsonb,
        body := jsonb_build_object('source','cron','requested_at', now())
      ) as request_id;
    $$
  );

-- Trigger an immediate run once to process any due executions now
select
  net.http_post(
    url := 'https://qoifgfawfkdukjakhssv.supabase.co/functions/v1/send-followup',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvaWZnZmF3ZmtkdWtqYWtoc3N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNTcxNTUsImV4cCI6MjA3NDgzMzE1NX0.BoRq5msmZWJUaxyC-wev1ECNKWVho5h6O6aBH8GbuL4"}'::jsonb,
    body := jsonb_build_object('source','manual','requested_at', now())
  );