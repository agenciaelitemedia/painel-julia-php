import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCalendars } from '@/hooks/useCalendars';
import { useCalendarEvents, CalendarEvent } from '@/hooks/useCalendarEvents';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface CalendarEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  initialDate?: Date;
  calendarId?: string;
}

export function CalendarEventDialog({
  open,
  onOpenChange,
  event,
  initialDate = new Date(),
  calendarId,
}: CalendarEventDialogProps) {
  const { profile } = useAuth();
  const { calendars } = useCalendars();
  const { createEvent, updateEvent } = useCalendarEvents();

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', profile?.client_id],
    queryFn: async () => {
      if (!profile?.client_id) return [];
      const { data } = await supabase
        .from('contacts')
        .select('id, name, phone')
        .eq('client_id', profile.client_id)
        .order('name');
      return data || [];
    },
    enabled: !!profile?.client_id
  });

  const [formData, setFormData] = useState({
    calendar_id: (calendarId && calendarId !== 'all') ? calendarId : '',
    title: '',
    description: '',
    start_time: format(initialDate, "yyyy-MM-dd'T'HH:mm"),
    end_time: format(new Date(initialDate.getTime() + 30 * 60000), "yyyy-MM-dd'T'HH:mm"),
    location_type: 'physical' as 'physical' | 'virtual' | 'whatsapp',
    location_details: { address: '' },
    contact_id: '',
    status: 'scheduled' as 'scheduled' | 'confirmed' | 'cancelled' | 'completed',
  });

  useEffect(() => {
    if (event) {
      setFormData({
        calendar_id: event.calendar_id,
        title: event.title,
        description: event.description || '',
        start_time: format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm"),
        end_time: format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm"),
        location_type: event.location_type,
        location_details: event.location_details || { address: '' },
        contact_id: event.contact_id || '',
        status: event.status,
      });
    } else {
      setFormData({
        calendar_id: (calendarId && calendarId !== 'all') ? calendarId : '',
        title: '',
        description: '',
        start_time: format(initialDate, "yyyy-MM-dd'T'HH:mm"),
        end_time: format(new Date(initialDate.getTime() + 30 * 60000), "yyyy-MM-dd'T'HH:mm"),
        location_type: 'physical',
        location_details: { address: '' },
        contact_id: '',
        status: 'scheduled',
      });
    }
  }, [event, initialDate, calendarId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.calendar_id || formData.calendar_id === 'all') {
      toast.error('Selecione um calendário válido.');
      return;
    }

    const eventData = {
      ...formData,
      contact_id: formData.contact_id || null,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString(),
    };

    if (event) {
      await updateEvent.mutateAsync({ id: event.id, ...eventData });
    } else {
      await createEvent.mutateAsync(eventData as any);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
          <DialogDescription>
            {event ? 'Atualize as informações do evento' : 'Crie um novo evento no calendário'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="calendar_id">Calendário *</Label>
            <Select
              value={formData.calendar_id}
              onValueChange={(value) => setFormData({ ...formData, calendar_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um calendário" />
              </SelectTrigger>
              <SelectContent>
                {calendars.map((calendar) => (
                  <SelectItem key={calendar.id} value={calendar.id}>
                    {calendar.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Consulta com Dr. João"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Informações adicionais sobre o evento"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Data/Hora Início *</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">Data/Hora Fim *</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_id">Contato</Label>
            <Select
              value={formData.contact_id}
              onValueChange={(value) => setFormData({ ...formData, contact_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um contato (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name} ({contact.phone})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createEvent.isPending || updateEvent.isPending}>
              {event ? 'Atualizar' : 'Criar'} Evento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
