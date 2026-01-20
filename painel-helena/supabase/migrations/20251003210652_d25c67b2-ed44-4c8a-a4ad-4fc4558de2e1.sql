-- ============================================
-- SISTEMA MULTI-TENANT: ISOLAMENTO POR CLIENT_ID
-- ============================================

-- 1. Garantir que client_id seja obrigatório nas tabelas principais
ALTER TABLE contacts ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE messages ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE whatsapp_instances ALTER COLUMN client_id SET NOT NULL;

-- 2. Adicionar índices para melhorar performance das queries por client_id
CREATE INDEX IF NOT EXISTS idx_contacts_client_id ON contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_client_id ON whatsapp_instances(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_client_id ON crm_deals(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_pipelines_client_id ON crm_pipelines(client_id);
CREATE INDEX IF NOT EXISTS idx_settings_client_id ON settings(client_id);

-- 3. RECRIAR POLÍTICAS RLS PARA GARANTIR ISOLAMENTO MULTI-TENANT

-- CONTACTS
DROP POLICY IF EXISTS "Users can view their client contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert their client contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update their client contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete their client contacts" ON contacts;
DROP POLICY IF EXISTS "Multi-tenant: view contacts" ON contacts;
DROP POLICY IF EXISTS "Multi-tenant: insert contacts" ON contacts;
DROP POLICY IF EXISTS "Multi-tenant: update contacts" ON contacts;
DROP POLICY IF EXISTS "Multi-tenant: delete contacts" ON contacts;

CREATE POLICY "Multi-tenant: view contacts" ON contacts
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    (client_id = get_user_client_id(auth.uid()))
  );

CREATE POLICY "Multi-tenant: insert contacts" ON contacts
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::user_role) OR 
    (client_id = get_user_client_id(auth.uid()))
  );

CREATE POLICY "Multi-tenant: update contacts" ON contacts
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    (client_id = get_user_client_id(auth.uid()))
  );

CREATE POLICY "Multi-tenant: delete contacts" ON contacts
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    (client_id = get_user_client_id(auth.uid()))
  );

-- MESSAGES
DROP POLICY IF EXISTS "Users can view their client messages" ON messages;
DROP POLICY IF EXISTS "Users can insert their client messages" ON messages;
DROP POLICY IF EXISTS "Users can update their client messages" ON messages;
DROP POLICY IF EXISTS "Multi-tenant: view messages" ON messages;
DROP POLICY IF EXISTS "Multi-tenant: insert messages" ON messages;
DROP POLICY IF EXISTS "Multi-tenant: update messages" ON messages;

CREATE POLICY "Multi-tenant: view messages" ON messages
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    (client_id = get_user_client_id(auth.uid()))
  );

CREATE POLICY "Multi-tenant: insert messages" ON messages
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::user_role) OR 
    (client_id = get_user_client_id(auth.uid()))
  );

CREATE POLICY "Multi-tenant: update messages" ON messages
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    (client_id = get_user_client_id(auth.uid()))
  );

-- WHATSAPP_INSTANCES
DROP POLICY IF EXISTS "Users can view their client instances" ON whatsapp_instances;
DROP POLICY IF EXISTS "Users can insert their client instances" ON whatsapp_instances;
DROP POLICY IF EXISTS "Users can update their client instances" ON whatsapp_instances;
DROP POLICY IF EXISTS "Users can delete their client instances" ON whatsapp_instances;
DROP POLICY IF EXISTS "Multi-tenant: view instances" ON whatsapp_instances;
DROP POLICY IF EXISTS "Multi-tenant: insert instances" ON whatsapp_instances;
DROP POLICY IF EXISTS "Multi-tenant: update instances" ON whatsapp_instances;
DROP POLICY IF EXISTS "Multi-tenant: delete instances" ON whatsapp_instances;

CREATE POLICY "Multi-tenant: view instances" ON whatsapp_instances
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    (client_id = get_user_client_id(auth.uid()))
  );

CREATE POLICY "Multi-tenant: insert instances" ON whatsapp_instances
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::user_role) OR 
    (client_id = get_user_client_id(auth.uid()))
  );

CREATE POLICY "Multi-tenant: update instances" ON whatsapp_instances
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    (client_id = get_user_client_id(auth.uid()))
  );

CREATE POLICY "Multi-tenant: delete instances" ON whatsapp_instances
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    (client_id = get_user_client_id(auth.uid()))
  );

-- SETTINGS
DROP POLICY IF EXISTS "Users can view their client settings" ON settings;
DROP POLICY IF EXISTS "Users can insert their client settings" ON settings;
DROP POLICY IF EXISTS "Users can update their client settings" ON settings;
DROP POLICY IF EXISTS "Multi-tenant: view settings" ON settings;
DROP POLICY IF EXISTS "Multi-tenant: insert settings" ON settings;
DROP POLICY IF EXISTS "Multi-tenant: update settings" ON settings;

CREATE POLICY "Multi-tenant: view settings" ON settings
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    (client_id = get_user_client_id(auth.uid()))
  );

CREATE POLICY "Multi-tenant: insert settings" ON settings
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::user_role) OR 
    (client_id = get_user_client_id(auth.uid()))
  );

CREATE POLICY "Multi-tenant: update settings" ON settings
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    (client_id = get_user_client_id(auth.uid()))
  );

-- CRM_ACTIVITIES
DROP POLICY IF EXISTS "Users can view their client activities" ON crm_activities;
DROP POLICY IF EXISTS "Users can insert their client activities" ON crm_activities;
DROP POLICY IF EXISTS "Multi-tenant: view activities" ON crm_activities;
DROP POLICY IF EXISTS "Multi-tenant: insert activities" ON crm_activities;

CREATE POLICY "Multi-tenant: view activities" ON crm_activities
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    (client_id = get_user_client_id(auth.uid()))
  );

CREATE POLICY "Multi-tenant: insert activities" ON crm_activities
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::user_role) OR 
    (client_id = get_user_client_id(auth.uid()))
  );