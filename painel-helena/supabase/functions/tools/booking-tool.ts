/**
 * Booking Tool - Ferramentas de agendamento
 */

import { ToolDefinition, ToolExecutionContext, BookingToolConfig } from "./types.ts";

export class BookingTool {
  private context: ToolExecutionContext;
  private config: BookingToolConfig;

  constructor(context: ToolExecutionContext, config: BookingToolConfig) {
    this.context = context;
    this.config = config;
  }

  /**
   * Retorna as definições de todas as funções de agendamento
   */
  static getDefinitions(): ToolDefinition[] {
    return [
      {
        type: "function",
        function: {
          name: "consultar_agendamentos",
          description: "Consulta agendamentos existentes de um cliente pelo número de telefone",
          parameters: {
            type: "object",
            properties: {
              phone_number: {
                type: "string",
                description: "Número de telefone do cliente (formato internacional, ex: 5534988860163)"
              },
              date_range: {
                type: "string",
                description: "Período para consultar: 'today', 'tomorrow', 'week', 'month' ou 'all'",
                enum: ["today", "tomorrow", "week", "month", "all"]
              }
            },
            required: ["phone_number"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "verificar_disponibilidade",
          description: "Verifica horários disponíveis em uma data específica",
          parameters: {
            type: "object",
            properties: {
              date: {
                type: "string",
                description: "Data no formato YYYY-MM-DD (ex: 2025-10-10)"
              },
              duration_minutes: {
                type: "number",
                description: "Duração do agendamento em minutos (padrão: 30)"
              }
            },
            required: ["date"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "criar_agendamento",
          description: "Cria um novo agendamento para o cliente",
          parameters: {
            type: "object",
            properties: {
              phone_number: {
                type: "string",
                description: "Número de telefone do cliente (formato internacional)"
              },
              name: {
                type: "string",
                description: "Nome completo do cliente"
              },
              date: {
                type: "string",
                description: "Data do agendamento (YYYY-MM-DD)"
              },
              time: {
                type: "string",
                description: "Horário do agendamento (HH:MM, ex: 14:30)"
              },
              duration_minutes: {
                type: "number",
                description: "Duração em minutos (padrão: 30)"
              },
              notes: {
                type: "string",
                description: "Observações adicionais (opcional)"
              }
            },
            required: ["phone_number", "name", "date", "time"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "reagendar_agendamento",
          description: "Altera data/hora de um agendamento existente",
          parameters: {
            type: "object",
            properties: {
              event_id: {
                type: "string",
                description: "ID do evento a ser reagendado"
              },
              new_date: {
                type: "string",
                description: "Nova data (YYYY-MM-DD)"
              },
              new_time: {
                type: "string",
                description: "Novo horário (HH:MM)"
              }
            },
            required: ["event_id", "new_date", "new_time"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "cancelar_agendamento",
          description: "Cancela um agendamento existente",
          parameters: {
            type: "object",
            properties: {
              event_id: {
                type: "string",
                description: "ID do evento a ser cancelado"
              },
              reason: {
                type: "string",
                description: "Motivo do cancelamento (opcional)"
              }
            },
            required: ["event_id"]
          }
        }
      }
    ];
  }

  /**
   * Executa uma função de agendamento
   */
  async execute(functionName: string, args: any): Promise<string> {
    console.log(`🛠️ Executando tool: ${functionName}`, args);

    try {
      switch (functionName) {
        case "consultar_agendamentos":
          return await this.consultarAgendamentos(args);
        case "verificar_disponibilidade":
          return await this.verificarDisponibilidade(args);
        case "criar_agendamento":
          return await this.criarAgendamento(args);
        case "reagendar_agendamento":
          return await this.reagendarAgendamento(args);
        case "cancelar_agendamento":
          return await this.cancelarAgendamento(args);
        default:
          return JSON.stringify({ error: `Função desconhecida: ${functionName}` });
      }
    } catch (error) {
      console.error(`❌ Erro ao executar ${functionName}:`, error);
      return JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      });
    }
  }

  /**
   * Consulta agendamentos do cliente
   */
  private async consultarAgendamentos(args: any): Promise<string> {
    // Verificar se há calendar_id configurado
    if (!this.config.calendar_id) {
      return JSON.stringify({ 
        success: false, 
        error: 'Nenhuma agenda configurada para este agente',
        message: 'O agente não possui uma agenda configurada. Configure uma agenda nas ferramentas do agente para habilitar o sistema de agendamentos.' 
      });
    }

    const { phone_number, date_range = 'all' } = args;

    // Buscar contato pelo telefone
    const { data: contact } = await this.context.supabase
      .from('contacts')
      .select('id')
      .eq('client_id', this.context.client_id)
      .eq('phone', phone_number)
      .single();

    if (!contact) {
      return JSON.stringify({ 
        success: false, 
        message: 'Cliente não encontrado no sistema' 
      });
    }

    // Calcular range de datas
    let startDate = new Date();
    let endDate: Date | null = null;

    switch (date_range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'tomorrow':
        startDate.setDate(startDate.getDate() + 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'month':
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        break;
    }

    // Buscar eventos
    let query = this.context.supabase
      .from('calendar_events')
      .select('id, title, start_time, end_time, status, description, location_type, location_details')
      .eq('calendar_id', this.config.calendar_id)
      .eq('contact_id', contact.id)
      .gte('start_time', startDate.toISOString());

    if (endDate) {
      query = query.lte('start_time', endDate.toISOString());
    }

    const { data: events, error } = await query.order('start_time', { ascending: true });

    if (error) {
      return JSON.stringify({ success: false, error: error.message });
    }

    if (!events || events.length === 0) {
      return JSON.stringify({ 
        success: true, 
        count: 0,
        message: 'Nenhum agendamento encontrado para este cliente no período solicitado' 
      });
    }

    // Formatar eventos
    const formattedEvents = events.map((event: any) => ({
      id: event.id,
      title: event.title,
      date: new Date(event.start_time).toLocaleDateString('pt-BR'),
      time: new Date(event.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      duration_minutes: Math.round((new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60000),
      status: event.status,
      location: event.location_type,
      notes: event.description
    }));

    return JSON.stringify({ 
      success: true, 
      count: events.length,
      events: formattedEvents 
    });
  }

  /**
   * Verifica disponibilidade de horários
   */
  private async verificarDisponibilidade(args: any): Promise<string> {
    // Verificar se há calendar_id configurado
    if (!this.config.calendar_id) {
      return JSON.stringify({ 
        success: false,
        available: false,
        error: 'Nenhuma agenda configurada para este agente',
        message: 'O agente não possui uma agenda configurada. Configure uma agenda nas ferramentas do agente para habilitar o sistema de agendamentos.',
        slots: [],
        count: 0
      });
    }

    const { date, duration_minutes = 30 } = args;

    // Buscar calendário e suas configurações
    const { data: calendar } = await this.context.supabase
      .from('calendars')
      .select('booking_settings, timezone')
      .eq('id', this.config.calendar_id)
      .single();

    if (!calendar) {
      return JSON.stringify({ 
        success: false,
        error: 'Calendário não encontrado' 
      });
    }

    const timezone = calendar.timezone || 'America/Sao_Paulo';
    const booking = calendar.booking_settings || {};
    const durationToUse = booking.duration || duration_minutes;
    const bufferTime = booking.buffer_time || 0;
    const minNoticeHours = booking.min_notice_hours ?? 0;
    const maxBookingDays = booking.max_booking_days ?? 60;
    const maxEventsPerDay = booking.max_events_per_day ?? 9999;

    // Helpers para conversão de timezone
    const getTimeZoneOffset = (date: Date, tz: string): number => {
      const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
      const parts = dtf.formatToParts(date);
      const map: Record<string, string> = {};
      for (const p of parts) map[p.type] = p.value;
      const asUTC = Date.UTC(
        Number(map.year), Number(map.month) - 1, Number(map.day),
        Number(map.hour), Number(map.minute), Number(map.second)
      );
      return (asUTC - date.getTime()) / 60000; // minutos
    };

    const zonedToUTC = (dateISO: string, timeHM: string, tz: string): Date => {
      const [Y, M, D] = dateISO.split('-').map(Number);
      const [h, m] = timeHM.split(':').map(Number);
      const pretendUTC = new Date(Date.UTC(Y, M - 1, D, h, m, 0));
      const offsetMin = getTimeZoneOffset(pretendUTC, tz);
      return new Date(pretendUTC.getTime() - offsetMin * 60000);
    };

    // Calcular início/fim do dia no timezone da agenda (convertidos para UTC)
    const startOfDayUTC = zonedToUTC(date, '00:00', timezone);
    const endOfDayUTC = zonedToUTC(date, '23:59', timezone);

    // Determinar dia da semana no timezone da agenda
    const dayOfWeek = new Date(startOfDayUTC).getUTCDay();

    // Regras: antecedência máxima de dias
    const nowUTC = new Date();
    const daysUntil = Math.floor((startOfDayUTC.getTime() - nowUTC.getTime()) / 86400000);
    if (daysUntil > maxBookingDays) {
      return JSON.stringify({
        success: true,
        available: false,
        message: `Não é possível agendar com mais de ${maxBookingDays} dias de antecedência`,
        date,
        slots: [],
        count: 0
      });
    }

    // Buscar disponibilidade configurada para este dia da semana
    const { data: availability } = await this.context.supabase
      .from('calendar_availability')
      .select('start_time, end_time, is_available')
      .eq('calendar_id', this.config.calendar_id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)
      .order('start_time', { ascending: true });

    if (!availability || availability.length === 0) {
      return JSON.stringify({ 
        success: true,
        available: false,
        message: 'Não há horários de atendimento configurados para este dia da semana',
        date,
        slots: [],
        count: 0
      });
    }
    // Buscar eventos já agendados nesta data (excluindo cancelados)
    const { data: existingEvents } = await this.context.supabase
      .from('calendar_events')
      .select('id, title, start_time, end_time, status')
      .eq('calendar_id', this.config.calendar_id)
      .gte('start_time', startOfDayUTC.toISOString())
      .lte('start_time', endOfDayUTC.toISOString())
      .neq('status', 'cancelled');

    // Gerar slots baseados na configuração de disponibilidade
    const slots: string[] = [];

    console.log(`📅 Verificando disponibilidade para ${date}, dia da semana (tz ${timezone}): ${dayOfWeek}`);
    console.log(`⏱️ Duração: ${durationToUse}min, Buffer: ${bufferTime}min`);
    console.log(`📋 Períodos de atendimento configurados:`, availability);
    console.log(`🔒 Eventos já agendados (excluindo cancelados):`, existingEvents?.length || 0);
    
    if (existingEvents && existingEvents.length > 0) {
      existingEvents.forEach((event: any) => {
        const start = new Date(event.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const end = new Date(event.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        console.log(`  📌 Agendamento: ${event.title || 'Sem título'} (${start} - ${end})`);
      });
    }

    // Para cada período de disponibilidade configurado
    for (const period of availability) {
      const [startHour, startMin] = period.start_time.split(':').map(Number);
      const [endHour, endMin] = period.end_time.split(':').map(Number);

      let currentTime = startHour * 60 + startMin; // minutos desde meia-noite
      const periodEndTime = endHour * 60 + endMin;

      console.log(`🕐 Período: ${period.start_time} - ${period.end_time}`);

      // Gerar slots dentro deste período
      while (currentTime + durationToUse <= periodEndTime) {
        const slotStart = new Date(date);
        slotStart.setHours(Math.floor(currentTime / 60), currentTime % 60, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + durationToUse);

        // Verificar se o slot conflita com algum evento existente
        const conflictingEvent = existingEvents?.find((event: any) => {
          const eventStart = new Date(event.start_time);
          const eventEnd = new Date(event.end_time);
          
          // Verifica se há sobreposição entre slot e evento
          // Um slot conflita se: início do slot < fim do evento E fim do slot > início do evento
          return (slotStart < eventEnd && slotEnd > eventStart);
        });

        if (!conflictingEvent) {
          const timeStr = `${String(Math.floor(currentTime / 60)).padStart(2, '0')}:${String(currentTime % 60).padStart(2, '0')}`;
          slots.push(timeStr);
          console.log(`✅ Slot disponível: ${timeStr}`);
        } else {
          const timeStr = `${String(Math.floor(currentTime / 60)).padStart(2, '0')}:${String(currentTime % 60).padStart(2, '0')}`;
          const eventStartTime = new Date(conflictingEvent.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          const eventEndTime = new Date(conflictingEvent.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          console.log(`❌ Slot ${timeStr} ocupado por: "${conflictingEvent.title}" (${eventStartTime} - ${eventEndTime})`);
        }

        // Avançar para o próximo slot (duração + buffer)
        currentTime += durationToUse + bufferTime;
      }
    }

    console.log(`📊 Total de slots disponíveis: ${slots.length}`);

    return JSON.stringify({ 
      success: true,
      available: slots.length > 0,
      date,
      day_of_week: dayOfWeek,
      duration_minutes: durationToUse,
      slots,
      count: slots.length,
      message: slots.length > 0 
        ? `${slots.length} horário(s) disponível(is)` 
        : 'Não há horários disponíveis nesta data'
    });
  }

  /**
   * Cria um novo agendamento
   */
  private async criarAgendamento(args: any): Promise<string> {
    // Verificar se há calendar_id configurado
    if (!this.config.calendar_id) {
      return JSON.stringify({ 
        success: false, 
        error: 'Nenhuma agenda configurada para este agente',
        message: 'O agente não possui uma agenda configurada. Configure uma agenda nas ferramentas do agente para habilitar o sistema de agendamentos.' 
      });
    }

    const { phone_number, name, date, time, duration_minutes = 30, notes = '' } = args;

    // Buscar configurações do calendário
    const { data: calendar } = await this.context.supabase
      .from('calendars')
      .select('booking_settings, timezone')
      .eq('id', this.config.calendar_id)
      .single();

    if (!calendar) {
      return JSON.stringify({ 
        success: false, 
        error: 'Calendário não encontrado' 
      });
    }

    const bookingSettings = calendar.booking_settings || {};
    const minNoticeHours = bookingSettings.min_notice_hours || 24;
    const maxBookingDays = bookingSettings.max_booking_days || 60;
    const maxEventsPerDay = bookingSettings.max_events_per_day || 10;

    // Validar antecedência mínima
    const requestedDateTime = new Date(`${date}T${time}:00`);
    const now = new Date();
    const hoursUntilAppointment = (requestedDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilAppointment < minNoticeHours) {
      return JSON.stringify({ 
        success: false, 
        error: `Agendamento requer antecedência mínima de ${minNoticeHours} horas`,
        message: `Este agendamento não pode ser realizado. É necessário agendar com pelo menos ${minNoticeHours} horas de antecedência.` 
      });
    }

    // Validar antecedência máxima
    const daysUntilAppointment = hoursUntilAppointment / 24;
    if (daysUntilAppointment > maxBookingDays) {
      return JSON.stringify({ 
        success: false, 
        error: `Agendamento não pode ser feito com mais de ${maxBookingDays} dias de antecedência`,
        message: `Este agendamento está muito distante. O sistema permite agendar até ${maxBookingDays} dias no futuro.` 
      });
    }

    // Verificar limite de eventos por dia
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: existingEventsCount, error: countError } = await this.context.supabase
      .from('calendar_events')
      .select('id', { count: 'exact', head: true })
      .eq('calendar_id', this.config.calendar_id)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .neq('status', 'cancelled');

    if (countError) {
      console.error('Erro ao verificar eventos do dia:', countError);
    } else {
      const count = existingEventsCount?.length || 0;
      if (count >= maxEventsPerDay) {
        return JSON.stringify({ 
          success: false, 
          error: `Limite de agendamentos atingido para esta data`,
          message: `Não é possível agendar. Esta data já atingiu o limite de ${maxEventsPerDay} agendamentos.` 
        });
      }
    }

    // Buscar o user_id do proprietário do cliente
    const { data: clientUser, error: userError } = await this.context.supabase
      .from('users')
      .select('id')
      .eq('client_id', this.context.client_id)
      .eq('role', 'client')
      .limit(1)
      .single();

    if (userError || !clientUser) {
      return JSON.stringify({ 
        success: false, 
        error: 'Usuário proprietário não encontrado',
        message: 'Não foi possível identificar o usuário proprietário da conta para criar o agendamento.' 
      });
    }

    // Buscar/criar contato
    let { data: contact } = await this.context.supabase
      .from('contacts')
      .select('id')
      .eq('client_id', this.context.client_id)
      .eq('phone', phone_number)
      .single();

    if (!contact) {
      const { data: newContact, error: contactError } = await this.context.supabase
        .from('contacts')
        .insert({
          client_id: this.context.client_id,
          phone: phone_number,
          name: name,
          instance_id: null
        })
        .select()
        .single();

      if (contactError) {
        return JSON.stringify({ success: false, error: 'Erro ao criar contato' });
      }
      contact = newContact;
    }

    const timezone = calendar?.timezone || 'America/Sao_Paulo';
    const durationToUse = (calendar?.booking_settings?.duration as number | undefined) ?? duration_minutes;

    // Converter data/horário no timezone da agenda para UTC com Intl API
    const getTimeZoneOffset = (date: Date, tz: string): number => {
      const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const parts = dtf.formatToParts(date);
      const map: Record<string, string> = {};
      for (const p of parts) map[p.type] = p.value;
      const asUTC = Date.UTC(
        Number(map.year),
        Number(map.month) - 1,
        Number(map.day),
        Number(map.hour),
        Number(map.minute),
        Number(map.second)
      );
      return (asUTC - date.getTime()) / 60000; // minutos
    };

    const zonedToUTC = (dateISO: string, timeHM: string, tz: string): Date => {
      const [Y, M, D] = dateISO.split('-').map(Number);
      const [h, m] = timeHM.split(':').map(Number);
      // "Finge" que este horário local é UTC
      const pretendUTC = new Date(Date.UTC(Y, M - 1, D, h, m, 0));
      const offsetMin = getTimeZoneOffset(pretendUTC, tz);
      return new Date(pretendUTC.getTime() - offsetMin * 60000);
    };

    const startTime = zonedToUTC(date, time, timezone);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + durationToUse);

    console.log(`🧾 Criando evento para cliente ${this.context.client_id} no calendário ${this.config.calendar_id}`);
    console.log(`👤 created_by (user_id): ${clientUser.id}`);
    console.log(`📇 contact_id: ${contact.id}`);
    console.log(`🕒 start: ${startTime.toISOString()} end: ${endTime.toISOString()}`);

    const { data: event, error } = await this.context.supabase
      .from('calendar_events')
      .insert({
        calendar_id: this.config.calendar_id,
        client_id: this.context.client_id,
        contact_id: contact.id,
        created_by: clientUser.id, // ✅ Usar user_id do cliente
        title: `Agendamento - ${name}`,
        description: notes,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        location_type: 'physical',
        status: 'scheduled',
        metadata: {
          created_by_agent: this.context.agent_id // Auditoria: qual agente criou
        }
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao inserir calendar_events:', error);
      return JSON.stringify({ success: false, error: error.message });
    }

    // Criar registro de booking
    await this.context.supabase
      .from('calendar_bookings')
      .insert({
        calendar_id: this.config.calendar_id,
        event_id: event.id,
        booker_name: name,
        booker_phone: phone_number,
        notes
      });

    return JSON.stringify({ 
      success: true,
      event_id: event.id,
      message: `Agendamento criado com sucesso para ${name} em ${new Date(startTime).toLocaleDateString('pt-BR')} às ${time}`,
      details: {
        date: new Date(startTime).toLocaleDateString('pt-BR'),
        time,
        duration_minutes: durationToUse
      }
    });
  }

  /**
   * Reagenda um evento existente
   */
  private async reagendarAgendamento(args: any): Promise<string> {
    // Verificar se há calendar_id configurado
    if (!this.config.calendar_id) {
      return JSON.stringify({ 
        success: false, 
        error: 'Nenhuma agenda configurada para este agente',
        message: 'O agente não possui uma agenda configurada. Configure uma agenda nas ferramentas do agente para habilitar o sistema de agendamentos.' 
      });
    }

    const { event_id, new_date, new_time } = args;

    // Buscar configurações do calendário
    const { data: calendar } = await this.context.supabase
      .from('calendars')
      .select('booking_settings, timezone')
      .eq('id', this.config.calendar_id)
      .single();

    if (!calendar) {
      return JSON.stringify({ 
        success: false, 
        error: 'Calendário não encontrado' 
      });
    }

    // Verificar se reagendamento é permitido
    const allowRescheduling = calendar.booking_settings?.allow_rescheduling ?? true;
    if (!allowRescheduling) {
      return JSON.stringify({ 
        success: false, 
        error: 'Reagendamento não permitido',
        message: 'A política desta agenda não permite reagendamentos. Entre em contato para mais informações.' 
      });
    }

    const bookingSettings = calendar.booking_settings || {};
    const minNoticeHours = bookingSettings.min_notice_hours || 24;
    const maxBookingDays = bookingSettings.max_booking_days || 60;

    // Validar antecedência mínima
    const newDateTime = new Date(`${new_date}T${new_time}:00`);
    const now = new Date();
    const hoursUntilAppointment = (newDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilAppointment < minNoticeHours) {
      return JSON.stringify({ 
        success: false, 
        error: `Reagendamento requer antecedência mínima de ${minNoticeHours} horas`,
        message: `Não é possível reagendar para este horário. É necessário pelo menos ${minNoticeHours} horas de antecedência.` 
      });
    }

    // Validar antecedência máxima
    const daysUntilAppointment = hoursUntilAppointment / 24;
    if (daysUntilAppointment > maxBookingDays) {
      return JSON.stringify({ 
        success: false, 
        error: `Reagendamento não pode ser feito com mais de ${maxBookingDays} dias de antecedência`,
        message: `A nova data está muito distante. O sistema permite agendar até ${maxBookingDays} dias no futuro.` 
      });
    }

    // Verificar se evento existe e pertence ao cliente
    const { data: event } = await this.context.supabase
      .from('calendar_events')
      .select('*, calendar:calendars(client_id)')
      .eq('id', event_id)
      .single();

    if (!event || event.calendar?.client_id !== this.context.client_id) {
      return JSON.stringify({ success: false, error: 'Evento não encontrado' });
    }

    // Calcular nova duração
    const oldStart = new Date(event.start_time);
    const oldEnd = new Date(event.end_time);
    const durationMinutes = Math.round((oldEnd.getTime() - oldStart.getTime()) / 60000);

    // Criar novos horários com conversão de timezone
    const timezone = calendar?.timezone || 'America/Sao_Paulo';
    
    const getTimeZoneOffset = (date: Date, tz: string): number => {
      const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const parts = dtf.formatToParts(date);
      const map: Record<string, string> = {};
      for (const p of parts) map[p.type] = p.value;
      const asUTC = Date.UTC(
        Number(map.year),
        Number(map.month) - 1,
        Number(map.day),
        Number(map.hour),
        Number(map.minute),
        Number(map.second)
      );
      return (asUTC - date.getTime()) / 60000;
    };

    const zonedToUTC = (dateISO: string, timeHM: string, tz: string): Date => {
      const [Y, M, D] = dateISO.split('-').map(Number);
      const [h, m] = timeHM.split(':').map(Number);
      const pretendUTC = new Date(Date.UTC(Y, M - 1, D, h, m, 0));
      const offsetMin = getTimeZoneOffset(pretendUTC, tz);
      return new Date(pretendUTC.getTime() - offsetMin * 60000);
    };

    const newStart = zonedToUTC(new_date, new_time, timezone);
    const newEnd = new Date(newStart);
    newEnd.setMinutes(newEnd.getMinutes() + durationMinutes);

    // Atualizar evento
    const { error } = await this.context.supabase
      .from('calendar_events')
      .update({
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString()
      })
      .eq('id', event_id);

    if (error) {
      return JSON.stringify({ success: false, error: error.message });
    }

    return JSON.stringify({ 
      success: true,
      message: `Agendamento reagendado para ${new Date(newStart).toLocaleDateString('pt-BR')} às ${new_time}`
    });
  }

  /**
   * Cancela um agendamento
   */
  private async cancelarAgendamento(args: any): Promise<string> {
    // Verificar se há calendar_id configurado
    if (!this.config.calendar_id) {
      return JSON.stringify({ 
        success: false, 
        error: 'Nenhuma agenda configurada para este agente',
        message: 'O agente não possui uma agenda configurada. Configure uma agenda nas ferramentas do agente para habilitar o sistema de agendamentos.' 
      });
    }

    const { event_id, reason = 'Cancelado pelo cliente' } = args;

    // Buscar configurações do calendário
    const { data: calendar } = await this.context.supabase
      .from('calendars')
      .select('booking_settings')
      .eq('id', this.config.calendar_id)
      .single();

    if (!calendar) {
      return JSON.stringify({ 
        success: false, 
        error: 'Calendário não encontrado' 
      });
    }

    // Verificar se cancelamento é permitido
    const allowCancellation = calendar.booking_settings?.allow_cancellation ?? true;
    if (!allowCancellation) {
      return JSON.stringify({ 
        success: false, 
        error: 'Cancelamento não permitido',
        message: 'A política desta agenda não permite cancelamentos. Entre em contato para mais informações.' 
      });
    }

    // Verificar se evento existe e pertence ao cliente
    const { data: event } = await this.context.supabase
      .from('calendar_events')
      .select('*, calendar:calendars(client_id)')
      .eq('id', event_id)
      .single();

    if (!event || event.calendar?.client_id !== this.context.client_id) {
      return JSON.stringify({ success: false, error: 'Evento não encontrado' });
    }

    // Atualizar status
    const { error } = await this.context.supabase
      .from('calendar_events')
      .update({
        status: 'cancelled',
        metadata: {
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason
        }
      })
      .eq('id', event_id);

    if (error) {
      return JSON.stringify({ success: false, error: error.message });
    }

    return JSON.stringify({ 
      success: true,
      message: `Agendamento cancelado com sucesso. Motivo: ${reason}`
    });
  }
}
