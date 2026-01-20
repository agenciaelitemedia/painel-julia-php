import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface CalendarEvent {
  id: string;
  client_id: string;
  calendar_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location_type: 'physical' | 'virtual' | 'whatsapp';
  location_details: any;
  contact_id: string | null;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  created_by: string;
  metadata: any;
  created_at: string;
  updated_at: string;
  contacts?: {
    id: string;
    name: string;
    phone: string;
  };
}

export interface EventNotification {
  id: string;
  event_id: string;
  agent_id: string | null;
  type: string;
  trigger_time: string;
  message_template: string;
  media_type: 'text' | 'image' | 'video' | 'location' | 'document';
  media_url: string | null;
  media_caption: string | null;
  location_data: any;
  status: 'pending' | 'sent' | 'failed';
  sent_at: string | null;
  error_message: string | null;
}

export function useCalendarEvents(calendarId?: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ['calendar-events', profile?.client_id, calendarId],
    queryFn: async () => {
      if (!profile?.client_id) return [];
      
      let query = supabase
        .from('calendar_events')
        .select(`
          *,
          contacts (
            id,
            name,
            phone
          )
        `)
        .eq('client_id', profile.client_id)
        .order('start_time');

      if (calendarId && calendarId !== 'all') {
        query = query.eq('calendar_id', calendarId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!profile?.client_id
  });

  const createEvent = useMutation({
    mutationFn: async (event: Omit<Partial<CalendarEvent>, 'client_id' | 'created_by'>) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user || !profile?.client_id) throw new Error('Usuário não autenticado');

      const calId = event.calendar_id;
      if (!calId || calId === 'all') {
        throw new Error('Calendário inválido. Selecione um calendário.');
      }
      const contactId = event.contact_id && event.contact_id !== '' ? event.contact_id : null;

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([{
          client_id: profile.client_id,
          created_by: user.user.id,
          calendar_id: calId,
          title: event.title!,
          description: event.description ?? null,
          start_time: event.start_time!,
          end_time: event.end_time!,
          location_type: event.location_type || 'physical',
          location_details: event.location_details ?? {},
          contact_id: contactId,
          status: event.status || 'scheduled',
          metadata: event.metadata ?? {}
        }])
        .select(`
          *,
          contacts (
            id,
            name,
            phone
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Evento criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar evento:', error);
      toast.error(`Erro ao criar evento: ${(error as any)?.message ?? 'Verifique os campos'}`);
    }
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CalendarEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          contacts (
            id,
            name,
            phone
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Evento atualizado!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar evento:', error);
      toast.error('Erro ao atualizar evento');
    }
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Evento excluído!');
    },
    onError: (error) => {
      console.error('Erro ao excluir evento:', error);
      toast.error('Erro ao excluir evento');
    }
  });

  return {
    events: events || [],
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent
  };
}

export function useEventNotifications(eventId: string) {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['event-notifications', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_notifications')
        .select('*')
        .eq('event_id', eventId)
        .order('trigger_time');

      if (error) throw error;
      return data as EventNotification[];
    },
    enabled: !!eventId
  });

  const createNotification = useMutation({
    mutationFn: async (notification: Omit<EventNotification, 'id' | 'created_at' | 'status' | 'sent_at' | 'error_message'>) => {
      const { data, error } = await supabase
        .from('event_notifications')
        .insert(notification)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-notifications', eventId] });
      toast.success('Notificação configurada!');
    },
    onError: (error) => {
      console.error('Erro ao criar notificação:', error);
      toast.error('Erro ao configurar notificação');
    }
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('event_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-notifications', eventId] });
      toast.success('Notificação removida!');
    },
    onError: (error) => {
      console.error('Erro ao remover notificação:', error);
      toast.error('Erro ao remover notificação');
    }
  });

  return {
    notifications: notifications || [],
    isLoading,
    createNotification,
    deleteNotification
  };
}
