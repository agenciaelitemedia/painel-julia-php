-- Adicionar campos de configuração avançada ao booking_settings
-- Adicionar campo notification_settings à tabela calendars

-- Adicionar nova coluna notification_settings para armazenar configurações de notificação
ALTER TABLE public.calendars 
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "immediate_confirmation": true,
  "reminder_24h": true,
  "reminder_1h": true,
  "reminder_at_time": false,
  "confirmation_template": "Olá {nome}! Seu agendamento para {data} às {horario} foi confirmado. 📅",
  "reminder_24h_template": "Olá {nome}! Lembrete: você tem um agendamento amanhã às {horario}. 📅",
  "reminder_1h_template": "Olá {nome}! Seu agendamento começa em 1 hora ({horario}). 📅",
  "reminder_at_time_template": "Olá {nome}! Seu agendamento é agora ({horario}). 📅"
}'::jsonb;