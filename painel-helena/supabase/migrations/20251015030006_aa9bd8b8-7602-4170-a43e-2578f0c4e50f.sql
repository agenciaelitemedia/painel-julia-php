-- Atualizar constraint para permitir novos event_types usados pelo app
ALTER TABLE public.followup_history DROP CONSTRAINT IF EXISTS followup_history_event_type_check;

ALTER TABLE public.followup_history
ADD CONSTRAINT followup_history_event_type_check
CHECK (
  event_type IN (
    'started',
    'step_sent',
    'cancelled_by_response',
    'infinite_loop_triggered',
    'failed',
    'rescheduled',
    'user_responded',
    'no_response',
    'agent_paused',
    'cancelled',
    'next_step_scheduled'
  )
);
