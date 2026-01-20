import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventNotification {
  id: string;
  event_id: string;
  agent_id: string | null;
  trigger_time: string;
  message_template: string;
  media_type: 'text' | 'image' | 'video' | 'location' | 'document';
  media_url: string | null;
  media_caption: string | null;
  location_data: {
    latitude?: number;
    longitude?: number;
    address?: string;
  } | null;
  calendar_events: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    location_details: any;
    contacts: {
      phone: string;
      name: string;
    } | null;
    calendars: {
      client_id: string;
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[send-event-notifications] Iniciando processamento de notificações...');

    // Buscar notificações pendentes que devem ser enviadas
    const { data: notifications, error } = await supabase
      .from('event_notifications')
      .select(`
        *,
        calendar_events!inner (
          id,
          title,
          start_time,
          end_time,
          location_details,
          contacts (
            phone,
            name
          ),
          calendars!inner (
            client_id
          )
        )
      `)
      .eq('status', 'pending')
      .gte('calendar_events.start_time', 'now()')
      .returns<EventNotification[]>();

    if (error) {
      console.error('[send-event-notifications] Erro ao buscar notificações:', error);
      throw error;
    }

    if (!notifications || notifications.length === 0) {
      console.log('[send-event-notifications] Nenhuma notificação pendente encontrada');
      return new Response(
        JSON.stringify({ message: 'Nenhuma notificação pendente' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[send-event-notifications] Encontradas ${notifications.length} notificações`);

    const results = [];
    const now = new Date();

    for (const notification of notifications) {
      try {
        // Calcular quando deve ser enviado
        const eventStartTime = new Date(notification.calendar_events.start_time);
        const triggerInterval = parseTriggerTime(notification.trigger_time);
        const sendTime = new Date(eventStartTime.getTime() - triggerInterval);

        console.log(`[send-event-notifications] Notificação ${notification.id}:`, {
          eventStart: eventStartTime,
          triggerTime: notification.trigger_time,
          sendTime,
          now,
          shouldSend: now >= sendTime
        });

        // Verificar se já deve enviar
        if (now < sendTime) {
          console.log(`[send-event-notifications] Aguardando horário de envio para ${notification.id}`);
          continue;
        }

        // Verificar se tem contato
        if (!notification.calendar_events.contacts?.phone) {
          console.error(`[send-event-notifications] Evento sem contato: ${notification.event_id}`);
          await supabase
            .from('event_notifications')
            .update({
              status: 'failed',
              error_message: 'Evento sem contato vinculado',
              sent_at: new Date().toISOString()
            })
            .eq('id', notification.id);
          continue;
        }

        // Preparar mensagem substituindo variáveis
        const message = replaceVariables(notification.message_template, notification.calendar_events);

        // Buscar instância WhatsApp do cliente
        const { data: instance } = await supabase
          .from('whatsapp_instances')
          .select('instance_id, api_token, provider')
          .eq('client_id', notification.calendar_events.calendars.client_id)
          .eq('status', 'connected')
          .is('deleted_at', null)
          .single();

        if (!instance) {
          console.error(`[send-event-notifications] Nenhuma instância WhatsApp conectada para o cliente`);
          await supabase
            .from('event_notifications')
            .update({
              status: 'failed',
              error_message: 'Nenhuma instância WhatsApp conectada',
              sent_at: new Date().toISOString()
            })
            .eq('id', notification.id);
          continue;
        }

        // Enviar via UAZAP API
        const uazapUrl = Deno.env.get('VITE_EVOLUTION_API_URL') || 'https://atende-julia.uazapi.com';
        const contactPhone = notification.calendar_events.contacts.phone.replace(/\D/g, '');
        
        let payload: any = {
          chat_id: `${contactPhone}@s.whatsapp.net`,
        };

        // Preparar payload baseado no tipo de mídia
        switch (notification.media_type) {
          case 'text':
            payload.text = message;
            break;
          
          case 'image':
            if (notification.media_url) {
              payload.urlFile = notification.media_url;
              if (notification.media_caption) {
                payload.text = replaceVariables(notification.media_caption, notification.calendar_events);
              }
            } else {
              payload.text = message;
            }
            break;
          
          case 'video':
            if (notification.media_url) {
              payload.urlFile = notification.media_url;
              if (notification.media_caption) {
                payload.text = replaceVariables(notification.media_caption, notification.calendar_events);
              }
            } else {
              payload.text = message;
            }
            break;
          
          case 'location':
            if (notification.location_data?.latitude && notification.location_data?.longitude) {
              payload.latitude = notification.location_data.latitude;
              payload.longitude = notification.location_data.longitude;
              if (notification.location_data.address) {
                payload.address = notification.location_data.address;
              }
            } else {
              payload.text = message;
            }
            break;
          
          default:
            payload.text = message;
        }

        console.log(`[send-event-notifications] Enviando notificação ${notification.id}:`, {
          type: notification.media_type,
          phone: contactPhone
        });

        // Enviar mensagem
        const endpoint = notification.media_type === 'location' 
          ? `/message/sendLocation/${instance.instance_id}`
          : notification.media_type === 'image' || notification.media_type === 'video'
          ? `/message/sendMedia/${instance.instance_id}`
          : `/message/sendText/${instance.instance_id}`;

        const response = await fetch(`${uazapUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': instance.api_token
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[send-event-notifications] Erro ao enviar: ${errorText}`);
          throw new Error(`Erro ao enviar mensagem: ${errorText}`);
        }

        const result = await response.json();
        console.log(`[send-event-notifications] Notificação ${notification.id} enviada com sucesso:`, result);

        // Atualizar status da notificação
        await supabase
          .from('event_notifications')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', notification.id);

        results.push({ id: notification.id, status: 'sent' });

      } catch (error) {
        console.error(`[send-event-notifications] Erro ao processar notificação ${notification.id}:`, error);
        
        await supabase
          .from('event_notifications')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Erro desconhecido',
            sent_at: new Date().toISOString()
          })
          .eq('id', notification.id);

        results.push({ 
          id: notification.id, 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Erro desconhecido' 
        });
      }
    }

    console.log(`[send-event-notifications] Processamento concluído. Total: ${results.length}`);

    return new Response(
      JSON.stringify({ 
        processed: results.length,
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[send-event-notifications] Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// Helper: parsear trigger_time (interval PostgreSQL como '1 day', '1 hour', etc.)
function parseTriggerTime(interval: string): number {
  const matches = interval.match(/(\d+)\s*(day|hour|minute|second)s?/i);
  if (!matches) return 0;

  const value = parseInt(matches[1]);
  const unit = matches[2].toLowerCase();

  const multipliers: Record<string, number> = {
    'second': 1000,
    'minute': 60 * 1000,
    'hour': 60 * 60 * 1000,
    'day': 24 * 60 * 60 * 1000
  };

  return value * (multipliers[unit] || 0);
}

// Helper: substituir variáveis na mensagem
function replaceVariables(template: string, event: any): string {
  const startTime = new Date(event.start_time);
  const endTime = new Date(event.end_time);
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000)); // em minutos

  const variables: Record<string, string> = {
    '{name}': event.contacts?.name || 'Cliente',
    '{date}': startTime.toLocaleDateString('pt-BR'),
    '{time}': startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    '{title}': event.title,
    '{location}': event.location_details?.address || event.location_details?.link || 'A definir',
    '{duration}': `${duration} minutos`
  };

  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(key, 'g'), value);
  }

  return result;
}
