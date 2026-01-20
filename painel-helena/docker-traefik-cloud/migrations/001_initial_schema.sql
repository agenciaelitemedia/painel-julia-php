-- 001_initial_schema.sql
-- Inicial: extensões, enums, tabelas base usadas pelo app/edge functions
-- Esta migração é compatível com banco gerenciado (Supabase Cloud)

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- para gen_random_uuid()

-- Enums
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.module_type AS ENUM (
    'chat', 'crm', 'calendar', 'followup', 'agents', 'billing', 'analytics'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.plan_change_type AS ENUM ('upgrade', 'downgrade', 'change');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tabelas auxiliares de segurança/tenant (não conflitam com auth)
CREATE TABLE IF NOT EXISTS public.user_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.user_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de planos
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  max_connections integer NOT NULL DEFAULT 1,
  max_agents integer NOT NULL DEFAULT 1,
  max_julia_agents integer NOT NULL DEFAULT 1,
  max_team_members integer NOT NULL DEFAULT 5,
  release_customization boolean NOT NULL DEFAULT true,
  enabled_modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de clientes (compatível com app)
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  cpf_cnpj text,
  client_code text,
  whatsapp_phone text,
  is_trial boolean DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  plan_id uuid REFERENCES public.subscription_plans(id),
  plan_started_at timestamptz,
  plan_expires_at timestamptz,
  next_billing_date date,
  release_customization boolean NOT NULL DEFAULT true,
  max_connections integer NOT NULL DEFAULT 1,
  max_agents integer NOT NULL DEFAULT 1,
  max_julia_agents integer NOT NULL DEFAULT 1,
  max_team_members integer NOT NULL DEFAULT 5,
  max_monthly_contacts integer NOT NULL DEFAULT 100,
  julia_agent_codes text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Permissões por módulo do cliente
CREATE TABLE IF NOT EXISTS public.client_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  module public.module_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Histórico de mudanças de plano
CREATE TABLE IF NOT EXISTS public.client_plan_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  old_plan_id uuid REFERENCES public.subscription_plans(id),
  new_plan_id uuid REFERENCES public.subscription_plans(id),
  old_price numeric,
  new_price numeric,
  old_billing_cycle text,
  new_billing_cycle text,
  old_resources jsonb,
  new_resources jsonb,
  change_type public.plan_change_type NOT NULL,
  effective_date timestamptz NOT NULL DEFAULT now(),
  is_automatic boolean NOT NULL DEFAULT false,
  requires_approval boolean DEFAULT false,
  approved_by uuid,
  approved_at timestamptz,
  changed_by uuid,
  changed_by_role text,
  reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Recursos do cliente usados nas validações de migração
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.julia_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Fluxo de assinatura (pedido + tracking)
CREATE TABLE IF NOT EXISTS public.subscription_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  full_name text NOT NULL,
  cpf_cnpj text NOT NULL,
  email text NOT NULL,
  whatsapp_phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  verification_code text,
  verification_sent_at timestamptz,
  verification_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscription_request_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.subscription_requests(id) ON DELETE CASCADE,
  tracking_token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clients_plan ON public.clients(plan_id);
CREATE INDEX IF NOT EXISTS idx_clients_active ON public.clients(is_active);
CREATE INDEX IF NOT EXISTS idx_perm_client ON public.client_permissions(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_client ON public.whatsapp_instances(client_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_julia_client ON public.julia_agents(client_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_team_client ON public.team_members(client_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_subreq_email ON public.subscription_requests(email);
CREATE INDEX IF NOT EXISTS idx_subreq_phone ON public.subscription_requests(whatsapp_phone);

-- Marcar RLS para ser habilitado na migração 003
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_plan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_request_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.julia_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
