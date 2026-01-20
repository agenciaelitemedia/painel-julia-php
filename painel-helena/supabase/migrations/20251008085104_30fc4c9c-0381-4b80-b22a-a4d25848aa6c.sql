-- Criar enums necessários
CREATE TYPE event_status AS ENUM ('scheduled', 'confirmed', 'cancelled', 'completed');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');
CREATE TYPE media_type AS ENUM ('text', 'image', 'video', 'location', 'document');
CREATE TYPE location_type AS ENUM ('physical', 'virtual', 'whatsapp');

-- Adicionar o módulo calendar ao sistema
INSERT INTO public.system_modules (module_key, label, description, icon_name, display_order, is_active)
VALUES ('calendar', 'Calendário', 'Sistema de agendamento com notificações WhatsApp', 'Calendar', 4, true)
ON CONFLICT (module_key) DO NOTHING;

-- Tabela de calendários compartilháveis
CREATE TABLE public.calendars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  is_public BOOLEAN NOT NULL DEFAULT false,
  booking_settings JSONB DEFAULT '{
    "duration": 30,
    "buffer_time": 0,
    "max_events_per_day": 10
  }'::jsonb,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de disponibilidade de horários
CREATE TABLE public.calendar_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_id UUID NOT NULL REFERENCES public.calendars(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de eventos
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  calendar_id UUID NOT NULL REFERENCES public.calendars(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location_type location_type NOT NULL DEFAULT 'physical',
  location_details JSONB DEFAULT '{}'::jsonb,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  status event_status NOT NULL DEFAULT 'scheduled',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de notificações de eventos
CREATE TABLE public.event_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.julia_agents(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'whatsapp',
  trigger_time INTERVAL NOT NULL,
  message_template TEXT NOT NULL,
  media_type media_type NOT NULL DEFAULT 'text',
  media_url TEXT,
  media_caption TEXT,
  location_data JSONB,
  status notification_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de reservas públicas
CREATE TABLE public.calendar_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_id UUID NOT NULL REFERENCES public.calendars(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  booker_name TEXT NOT NULL,
  booker_phone TEXT NOT NULL,
  booker_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_calendars_client_id ON public.calendars(client_id);
CREATE INDEX idx_calendars_slug ON public.calendars(slug);
CREATE INDEX idx_calendar_availability_calendar_id ON public.calendar_availability(calendar_id);
CREATE INDEX idx_calendar_events_client_id ON public.calendar_events(client_id);
CREATE INDEX idx_calendar_events_calendar_id ON public.calendar_events(calendar_id);
CREATE INDEX idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX idx_calendar_events_contact_id ON public.calendar_events(contact_id);
CREATE INDEX idx_event_notifications_event_id ON public.event_notifications(event_id);
CREATE INDEX idx_event_notifications_status ON public.event_notifications(status);
CREATE INDEX idx_calendar_bookings_calendar_id ON public.calendar_bookings(calendar_id);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies para calendars
CREATE POLICY "Users can view their client calendars"
  ON public.calendars FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Users can insert their client calendars"
  ON public.calendars FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Users can update their client calendars"
  ON public.calendars FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Users can delete their client calendars"
  ON public.calendars FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR client_id = get_user_client_id(auth.uid()));

-- RLS Policies para calendar_availability
CREATE POLICY "Users can view their calendar availability"
  ON public.calendar_availability FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') OR 
    calendar_id IN (SELECT id FROM public.calendars WHERE client_id = get_user_client_id(auth.uid()))
  );

CREATE POLICY "Users can manage their calendar availability"
  ON public.calendar_availability FOR ALL
  USING (
    has_role(auth.uid(), 'admin') OR 
    calendar_id IN (SELECT id FROM public.calendars WHERE client_id = get_user_client_id(auth.uid()))
  );

-- RLS Policies para calendar_events
CREATE POLICY "Users can view their client events"
  ON public.calendar_events FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Users can insert their client events"
  ON public.calendar_events FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Users can update their client events"
  ON public.calendar_events FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Users can delete their client events"
  ON public.calendar_events FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR client_id = get_user_client_id(auth.uid()));

-- RLS Policies para event_notifications
CREATE POLICY "Users can view their event notifications"
  ON public.event_notifications FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') OR 
    event_id IN (SELECT id FROM public.calendar_events WHERE client_id = get_user_client_id(auth.uid()))
  );

CREATE POLICY "Users can manage their event notifications"
  ON public.event_notifications FOR ALL
  USING (
    has_role(auth.uid(), 'admin') OR 
    event_id IN (SELECT id FROM public.calendar_events WHERE client_id = get_user_client_id(auth.uid()))
  );

-- RLS Policies para calendar_bookings
CREATE POLICY "Anyone can create bookings"
  ON public.calendar_bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their calendar bookings"
  ON public.calendar_bookings FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') OR 
    calendar_id IN (SELECT id FROM public.calendars WHERE client_id = get_user_client_id(auth.uid()))
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_calendars_updated_at
  BEFORE UPDATE ON public.calendars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para notificações
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_notifications;