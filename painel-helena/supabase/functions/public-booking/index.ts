import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const calendar_slug = body.calendar_slug;
    const datetime = body.datetime;
    const booker_name = body.booker_name ?? body.contact_name;
    const booker_phone = body.booker_phone ?? body.contact_phone;
    const booker_email = body.booker_email ?? body.contact_email;
    const notes = body.notes;

    console.log('[public-booking] Nova solicitação de agendamento:', {
      calendar_slug,
      datetime,
      booker_name,
      booker_phone
    });

    // Validar dados
    if (!calendar_slug || !datetime || !booker_name || !booker_phone) {
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios faltando' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar calendário (público) sem depender de joins
    const { data: calendar, error: calendarError } = await supabase
      .from('calendars')
      .select(
        `id, client_id, name, timezone, booking_settings`
      )
      .eq('slug', calendar_slug)
      .eq('is_public', true)
      .maybeSingle();

    if (calendarError || !calendar) {
      console.error('[public-booking] Calendário não encontrado:', calendarError);
      return new Response(
        JSON.stringify({ error: 'Calendário não encontrado ou indisponível' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const bookingDate = new Date(datetime);
    const duration = calendar.booking_settings?.duration || 30;
    const endTime = new Date(bookingDate.getTime() + duration * 60000);

    // Verificar disponibilidade
    const dayOfWeek = bookingDate.getDay();
    const hh = String(bookingDate.getHours()).padStart(2, '0');
    const mm = String(bookingDate.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}:00`; // HH:MM:SS

    const { data: availability } = await supabase
      .from('calendar_availability')
      .select('*')
      .eq('calendar_id', calendar.id)
      .eq('day_of_week', dayOfWeek)
      .lte('start_time', timeStr)
      .gt('end_time', timeStr)
      .eq('is_available', true)
      .maybeSingle();

    if (!availability) {
      console.log('[public-booking] Horário não disponível');
      return new Response(
        JSON.stringify({ error: 'Horário não disponível' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar conflitos com outros eventos
    const { data: conflicts } = await supabase
      .from('calendar_events')
      .select('id')
      .eq('calendar_id', calendar.id)
      .neq('status', 'cancelled')
      .or(`and(start_time.lte.${endTime.toISOString()},end_time.gte.${bookingDate.toISOString()})`)
      .limit(1);

    if (conflicts && conflicts.length > 0) {
      console.log('[public-booking] Conflito de horário');
      return new Response(
        JSON.stringify({ error: 'Horário já reservado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar ou criar contato
    const phoneClean = booker_phone.replace(/\D/g, '');
    let contactId: string;

    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('client_id', calendar.client_id)
      .eq('phone', phoneClean)
      .single();

    if (existingContact) {
      contactId = existingContact.id;
    } else {
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          client_id: calendar.client_id,
          phone: phoneClean,
          name: booker_name,
          notes: `Agendado via ${calendar.name}`
        })
        .select('id')
        .single();

      if (contactError || !newContact) {
        console.error('[public-booking] Erro ao criar contato:', contactError);
        throw new Error('Erro ao criar contato');
      }

      contactId = newContact.id;
    }

    // Buscar usuário criador (qualquer usuário do cliente)
    const { data: ownerUser } = await supabase
      .from('users')
      .select('id')
      .eq('client_id', calendar.client_id)
      .limit(1)
      .maybeSingle();

    if (!ownerUser?.id) {
      console.error('[public-booking] Nenhum usuário associado ao cliente', calendar.client_id);
      return new Response(
        JSON.stringify({ error: 'Calendário sem usuário associado para criar o evento' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar evento
    const { data: event, error: eventError } = await supabase
      .from('calendar_events')
      .insert({
        client_id: calendar.client_id,
        calendar_id: calendar.id,
        title: `Agendamento - ${booker_name}`,
        description: notes || '',
        start_time: bookingDate.toISOString(),
        end_time: endTime.toISOString(),
        contact_id: contactId,
        status: 'confirmed',
        created_by: ownerUser.id,
        metadata: {
          source: 'public_booking',
          booker_email,
          booker_phone
        }
      })
      .select('id')
      .single();

    if (eventError || !event) {
      console.error('[public-booking] Erro ao criar evento:', eventError);
      throw new Error('Erro ao criar evento');
    }

    // Criar booking
    await supabase
      .from('calendar_bookings')
      .insert({
        calendar_id: calendar.id,
        event_id: event.id,
        booker_name,
        booker_phone,
        booker_email,
        notes
      });

    // Criar notificações automáticas
    const notifications = [
      {
        event_id: event.id,
        trigger_time: '0 seconds', // Confirmação imediata
        message_template: 'Olá {name}! ✅ Seu agendamento foi confirmado para {date} às {time}. Até lá!',
        media_type: 'text'
      },
      {
        event_id: event.id,
        trigger_time: '1 day',
        message_template: 'Olá {name}! 📅 Lembrete: você tem um compromisso amanhã às {time} - {title}',
        media_type: 'text'
      },
      {
        event_id: event.id,
        trigger_time: '1 hour',
        message_template: 'Olá {name}! ⏰ Seu compromisso é daqui a 1 hora ({time}). Nos vemos em breve!',
        media_type: 'text'
      }
    ];

    await supabase
      .from('event_notifications')
      .insert(notifications);

    // Enviar confirmação imediata via WhatsApp (opcional)
    try {
      const uazapUrl = Deno.env.get('VITE_EVOLUTION_API_URL') || 'https://atende-julia.uazapi.com';

      const { data: waInstance } = await supabase
        .from('whatsapp_instances')
        .select('instance_id, api_token')
        .eq('client_id', calendar.client_id)
        .eq('status', 'connected')
        .is('deleted_at', null)
        .maybeSingle();
      
      if (waInstance?.instance_id && waInstance?.api_token) {
        const confirmationMessage = `Olá ${booker_name}! ✅ Seu agendamento foi confirmado!\n\n📅 Data: ${bookingDate.toLocaleDateString('pt-BR')}\n🕐 Horário: ${bookingDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\nAté lá!`;

        await fetch(`${uazapUrl}/message/sendText/${waInstance.instance_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': waInstance.api_token
          },
          body: JSON.stringify({
            chat_id: `${phoneClean}@s.whatsapp.net`,
            text: confirmationMessage
          })
        });

        console.log('[public-booking] Confirmação enviada via WhatsApp');
      } else {
        console.log('[public-booking] Nenhuma instância de WhatsApp conectada — pulando envio de confirmação');
      }
    } catch (error) {
      console.error('[public-booking] Erro ao enviar confirmação WhatsApp:', error);
      // Não falhar o booking se a confirmação não for enviada
    }

    console.log('[public-booking] Agendamento criado com sucesso:', event.id);

    return new Response(
      JSON.stringify({
        success: true,
        event_id: event.id,
        message: 'Agendamento confirmado! Você receberá uma confirmação no WhatsApp.'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[public-booking] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao processar agendamento' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
