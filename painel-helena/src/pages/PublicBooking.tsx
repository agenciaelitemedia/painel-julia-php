import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Clock, Loader2, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { format, addMinutes, parse, isSameDay, isAfter, isBefore, startOfDay, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getNowInBrazil } from "@/lib/utils/timezone";

const bookingSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  phone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export default function PublicBooking() {
  const { slug } = useParams<{ slug: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h');
  const [currentMonth, setCurrentMonth] = useState(getNowInBrazil());

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ["public-calendar", slug],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('public-get-calendar', {
        body: { slug },
      });
      if (error) throw error;
      return data as { calendar: any; availability: any[] };
    },
    enabled: !!slug,
  });

  const calendar = calendarData?.calendar;
  const availability = calendarData?.availability as any[] | undefined;

  // Auto-select today when calendar loads
  useEffect(() => {
    if (availability && availability.length > 0 && !selectedDate) {
      const today = getNowInBrazil();
      const todayDayOfWeek = today.getDay();
      const hasTodayAvailability = availability.some(a => a.day_of_week === todayDayOfWeek);
      
      if (hasTodayAvailability) {
        setSelectedDate(today);
      }
    }
  }, [availability, selectedDate]);

  const { data: bookedEvents } = useQuery({
    queryKey: ["public-calendar-events", slug, selectedDate?.toDateString()],
    queryFn: async () => {
      if (!selectedDate) return [] as { start_time: string; end_time: string; status?: string }[];

      const { data, error } = await supabase.functions.invoke('public-get-events', {
        body: { slug, date: selectedDate.toISOString() },
      });

      if (error) throw error;
      return (data as { events: { start_time: string; end_time: string; status?: string }[] }).events;
    },
    enabled: !!slug && !!selectedDate,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  // Calcular horários disponíveis
  const availableTimeSlots = () => {
    if (!selectedDate || !availability || !calendar) return [];

    const dayOfWeek = selectedDate.getDay();
    const dayAvailability = availability.filter(a => a.day_of_week === dayOfWeek);
    
    if (dayAvailability.length === 0) return [];

    const duration = (calendar.booking_settings as any)?.duration || 30;
    const slots: string[] = [];

    dayAvailability.forEach(slot => {
      const startTime = parse(slot.start_time, 'HH:mm:ss', selectedDate);
      const endTime = parse(slot.end_time, 'HH:mm:ss', selectedDate);
      
      let currentSlot = startTime;
      while (isBefore(currentSlot, endTime)) {
        const slotEnd = addMinutes(currentSlot, duration);
        
        if (!isAfter(slotEnd, endTime)) {
          const timeString = format(currentSlot, 'HH:mm');
          
          const isBooked = bookedEvents?.some(event => {
            const eventStart = new Date(event.start_time);
            const eventEnd = new Date(event.end_time);
            return (
              (isAfter(currentSlot, eventStart) || isSameDay(currentSlot, eventStart)) &&
              isBefore(currentSlot, eventEnd)
            );
          });

          if (!isBooked) {
            slots.push(timeString);
          }
        }
        
        currentSlot = addMinutes(currentSlot, duration);
      }
    });

    return slots;
  };

  const timeSlots = availableTimeSlots();

  const formatTime = (time: string) => {
    if (timeFormat === '24h') return time;
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!calendar || !selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    try {
      const [hours, minutes] = selectedTime.split(':');
      const datetime = new Date(selectedDate);
      datetime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { data: result, error: fnError } = await supabase.functions.invoke(
        'public-booking',
        {
          body: {
            calendar_slug: slug,
            booker_name: data.name,
            booker_phone: data.phone,
            booker_email: data.email || null,
            datetime: datetime.toISOString(),
            notes: data.notes || null,
          }
        }
      );

      if (fnError) {
        throw new Error(fnError.message || 'Erro ao criar agendamento');
      }

      setBookingSuccess(true);
      toast.success("Agendamento realizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao agendar:", error);
      toast.error(error.message || "Erro ao realizar agendamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!calendar) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Calendário não encontrado</CardTitle>
            <CardDescription>
              O link de agendamento que você está tentando acessar não existe ou não está mais disponível.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">✓ Agendamento Confirmado!</CardTitle>
            <CardDescription className="text-center">
              Você receberá uma confirmação via WhatsApp em breve.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Obrigado por agendar conosco!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'form' && selectedDate && selectedTime) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <Button
                variant="ghost"
                onClick={() => setStep('select')}
                className="mb-4 -ml-2"
              >
                ← Voltar
              </Button>
              <CardTitle>Confirme seus dados</CardTitle>
              <CardDescription>
                {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {selectedTime}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Seu nome completo"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone (WhatsApp) *</Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="(00) 00000-0000"
                    type="tel"
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    {...register("email")}
                    placeholder="seu@email.com"
                    type="email"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Textarea
                    id="notes"
                    {...register("notes")}
                    placeholder="Alguma informação adicional..."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    "Confirmar Agendamento"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr_340px]">
            {/* Coluna Esquerda - Info do Evento */}
            <div className="p-8 border-r border-border">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: calendar.color || "#000" }}
                >
                  {calendar.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {calendar.name}
                </div>
              </div>

              <h1 className="text-2xl font-semibold mb-4 leading-tight">
                {calendar.description || "Agendamento"}
              </h1>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{(calendar.booking_settings as any)?.duration || 30}min</span>
                </div>

                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>{calendar.timezone || "America/Sao_Paulo"}</span>
                </div>
              </div>
            </div>

            {/* Coluna Central - Calendário */}
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium capitalize">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedTime(undefined);
                }}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                disabled={(date) => {
                  if (isBefore(date, startOfDay(getNowInBrazil()))) return true;
                  const dayOfWeek = date.getDay();
                  const hasAvailability = availability?.some(a => a.day_of_week === dayOfWeek);
                  return !hasAvailability;
                }}
                className="pointer-events-auto w-full"
                locale={ptBR}
                classNames={{
                  months: "w-full",
                  month: "w-full",
                  caption: "hidden",
                  caption_label: "text-base font-medium",
                  nav: "hidden",
                  table: "w-full border-collapse",
                  head_row: "flex w-full mb-2",
                  head_cell: "flex-1 text-center text-xs font-normal text-muted-foreground uppercase",
                  row: "flex w-full mb-1",
                  cell: "flex-1 text-center p-0",
                  day: cn(
                    "w-full h-14 rounded-lg text-sm font-normal",
                    "hover:bg-muted transition-colors"
                  ),
                  day_selected: "bg-foreground text-background hover:bg-foreground/90 font-medium",
                  day_today: "font-semibold",
                  day_disabled: "text-muted-foreground/40 hover:bg-transparent cursor-not-allowed",
                }}
              />
            </div>

            {/* Coluna Direita - Horários */}
            <div className="p-8 border-l border-border bg-muted/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">
                  {selectedDate ? format(selectedDate, "EEE. dd", { locale: ptBR }) : "Horários"}
                </h3>
                <div className="flex gap-1 bg-muted rounded-md p-1">
                  <button
                    onClick={() => setTimeFormat('12h')}
                    className={cn(
                      "px-3 py-1 text-xs rounded transition-colors",
                      timeFormat === '12h' ? "bg-background shadow-sm" : "hover:bg-background/50"
                    )}
                  >
                    12h
                  </button>
                  <button
                    onClick={() => setTimeFormat('24h')}
                    className={cn(
                      "px-3 py-1 text-xs rounded transition-colors",
                      timeFormat === '24h' ? "bg-background shadow-sm" : "hover:bg-background/50"
                    )}
                  >
                    24h
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {!selectedDate ? (
                  <div className="flex items-center justify-center h-40">
                    <p className="text-sm text-muted-foreground text-center">
                      Selecione uma data
                    </p>
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="flex items-center justify-center h-40">
                    <p className="text-sm text-muted-foreground text-center">
                      Nenhum horário disponível
                    </p>
                  </div>
                ) : (
                  timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => {
                        setSelectedTime(time);
                        setStep('form');
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border bg-background hover:border-foreground/50 transition-colors text-sm font-medium"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      {formatTime(time)}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
