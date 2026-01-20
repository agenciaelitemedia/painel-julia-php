import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Settings, ExternalLink, Copy, Trash2 } from 'lucide-react';
import { useCalendars, Calendar as CalendarType } from '@/hooks/useCalendars';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CreateCalendarDialog } from '@/components/calendar/CreateCalendarDialog';
import { EditCalendarDialog } from '@/components/calendar/EditCalendarDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function CalendarManagement() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editCalendar, setEditCalendar] = useState<CalendarType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { calendars, isLoading, deleteCalendar } = useCalendars();

  const handleCopyLink = (slug: string) => {
    const baseUrl = window.location.origin;
    const bookingUrl = `${baseUrl}/booking/${slug}`;
    navigator.clipboard.writeText(bookingUrl);
    toast.success('Link copiado para a área de transferência!');
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCalendar.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Gerenciar Calendários</h1>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Calendário
          </Button>
        </div>

        {/* Lista de Calendários */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-32 bg-muted" />
                <CardContent className="h-24 bg-muted/50" />
              </Card>
            ))}
          </div>
        ) : calendars.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum calendário criado</h3>
              <p className="text-muted-foreground mb-4 text-center max-w-md">
                Crie seu primeiro calendário para começar a aceitar agendamentos online
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Calendário
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {calendars.map((calendar) => (
              <Card key={calendar.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: calendar.color }}
                        />
                        {calendar.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {calendar.description || 'Sem descrição'}
                      </CardDescription>
                    </div>
                    <Badge variant={calendar.is_public ? 'default' : 'secondary'}>
                      {calendar.is_public ? 'Público' : 'Privado'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Configurações */}
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Duração: {calendar.booking_settings?.duration || 30} min</div>
                      <div>Timezone: {calendar.timezone}</div>
                    </div>

                    {/* Link Público */}
                    {calendar.is_public && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(calendar.slug)}
                          className="flex-1"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/booking/${calendar.slug}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setEditCalendar(calendar)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteId(calendar.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Criar Calendário */}
        <CreateCalendarDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

        {/* Dialog de Editar Calendário */}
        {editCalendar && (
          <EditCalendarDialog 
            open={!!editCalendar} 
            onOpenChange={(open) => !open && setEditCalendar(null)}
            calendar={editCalendar}
          />
        )}

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Calendário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este calendário? Todos os eventos e
                agendamentos serão perdidos. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}
