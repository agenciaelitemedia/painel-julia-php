import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { CalendarAvailability } from "@/hooks/useCalendars";

interface TimeSlot {
  start_time: string;
  end_time: string;
}

interface DayAvailability {
  day_of_week: number;
  is_available: boolean;
  slots: TimeSlot[];
}

interface CalendarAvailabilityConfigProps {
  calendarId: string;
  availability: CalendarAvailability[];
  onSave: (slots: any[]) => Promise<void>;
}

const DAYS = [
  { number: 0, name: "Domingo" },
  { number: 1, name: "Segunda-feira" },
  { number: 2, name: "Terça-feira" },
  { number: 3, name: "Quarta-feira" },
  { number: 4, name: "Quinta-feira" },
  { number: 5, name: "Sexta-feira" },
  { number: 6, name: "Sábado" },
];

export function CalendarAvailabilityConfig({ 
  calendarId, 
  availability, 
  onSave 
}: CalendarAvailabilityConfigProps) {
  const [days, setDays] = useState<DayAvailability[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Inicializar dias com disponibilidade existente ou padrão
    const initialDays = DAYS.map(day => {
      const existingSlots = availability.filter(a => a.day_of_week === day.number);
      
      if (existingSlots.length > 0) {
        return {
          day_of_week: day.number,
          is_available: existingSlots.some(s => s.is_available),
          slots: existingSlots.map(s => ({
            start_time: s.start_time,
            end_time: s.end_time
          }))
        };
      }
      
      // Padrão: dias úteis 9h-18h
      const isWeekday = day.number >= 1 && day.number <= 5;
      return {
        day_of_week: day.number,
        is_available: isWeekday,
        slots: isWeekday ? [{ start_time: "09:00", end_time: "18:00" }] : []
      };
    });
    
    setDays(initialDays);
  }, [availability]);

  const toggleDay = (dayIndex: number) => {
    setDays(prev => prev.map((day, idx) => {
      if (idx === dayIndex) {
        const newIsAvailable = !day.is_available;
        return {
          ...day,
          is_available: newIsAvailable,
          slots: newIsAvailable && day.slots.length === 0 
            ? [{ start_time: "09:00", end_time: "18:00" }] 
            : day.slots
        };
      }
      return day;
    }));
  };

  const addSlot = (dayIndex: number) => {
    setDays(prev => prev.map((day, idx) => {
      if (idx === dayIndex) {
        return {
          ...day,
          slots: [...day.slots, { start_time: "09:00", end_time: "18:00" }]
        };
      }
      return day;
    }));
  };

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    setDays(prev => prev.map((day, idx) => {
      if (idx === dayIndex) {
        const newSlots = day.slots.filter((_, sIdx) => sIdx !== slotIndex);
        return {
          ...day,
          slots: newSlots,
          is_available: newSlots.length > 0 ? day.is_available : false
        };
      }
      return day;
    }));
  };

  const updateSlot = (dayIndex: number, slotIndex: number, field: 'start_time' | 'end_time', value: string) => {
    setDays(prev => prev.map((day, idx) => {
      if (idx === dayIndex) {
        const newSlots = day.slots.map((slot, sIdx) => {
          if (sIdx === slotIndex) {
            return { ...slot, [field]: value };
          }
          return slot;
        });
        return { ...day, slots: newSlots };
      }
      return day;
    }));
  };

  const copyToAllDays = (dayIndex: number) => {
    const sourceDay = days[dayIndex];
    setDays(prev => prev.map(day => ({
      ...day,
      is_available: sourceDay.is_available,
      slots: [...sourceDay.slots]
    })));
    toast.success("Horários copiados para todos os dias!");
  };

  const copyToWeekdays = (dayIndex: number) => {
    const sourceDay = days[dayIndex];
    setDays(prev => prev.map((day, idx) => {
      // Dias úteis: segunda (1) a sexta (5)
      if (day.day_of_week >= 1 && day.day_of_week <= 5) {
        return {
          ...day,
          is_available: sourceDay.is_available,
          slots: [...sourceDay.slots]
        };
      }
      return day;
    }));
    toast.success("Horários copiados para dias úteis!");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const slots = days.flatMap(day => {
        if (!day.is_available || day.slots.length === 0) return [];
        
        return day.slots.map(slot => ({
          calendar_id: calendarId,
          day_of_week: day.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: true
        }));
      });

      await onSave(slots);
      toast.success("Disponibilidade salva com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar disponibilidade");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {days.map((day, dayIndex) => (
          <div key={day.day_of_week} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch 
                  checked={day.is_available} 
                  onCheckedChange={() => toggleDay(dayIndex)}
                />
                <Label className="font-medium">{DAYS[dayIndex].name}</Label>
              </div>
              
              {day.is_available && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => copyToWeekdays(dayIndex)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar p/ Dias Úteis
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => copyToAllDays(dayIndex)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar p/ Todos
                  </Button>
                </div>
              )}
            </div>

            {day.is_available && (
              <div className="space-y-2 ml-8">
                {day.slots.map((slot, slotIndex) => (
                  <div key={slotIndex} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={slot.start_time}
                      onChange={(e) => updateSlot(dayIndex, slotIndex, 'start_time', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">até</span>
                    <Input
                      type="time"
                      value={slot.end_time}
                      onChange={(e) => updateSlot(dayIndex, slotIndex, 'end_time', e.target.value)}
                      className="w-32"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeSlot(dayIndex, slotIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addSlot(dayIndex)}
                  className="mt-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar Horário
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Button 
        type="button" 
        onClick={handleSave} 
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? "Salvando..." : "Salvar Disponibilidade"}
      </Button>
    </div>
  );
}
