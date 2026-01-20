-- Create followup_configs table
CREATE TABLE IF NOT EXISTS public.followup_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.julia_agents(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_message BOOLEAN NOT NULL DEFAULT true,
  start_hours TIME NOT NULL DEFAULT '08:00:00',
  end_hours TIME NOT NULL DEFAULT '20:00:00',
  followup_from INTEGER NULL,
  followup_to INTEGER NULL,
  trigger_delay_minutes INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id)
);

-- Create followup_steps table
CREATE TABLE IF NOT EXISTS public.followup_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID NOT NULL REFERENCES public.followup_configs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  step_value INTEGER NOT NULL CHECK (step_value > 0),
  step_unit TEXT NOT NULL CHECK (step_unit IN ('minutes', 'hours', 'days')),
  message TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_step_order CHECK (step_order >= 1)
);

-- Create followup_executions table
CREATE TABLE IF NOT EXISTS public.followup_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  config_id UUID NOT NULL REFERENCES public.followup_configs(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.followup_steps(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'cancelled', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NULL,
  message_sent TEXT NULL,
  is_infinite_loop BOOLEAN NOT NULL DEFAULT false,
  loop_iteration INTEGER NOT NULL DEFAULT 0,
  error_message TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create followup_history table
CREATE TABLE IF NOT EXISTS public.followup_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  execution_id UUID NULL REFERENCES public.followup_executions(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('started', 'step_sent', 'cancelled_by_response', 'infinite_loop_triggered', 'failed', 'rescheduled')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_followup_configs_agent ON public.followup_configs(agent_id);
CREATE INDEX IF NOT EXISTS idx_followup_configs_client ON public.followup_configs(client_id);
CREATE INDEX IF NOT EXISTS idx_followup_steps_config ON public.followup_steps(config_id, step_order);
CREATE INDEX IF NOT EXISTS idx_followup_executions_scheduled ON public.followup_executions(status, scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_followup_executions_conversation ON public.followup_executions(conversation_id, status);
CREATE INDEX IF NOT EXISTS idx_followup_executions_client ON public.followup_executions(client_id);
CREATE INDEX IF NOT EXISTS idx_followup_history_conversation ON public.followup_history(conversation_id);
CREATE INDEX IF NOT EXISTS idx_followup_history_client ON public.followup_history(client_id);

-- Enable Row Level Security
ALTER TABLE public.followup_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for followup_configs
CREATE POLICY "Users can view their client followup configs"
  ON public.followup_configs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role) OR client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Users can insert their client followup configs"
  ON public.followup_configs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Users can update their client followup configs"
  ON public.followup_configs FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::user_role) OR client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Users can delete their client followup configs"
  ON public.followup_configs FOR DELETE
  USING (has_role(auth.uid(), 'admin'::user_role) OR client_id = get_user_client_id(auth.uid()));

-- RLS Policies for followup_steps
CREATE POLICY "Users can view their followup steps"
  ON public.followup_steps FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role) OR config_id IN (
    SELECT id FROM public.followup_configs WHERE client_id = get_user_client_id(auth.uid())
  ));

CREATE POLICY "Users can insert their followup steps"
  ON public.followup_steps FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR config_id IN (
    SELECT id FROM public.followup_configs WHERE client_id = get_user_client_id(auth.uid())
  ));

CREATE POLICY "Users can update their followup steps"
  ON public.followup_steps FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::user_role) OR config_id IN (
    SELECT id FROM public.followup_configs WHERE client_id = get_user_client_id(auth.uid())
  ));

CREATE POLICY "Users can delete their followup steps"
  ON public.followup_steps FOR DELETE
  USING (has_role(auth.uid(), 'admin'::user_role) OR config_id IN (
    SELECT id FROM public.followup_configs WHERE client_id = get_user_client_id(auth.uid())
  ));

-- RLS Policies for followup_executions
CREATE POLICY "Users can view their client followup executions"
  ON public.followup_executions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role) OR client_id = get_user_client_id(auth.uid()));

CREATE POLICY "System can insert followup executions"
  ON public.followup_executions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update followup executions"
  ON public.followup_executions FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their client followup executions"
  ON public.followup_executions FOR DELETE
  USING (has_role(auth.uid(), 'admin'::user_role) OR client_id = get_user_client_id(auth.uid()));

-- RLS Policies for followup_history
CREATE POLICY "Users can view their client followup history"
  ON public.followup_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role) OR client_id = get_user_client_id(auth.uid()));

CREATE POLICY "System can insert followup history"
  ON public.followup_history FOR INSERT
  WITH CHECK (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_followup_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_followup_configs_updated_at
  BEFORE UPDATE ON public.followup_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_followup_updated_at();

CREATE TRIGGER update_followup_steps_updated_at
  BEFORE UPDATE ON public.followup_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_followup_updated_at();

CREATE TRIGGER update_followup_executions_updated_at
  BEFORE UPDATE ON public.followup_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_followup_updated_at();