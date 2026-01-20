import { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { useCalendars } from '@/hooks/useCalendars';

interface CreateCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCalendarDialog({ open, onOpenChange }: CreateCalendarDialogProps) {
  const { createCalendar } = useCalendars();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: true,
    color: '#6366f1',
    timezone: 'America/Sao_Paulo',
    booking_settings: {
      duration: 30,
      buffer_time: 0,
      max_events_per_day: 10,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCalendar.mutateAsync(formData);
    onOpenChange(false);
    setFormData({
      name: '',
      description: '',
      is_public: true,
      color: '#6366f1',
      timezone: 'America/Sao_Paulo',
      booking_settings: {
        duration: 30,
        buffer_time: 0,
        max_events_per_day: 10,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Calendário</DialogTitle>
          <DialogDescription>
            Crie um novo calendário para aceitar agendamentos online
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Consultas, Reuniões"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Breve descrição do calendário"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Cor</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#6366f1"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duração padrão (minutos)</Label>
            <Input
              id="duration"
              type="number"
              min="15"
              step="15"
              value={formData.booking_settings.duration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  booking_settings: {
                    ...formData.booking_settings,
                    duration: parseInt(e.target.value),
                  },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="is_public">Calendário Público</Label>
              <p className="text-sm text-muted-foreground">
                Permitir agendamentos através de link público
              </p>
            </div>
            <Switch
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createCalendar.isPending}>
              Criar Calendário
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
