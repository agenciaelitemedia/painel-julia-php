import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface Calendar {
  id: string;
  client_id: string;
  name: string;
  slug: string;
  description: string | null;
  timezone: string;
  is_public: boolean;
  booking_settings: {
    duration: number;
    buffer_time: number;
    max_events_per_day: number;
    min_notice_hours?: number;
    max_booking_days?: number;
    allow_rescheduling?: boolean;
    allow_cancellation?: boolean;
  };
  notification_settings?: {
    immediate_confirmation?: boolean;
    reminder_24h?: boolean;
    reminder_1h?: boolean;
    reminder_at_time?: boolean;
    confirmation_template?: string;
    reminder_24h_template?: string;
    reminder_1h_template?: string;
    reminder_at_time_template?: string;
    instance_id?: string;
  };
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarAvailability {
  id: string;
  calendar_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export function useCalendars() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: calendars, isLoading } = useQuery({
    queryKey: ['calendars', profile?.client_id],
    queryFn: async () => {
      if (!profile?.client_id) return [];
      
      const { data, error } = await supabase
        .from('calendars')
        .select('*')
        .eq('client_id', profile.client_id)
        .order('name');

      if (error) throw error;
      return data as Calendar[];
    },
    enabled: !!profile?.client_id
  });

  const createCalendar = useMutation({
    mutationFn: async (calendar: Omit<Partial<Calendar>, 'client_id'>) => {
      if (!profile?.client_id) throw new Error('Cliente não encontrado');

      // Gerar slug único
      const slug = `${profile.client_id.slice(0, 8)}-${calendar.name?.toLowerCase().replace(/\s+/g, '-')}`;

      const { data, error } = await supabase
        .from('calendars')
        .insert([{
          name: calendar.name!,
          slug,
          client_id: profile.client_id,
          description: calendar.description,
          timezone: calendar.timezone || 'America/Sao_Paulo',
          is_public: calendar.is_public || false,
          booking_settings: calendar.booking_settings,
          color: calendar.color || '#6366f1'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      toast.success('Calendário criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar calendário:', error);
      toast.error('Erro ao criar calendário');
    }
  });

  const updateCalendar = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Calendar> & { id: string }) => {
      const { data, error } = await supabase
        .from('calendars')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      toast.success('Calendário atualizado!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar calendário:', error);
      toast.error('Erro ao atualizar calendário');
    }
  });

  const deleteCalendar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('calendars')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      toast.success('Calendário excluído!');
    },
    onError: (error) => {
      console.error('Erro ao excluir calendário:', error);
      toast.error('Erro ao excluir calendário');
    }
  });

  return {
    calendars: calendars || [],
    isLoading,
    createCalendar,
    updateCalendar,
    deleteCalendar
  };
}

export function useCalendarAvailability(calendarId: string) {
  const queryClient = useQueryClient();

  const { data: availability, isLoading } = useQuery({
    queryKey: ['calendar-availability', calendarId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_availability')
        .select('*')
        .eq('calendar_id', calendarId)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      return data as CalendarAvailability[];
    },
    enabled: !!calendarId
  });

  const saveAvailability = useMutation({
    mutationFn: async (slots: Omit<CalendarAvailability, 'id' | 'created_at'>[]) => {
      // Deletar slots antigos
      await supabase
        .from('calendar_availability')
        .delete()
        .eq('calendar_id', calendarId);

      // Inserir novos slots
      const { data, error } = await supabase
        .from('calendar_availability')
        .insert(slots);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-availability', calendarId] });
      toast.success('Disponibilidade atualizada!');
    },
    onError: (error) => {
      console.error('Erro ao salvar disponibilidade:', error);
      toast.error('Erro ao salvar disponibilidade');
    }
  });

  return {
    availability: availability || [],
    isLoading,
    saveAvailability
  };
}
