-- Criar tabela para logs de execução do monitor
CREATE TABLE IF NOT EXISTS monitor_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  execution_type TEXT NOT NULL, -- 'manual' ou 'scheduled'
  conversations_processed INTEGER NOT NULL DEFAULT 0,
  executions_created INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE monitor_execution_logs ENABLE ROW LEVEL SECURITY;

-- Política para admins visualizarem logs
CREATE POLICY "Admins can view monitor logs"
  ON monitor_execution_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Política para sistema inserir logs
CREATE POLICY "System can insert monitor logs"
  ON monitor_execution_logs
  FOR INSERT
  WITH CHECK (true);

-- Criar índice para buscar logs recentes
CREATE INDEX idx_monitor_logs_executed_at ON monitor_execution_logs(executed_at DESC);

-- Criar tabela para configuração do cron job
CREATE TABLE IF NOT EXISTS cron_job_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL UNIQUE,
  interval_minutes INTEGER NOT NULL DEFAULT 2,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE cron_job_config ENABLE ROW LEVEL SECURITY;

-- Política para admins gerenciarem configuração
CREATE POLICY "Admins can manage cron config"
  ON cron_job_config
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Inserir configuração padrão
INSERT INTO cron_job_config (job_name, interval_minutes, is_active)
VALUES ('monitor-conversations-job', 2, true)
ON CONFLICT (job_name) DO NOTHING;