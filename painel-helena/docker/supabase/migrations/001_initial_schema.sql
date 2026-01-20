-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_role AS ENUM ('admin', 'client', 'team_member');
CREATE TYPE system_module AS ENUM (
  'chat', 'crm', 'contacts', 'connections', 
  'team', 'settings', 'campaigns', 'calendar',
  'followup', 'agent_julia', 'billing'
);
CREATE TYPE plan_change_type AS ENUM ('initial', 'upgrade', 'downgrade', 'change', 'cancellation');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'quarterly', 'semiannual', 'annual');
CREATE TYPE location_type AS ENUM ('physical', 'online', 'phone');
CREATE TYPE event_status AS ENUM ('scheduled', 'completed', 'cancelled');

-- ============================================
-- SUBSCRIPTION PLANS
-- ============================================
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  billing_cycle billing_cycle NOT NULL,
  max_connections INTEGER NOT NULL DEFAULT 1,
  max_agents INTEGER NOT NULL DEFAULT 1,
  max_julia_agents INTEGER NOT NULL DEFAULT 1,
  max_team_members INTEGER NOT NULL DEFAULT 5,
  max_monthly_contacts INTEGER NOT NULL DEFAULT 100,
  features JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CLIENTS (TENANTS)
-- ============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf_cnpj TEXT,
  whatsapp_phone TEXT,
  client_code TEXT,
  plan_id UUID REFERENCES subscription_plans(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_trial BOOLEAN DEFAULT false,
  plan_started_at TIMESTAMPTZ,
  plan_expires_at TIMESTAMPTZ,
  next_billing_date DATE,
  max_connections INTEGER NOT NULL DEFAULT 1,
  max_agents INTEGER NOT NULL DEFAULT 1,
  max_julia_agents INTEGER NOT NULL DEFAULT 1,
  max_team_members INTEGER NOT NULL DEFAULT 5,
  max_monthly_contacts INTEGER NOT NULL DEFAULT 100,
  release_customization BOOLEAN NOT NULL DEFAULT true,
  julia_agent_codes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- USER ROLES (SEPARATE TABLE FOR SECURITY)
-- ============================================
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- ============================================
-- CLIENT PERMISSIONS
-- ============================================
CREATE TABLE client_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  module system_module NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, module)
);

-- ============================================
-- TEAM MEMBERS
-- ============================================
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, user_id)
);

-- ============================================
-- TEAM MEMBER PERMISSIONS
-- ============================================
CREATE TABLE team_member_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
  module system_module NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_member_id, module)
);

-- ============================================
-- WHATSAPP INSTANCES
-- ============================================
CREATE TABLE whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  instance_id TEXT NOT NULL,
  api_type TEXT NOT NULL DEFAULT 'evolution',
  api_url TEXT NOT NULL,
  api_token TEXT NOT NULL,
  qr_code TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected',
  is_connected BOOLEAN NOT NULL DEFAULT false,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CONTACTS
-- ============================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  instance_id UUID REFERENCES whatsapp_instances(id),
  phone VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  avatar VARCHAR,
  status VARCHAR,
  notes TEXT,
  notes_updated_by UUID REFERENCES auth.users(id),
  notes_updated_by_name TEXT,
  notes_updated_at TIMESTAMPTZ,
  tags TEXT[],
  is_group BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MESSAGES
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  from_number VARCHAR NOT NULL,
  to_number VARCHAR NOT NULL,
  body TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  status VARCHAR,
  message_type VARCHAR,
  media_url TEXT,
  is_from_me BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- JULIA AGENTS
-- ============================================
CREATE TABLE julia_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  instance_id UUID REFERENCES whatsapp_instances(id),
  name TEXT NOT NULL,
  description TEXT,
  agent_code TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  welcome_message TEXT,
  ai_model_id UUID,
  temperature NUMERIC DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4096,
  auto_summary_threshold INTEGER DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- AGENT CONVERSATIONS
-- ============================================
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES julia_agents(id),
  contact_id UUID REFERENCES contacts(id),
  remote_jid TEXT NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_paused BOOLEAN DEFAULT false,
  paused_at TIMESTAMPTZ,
  paused_reason TEXT,
  pause_triggered_by TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AGENT CONVERSATION MESSAGES
-- ============================================
CREATE TABLE agent_conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES agent_conversations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES julia_agents(id),
  remote_jid TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  importance_score NUMERIC DEFAULT 0.5,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CRM BOARDS
-- ============================================
CREATE TABLE crm_boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'layout-dashboard',
  color TEXT DEFAULT '#6366f1',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CRM PIPELINES
-- ============================================
CREATE TABLE crm_pipelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  board_id UUID REFERENCES crm_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CRM DEALS
-- ============================================
CREATE TABLE crm_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  pipeline_id UUID REFERENCES crm_pipelines(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  title TEXT NOT NULL,
  description TEXT,
  value NUMERIC,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'active',
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CALENDARS
-- ============================================
CREATE TABLE calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  is_public BOOLEAN NOT NULL DEFAULT false,
  booking_settings JSONB DEFAULT '{"duration": 30, "buffer_time": 0, "max_events_per_day": 10}'::jsonb,
  notification_settings JSONB DEFAULT '{"immediate_confirmation": true, "reminder_24h": true, "reminder_1h": true, "reminder_at_time": false}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, slug)
);

-- ============================================
-- CALENDAR EVENTS
-- ============================================
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  calendar_id UUID REFERENCES calendars(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location_type location_type NOT NULL DEFAULT 'physical',
  location_details JSONB DEFAULT '{}'::jsonb,
  status event_status NOT NULL DEFAULT 'scheduled',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- FOLLOWUP CONFIGS
-- ============================================
CREATE TABLE followup_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES julia_agents(id) NOT NULL,
  name TEXT NOT NULL,
  followup_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  followup_from INTEGER,
  followup_to INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  trigger_on_no_response BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PRE FOLLOWUP
-- ============================================
CREATE TABLE pre_followup (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  config_id UUID REFERENCES followup_configs(id) NOT NULL,
  conversation_id UUID REFERENCES agent_conversations(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  current_step INTEGER NOT NULL DEFAULT 0,
  scheduled_for TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- FOLLOWUP EXECUTIONS
-- ============================================
CREATE TABLE followup_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  pre_followup_id UUID REFERENCES pre_followup(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES agent_conversations(id),
  message_sent TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CAMPAIGN SOURCES
-- ============================================
CREATE TABLE campaign_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  campaign_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  budget NUMERIC,
  payload_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ASAAS CONFIG
-- ============================================
CREATE TABLE asaas_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_token TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'sandbox',
  wallet_id TEXT,
  webhook_url TEXT,
  whatsapp_instance_id UUID REFERENCES whatsapp_instances(id),
  whatsapp_notifications_enabled BOOLEAN DEFAULT false,
  notification_templates JSONB DEFAULT '{}'::jsonb,
  auto_renew_default BOOLEAN DEFAULT true,
  auto_approve_enabled BOOLEAN DEFAULT false,
  auto_approve_max_value NUMERIC,
  auto_approve_plan_whitelist JSONB DEFAULT '[]'::jsonb,
  split_config JSONB DEFAULT '{}'::jsonb,
  default_grace_period_days INTEGER DEFAULT 3,
  max_payment_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
