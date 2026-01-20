-- ===========================================
-- SISTEMA DE TICKETS DE SUPORTE
-- ===========================================

-- Tabela: ticket_sectors (Setores)
CREATE TABLE public.ticket_sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  helena_count_id text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  color text DEFAULT '#6366f1',
  sla_hours integer DEFAULT 24,
  default_priority text DEFAULT 'normal' CHECK (default_priority IN ('baixa', 'normal', 'alta', 'critica')),
  is_active boolean DEFAULT true,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(helena_count_id, slug)
);

-- Tabela: ticket_team_members (Membros de Equipe por Setor)
CREATE TABLE public.ticket_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  helena_count_id text NOT NULL,
  sector_id uuid REFERENCES public.ticket_sectors(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  user_name text NOT NULL,
  user_email text,
  role text DEFAULT 'atendente' CHECK (role IN ('atendente', 'lider', 'admin')),
  is_available boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela: tickets (Tickets)
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  helena_count_id text NOT NULL,
  ticket_number SERIAL,
  title text NOT NULL,
  description text,
  sector_id uuid REFERENCES public.ticket_sectors(id),
  priority text DEFAULT 'normal' CHECK (priority IN ('baixa', 'normal', 'alta', 'critica')),
  status text DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_atendimento', 'aguardando', 'resolvido', 'cancelado')),
  
  -- Vínculo com chat/contato
  whatsapp_number text,
  contact_name text,
  cod_agent text,
  chat_context text,
  
  -- Atribuição
  assigned_to_id uuid REFERENCES public.ticket_team_members(id) ON DELETE SET NULL,
  assigned_at timestamptz,
  
  -- SLA
  sla_deadline timestamptz,
  sla_breached boolean DEFAULT false,
  
  -- Tags
  tags text[] DEFAULT '{}',
  
  -- Metadados
  created_by_id text,
  created_by_name text,
  resolved_at timestamptz,
  resolved_by_id text,
  resolved_by_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela: ticket_comments (Comentários Internos)
CREATE TABLE public.ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  user_name text NOT NULL,
  content text NOT NULL,
  is_internal boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabela: ticket_history (Histórico/Auditoria)
CREATE TABLE public.ticket_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE,
  action text NOT NULL,
  old_value text,
  new_value text,
  user_id text NOT NULL,
  user_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ===========================================
-- ÍNDICES PARA PERFORMANCE
-- ===========================================

CREATE INDEX idx_ticket_sectors_helena_count_id ON public.ticket_sectors(helena_count_id);
CREATE INDEX idx_ticket_team_members_helena_count_id ON public.ticket_team_members(helena_count_id);
CREATE INDEX idx_ticket_team_members_sector_id ON public.ticket_team_members(sector_id);
CREATE INDEX idx_tickets_helena_count_id ON public.tickets(helena_count_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_sector_id ON public.tickets(sector_id);
CREATE INDEX idx_tickets_assigned_to_id ON public.tickets(assigned_to_id);
CREATE INDEX idx_tickets_whatsapp ON public.tickets(whatsapp_number);
CREATE INDEX idx_tickets_sla_deadline ON public.tickets(sla_deadline);
CREATE INDEX idx_tickets_priority ON public.tickets(priority);
CREATE INDEX idx_tickets_created_at ON public.tickets(created_at DESC);
CREATE INDEX idx_ticket_comments_ticket_id ON public.ticket_comments(ticket_id);
CREATE INDEX idx_ticket_history_ticket_id ON public.ticket_history(ticket_id);

-- ===========================================
-- TRIGGER PARA UPDATED_AT
-- ===========================================

CREATE TRIGGER update_ticket_sectors_updated_at
  BEFORE UPDATE ON public.ticket_sectors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ticket_team_members_updated_at
  BEFORE UPDATE ON public.ticket_team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- RLS POLICIES (Public App - sem auth tradicional)
-- ===========================================

-- ticket_sectors
ALTER TABLE public.ticket_sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read ticket_sectors"
  ON public.ticket_sectors FOR SELECT
  USING (true);

CREATE POLICY "Public insert ticket_sectors"
  ON public.ticket_sectors FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update ticket_sectors"
  ON public.ticket_sectors FOR UPDATE
  USING (true);

CREATE POLICY "Public delete ticket_sectors"
  ON public.ticket_sectors FOR DELETE
  USING (true);

-- ticket_team_members
ALTER TABLE public.ticket_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read ticket_team_members"
  ON public.ticket_team_members FOR SELECT
  USING (true);

CREATE POLICY "Public insert ticket_team_members"
  ON public.ticket_team_members FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update ticket_team_members"
  ON public.ticket_team_members FOR UPDATE
  USING (true);

CREATE POLICY "Public delete ticket_team_members"
  ON public.ticket_team_members FOR DELETE
  USING (true);

-- tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tickets"
  ON public.tickets FOR SELECT
  USING (true);

CREATE POLICY "Public insert tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update tickets"
  ON public.tickets FOR UPDATE
  USING (true);

CREATE POLICY "Public delete tickets"
  ON public.tickets FOR DELETE
  USING (true);

-- ticket_comments
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read ticket_comments"
  ON public.ticket_comments FOR SELECT
  USING (true);

CREATE POLICY "Public insert ticket_comments"
  ON public.ticket_comments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update ticket_comments"
  ON public.ticket_comments FOR UPDATE
  USING (true);

CREATE POLICY "Public delete ticket_comments"
  ON public.ticket_comments FOR DELETE
  USING (true);

-- ticket_history
ALTER TABLE public.ticket_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read ticket_history"
  ON public.ticket_history FOR SELECT
  USING (true);

CREATE POLICY "Public insert ticket_history"
  ON public.ticket_history FOR INSERT
  WITH CHECK (true);