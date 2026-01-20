import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plus, Filter, Settings } from 'lucide-react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useCalendars } from '@/hooks/useCalendars';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarEventDialog } from '@/components/calendar/CalendarEventDialog';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function Calendar() {
  const navigate = useNavigate();
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const { calendars } = useCalendars();
  const { events, isLoading } = useCalendarEvents(selectedCalendarId && selectedCalendarId !== 'all' ? selectedCalendarId : undefined);

  const calendarEvents = events.map((event) => ({
    ...event,
    title: event.title,
    start: new Date(event.start_time),
    end: new Date(event.end_time),
    resource: event,
  }));

  const handleSelectSlot = ({ start }: any) => {
    setSelectedDate(start);
    setIsCreateEventOpen(true);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event.resource);
    setIsCreateEventOpen(true);
  };

  return (
    <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Calendário</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedCalendarId} onValueChange={setSelectedCalendarId}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todos os calendários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os calendários</SelectItem>
                {calendars.map((calendar) => (
                  <SelectItem key={calendar.id} value={calendar.id}>
                    {calendar.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => navigate('/calendar/manage')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Gerenciar Calendários
            </Button>
            <Button onClick={() => setIsCreateEventOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
          </div>
        </div>

        {/* Calendário */}
        <Card className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                <p className="text-muted-foreground">Carregando eventos...</p>
              </div>
            </div>
          ) : (
            <BigCalendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              culture="pt-BR"
              messages={{
                next: 'Próximo',
                previous: 'Anterior',
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia',
                agenda: 'Agenda',
                date: 'Data',
                time: 'Hora',
                event: 'Evento',
                noEventsInRange: 'Não há eventos neste período.',
                showMore: (total) => `+ Ver mais (${total})`,
              }}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              eventPropGetter={(event) => ({
                style: {
                  backgroundColor:
                    event.resource.status === 'confirmed'
                      ? 'hsl(var(--primary))'
                      : event.resource.status === 'cancelled'
                      ? 'hsl(var(--destructive))'
                      : 'hsl(var(--secondary))',
                },
              })}
            />
          )}
        </Card>

        {/* Dialog de Criar/Editar Evento */}
        <CalendarEventDialog
          open={isCreateEventOpen}
          onOpenChange={(open) => {
            setIsCreateEventOpen(open);
            if (!open) {
              setSelectedEvent(null);
              setSelectedDate(new Date());
            }
          }}
          event={selectedEvent}
          initialDate={selectedDate}
          calendarId={selectedCalendarId && selectedCalendarId !== 'all' ? selectedCalendarId : undefined}
        />
      </div>
  );
}
