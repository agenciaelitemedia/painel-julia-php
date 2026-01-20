import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useCalendars, useCalendarAvailability, Calendar } from "@/hooks/useCalendars";
import { useWhatsAppInstances } from "@/hooks/useWhatsAppInstances";
import { CalendarAvailabilityConfig } from "./CalendarAvailabilityConfig";
import { Loader2 } from "lucide-react";

interface EditCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendar: Calendar;
}

export function EditCalendarDialog({ open, onOpenChange, calendar }: EditCalendarDialogProps) {
  const { updateCalendar } = useCalendars();
  const { availability, saveAvailability } = useCalendarAvailability(calendar.id);
  const { instances } = useWhatsAppInstances();
  const [activeTab, setActiveTab] = useState("general");
  
  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: {
      name: calendar.name,
      description: calendar.description || "",
      color: calendar.color,
      timezone: calendar.timezone,
      is_public: calendar.is_public,
      duration: calendar.booking_settings.duration,
      buffer_time: calendar.booking_settings.buffer_time,
      max_events_per_day: calendar.booking_settings.max_events_per_day,
      min_notice_hours: calendar.booking_settings.min_notice_hours || 24,
      max_booking_days: calendar.booking_settings.max_booking_days || 60,
      allow_rescheduling: calendar.booking_settings.allow_rescheduling ?? true,
      allow_cancellation: calendar.booking_settings.allow_cancellation ?? true,
      immediate_confirmation: calendar.notification_settings?.immediate_confirmation ?? true,
      reminder_24h: calendar.notification_settings?.reminder_24h ?? true,
      reminder_1h: calendar.notification_settings?.reminder_1h ?? true,
      reminder_at_time: calendar.notification_settings?.reminder_at_time ?? false,
      confirmation_template: calendar.notification_settings?.confirmation_template || 
        "Olá {nome}! Seu agendamento para {data} às {horario} foi confirmado. 📅",
      reminder_24h_template: calendar.notification_settings?.reminder_24h_template || 
        "Olá {nome}! Lembrete: você tem um agendamento amanhã às {horario}. 📅",
      reminder_1h_template: calendar.notification_settings?.reminder_1h_template || 
        "Olá {nome}! Seu agendamento começa em 1 hora ({horario}). 📅",
      reminder_at_time_template: calendar.notification_settings?.reminder_at_time_template || 
        "Olá {nome}! Seu agendamento é agora ({horario}). 📅",
      instance_id: calendar.notification_settings?.instance_id || "",
    }
  });

  const isPublic = watch("is_public");

  const onSubmit = async (data: any) => {
    try {
      await updateCalendar.mutateAsync({
        id: calendar.id,
        name: data.name,
        description: data.description,
        color: data.color,
        timezone: data.timezone,
        is_public: data.is_public,
        booking_settings: {
          duration: data.duration,
          buffer_time: data.buffer_time,
          max_events_per_day: data.max_events_per_day,
          min_notice_hours: data.min_notice_hours,
          max_booking_days: data.max_booking_days,
          allow_rescheduling: data.allow_rescheduling,
          allow_cancellation: data.allow_cancellation,
        },
        notification_settings: {
          immediate_confirmation: data.immediate_confirmation,
          reminder_24h: data.reminder_24h,
          reminder_1h: data.reminder_1h,
          reminder_at_time: data.reminder_at_time,
          confirmation_template: data.confirmation_template,
          reminder_24h_template: data.reminder_24h_template,
          reminder_1h_template: data.reminder_1h_template,
          reminder_at_time_template: data.reminder_at_time_template,
          instance_id: data.instance_id || null,
        }
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar calendário:", error);
      toast.error("Erro ao atualizar calendário");
    }
  };

  const handleAvailabilitySave = async (slots: any[]) => {
    try {
      await saveAvailability.mutateAsync(slots);
    } catch (error) {
      console.error("Erro ao salvar disponibilidade:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Calendário</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="booking">Agendamento</TabsTrigger>
              <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
              <TabsTrigger value="notifications">Notificações</TabsTrigger>
              <TabsTrigger value="agent">WhatsApp</TabsTrigger>
            </TabsList>

            {/* Aba 1: Informações Gerais */}
            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Calendário</Label>
                <Input id="name" {...register("name", { required: true })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" {...register("description")} rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Cor</Label>
                  <Input id="color" type="color" {...register("color")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select 
                    value={watch("timezone")} 
                    onValueChange={(value) => setValue("timezone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                      <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tóquio (GMT+9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Calendário Público</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite agendamentos via link público
                  </p>
                </div>
                <Switch 
                  checked={isPublic} 
                  onCheckedChange={(checked) => setValue("is_public", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Link Público</Label>
                <div className="flex gap-2">
                  <Input 
                    value={`${window.location.origin}/booking/${calendar.slug}`} 
                    readOnly 
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/booking/${calendar.slug}`);
                      toast.success("Link copiado!");
                    }}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Aba 2: Configurações de Agendamento */}
            <TabsContent value="booking" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duração Padrão (minutos)</Label>
                  <Select 
                    value={watch("duration").toString()} 
                    onValueChange={(value) => setValue("duration", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                      <SelectItem value="90">90 minutos</SelectItem>
                      <SelectItem value="120">120 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buffer_time">Tempo de Intervalo (minutos)</Label>
                  <Select 
                    value={watch("buffer_time").toString()} 
                    onValueChange={(value) => setValue("buffer_time", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sem intervalo</SelectItem>
                      <SelectItem value="5">5 minutos</SelectItem>
                      <SelectItem value="10">10 minutos</SelectItem>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_events">Limite de Eventos por Dia</Label>
                <Input 
                  id="max_events" 
                  type="number" 
                  min="1" 
                  max="50" 
                  {...register("max_events_per_day", { valueAsNumber: true })} 
                />
                <p className="text-sm text-muted-foreground">
                  Máximo de agendamentos permitidos em um único dia
                </p>
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Configurações Adicionais</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_notice">Antecedência Mínima (horas)</Label>
                    <Input 
                      id="min_notice" 
                      type="number" 
                      min="0" 
                      {...register("min_notice_hours", { valueAsNumber: true })} 
                    />
                    <p className="text-xs text-muted-foreground">
                      Quanto tempo antes o cliente pode agendar
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_booking">Antecedência Máxima (dias)</Label>
                    <Input 
                      id="max_booking" 
                      type="number" 
                      min="1" 
                      {...register("max_booking_days", { valueAsNumber: true })} 
                    />
                    <p className="text-xs text-muted-foreground">
                      Até quantos dias no futuro aceitar agendamentos
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Permitir Reagendamento</Label>
                      <p className="text-xs text-muted-foreground">
                        Cliente pode remarcar seu agendamento
                      </p>
                    </div>
                    <Switch 
                      checked={watch("allow_rescheduling")} 
                      onCheckedChange={(checked) => setValue("allow_rescheduling", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Permitir Cancelamento</Label>
                      <p className="text-xs text-muted-foreground">
                        Cliente pode cancelar seu agendamento
                      </p>
                    </div>
                    <Switch 
                      checked={watch("allow_cancellation")} 
                      onCheckedChange={(checked) => setValue("allow_cancellation", checked)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Aba 3: Disponibilidade */}
            <TabsContent value="availability" className="space-y-4">
              <CalendarAvailabilityConfig 
                calendarId={calendar.id}
                availability={availability}
                onSave={handleAvailabilitySave}
              />
            </TabsContent>

            {/* Aba 4: Notificações */}
            <TabsContent value="notifications" className="space-y-4">
              <div className="space-y-6">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Variáveis Disponíveis</h4>
                  <p className="text-sm text-muted-foreground">
                    Use estas variáveis em suas mensagens: <code className="px-1 py-0.5 bg-background rounded">{"{nome}"}</code>, 
                    <code className="px-1 py-0.5 bg-background rounded ml-1">{"{data}"}</code>, 
                    <code className="px-1 py-0.5 bg-background rounded ml-1">{"{horario}"}</code>, 
                    <code className="px-1 py-0.5 bg-background rounded ml-1">{"{local}"}</code>
                  </p>
                </div>

                {/* Confirmação Imediata */}
                <div className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-medium">Confirmação Imediata</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviada assim que o agendamento é criado
                      </p>
                    </div>
                    <Switch 
                      checked={watch("immediate_confirmation")} 
                      onCheckedChange={(checked) => setValue("immediate_confirmation", checked)}
                    />
                  </div>
                  {watch("immediate_confirmation") && (
                    <div className="space-y-2">
                      <Label>Mensagem de Confirmação</Label>
                      <Textarea 
                        {...register("confirmation_template")}
                        rows={3}
                        placeholder="Ex: Olá {nome}! Seu agendamento para {data} às {horario} foi confirmado."
                      />
                    </div>
                  )}
                </div>

                {/* Lembrete 24h */}
                <div className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-medium">Lembrete 24 Horas Antes</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviado um dia antes do agendamento
                      </p>
                    </div>
                    <Switch 
                      checked={watch("reminder_24h")} 
                      onCheckedChange={(checked) => setValue("reminder_24h", checked)}
                    />
                  </div>
                  {watch("reminder_24h") && (
                    <div className="space-y-2">
                      <Label>Mensagem do Lembrete</Label>
                      <Textarea 
                        {...register("reminder_24h_template")}
                        rows={3}
                        placeholder="Ex: Olá {nome}! Lembrete: você tem um agendamento amanhã às {horario}."
                      />
                    </div>
                  )}
                </div>

                {/* Lembrete 1h */}
                <div className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-medium">Lembrete 1 Hora Antes</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviado uma hora antes do agendamento
                      </p>
                    </div>
                    <Switch 
                      checked={watch("reminder_1h")} 
                      onCheckedChange={(checked) => setValue("reminder_1h", checked)}
                    />
                  </div>
                  {watch("reminder_1h") && (
                    <div className="space-y-2">
                      <Label>Mensagem do Lembrete</Label>
                      <Textarea 
                        {...register("reminder_1h_template")}
                        rows={3}
                        placeholder="Ex: Olá {nome}! Seu agendamento começa em 1 hora ({horario})."
                      />
                    </div>
                  )}
                </div>

                {/* Lembrete na Hora */}
                <div className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-medium">Lembrete na Hora</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviado no momento do agendamento
                      </p>
                    </div>
                    <Switch 
                      checked={watch("reminder_at_time")} 
                      onCheckedChange={(checked) => setValue("reminder_at_time", checked)}
                    />
                  </div>
                  {watch("reminder_at_time") && (
                    <div className="space-y-2">
                      <Label>Mensagem do Lembrete</Label>
                      <Textarea 
                        {...register("reminder_at_time_template")}
                        rows={3}
                        placeholder="Ex: Olá {nome}! Seu agendamento é agora ({horario})."
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Aba 5: Conexão WhatsApp */}
            <TabsContent value="agent" className="space-y-4">
              <div className="space-y-6">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Integração WhatsApp</h4>
                  <p className="text-sm text-muted-foreground">
                    Selecione a instância WhatsApp que será usada para enviar as notificações automáticas dos agendamentos.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="instance">Instância WhatsApp</Label>
                    <Select 
                      value={watch("instance_id") || undefined} 
                      onValueChange={(value) => setValue("instance_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma instância" />
                      </SelectTrigger>
                      <SelectContent>
                        {(instances || []).map((instance) => (
                          <SelectItem key={instance.id} value={instance.id}>
                            {instance.instance_name} ({instance.phone_number || 'Sem número'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      A instância de onde as mensagens serão enviadas
                    </p>
                  </div>

                  {!watch("instance_id") && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ As notificações só serão enviadas quando você selecionar uma instância WhatsApp.
                      </p>
                    </div>
                  )}

                  {watch("instance_id") && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        ✓ Configuração completa! As notificações serão enviadas automaticamente.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
