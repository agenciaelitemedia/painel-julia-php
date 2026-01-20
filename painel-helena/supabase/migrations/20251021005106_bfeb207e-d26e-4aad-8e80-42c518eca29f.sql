-- Adicionar campo para marcar instância como conexão do sistema
ALTER TABLE whatsapp_instances 
ADD COLUMN IF NOT EXISTS is_system_instance BOOLEAN DEFAULT FALSE;

-- Criar constraint para garantir apenas uma instância do sistema
CREATE UNIQUE INDEX IF NOT EXISTS unique_system_instance 
ON whatsapp_instances (is_system_instance) 
WHERE is_system_instance = TRUE;

-- Criar tabela para logs de notificações do sistema
CREATE TABLE IF NOT EXISTS system_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed
  error_message TEXT,
  whatsapp_instance_id UUID REFERENCES whatsapp_instances(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE system_notification_logs ENABLE ROW LEVEL SECURITY;

-- Política para admins verem todos os logs
CREATE POLICY "Admins can view all system notification logs"
ON system_notification_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Política para admins inserirem logs
CREATE POLICY "Admins can insert system notification logs"
ON system_notification_logs
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Política para admins atualizarem logs
CREATE POLICY "Admins can update system notification logs"
ON system_notification_logs
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_system_notification_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_system_notification_logs_updated_at
BEFORE UPDATE ON system_notification_logs
FOR EACH ROW
EXECUTE FUNCTION update_system_notification_logs_updated_at();

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_system_notification_logs_client_id ON system_notification_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_system_notification_logs_status ON system_notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_system_notification_logs_created_at ON system_notification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_notification_logs_notification_type ON system_notification_logs(notification_type);