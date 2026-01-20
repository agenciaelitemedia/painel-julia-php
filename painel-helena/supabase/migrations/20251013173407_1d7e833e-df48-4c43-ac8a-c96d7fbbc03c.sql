-- Remover policies antigas
DROP POLICY IF EXISTS "Admins can view all webhook logs" ON webhook_logs;
DROP POLICY IF EXISTS "Clients can view their webhook logs" ON webhook_logs;
DROP POLICY IF EXISTS "System can insert webhook logs" ON webhook_logs;

-- Criar policies mais flexíveis
CREATE POLICY "Admins can view all webhook logs"
  ON webhook_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view their webhook logs"
  ON webhook_logs
  FOR SELECT
  USING (
    resolved_client_id = get_user_client_id(auth.uid())
  );

CREATE POLICY "System can insert webhook logs"
  ON webhook_logs
  FOR INSERT
  WITH CHECK (true);