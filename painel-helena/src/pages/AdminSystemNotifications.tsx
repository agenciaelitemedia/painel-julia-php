import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSystemNotificationConfig } from "@/hooks/useSystemNotificationConfig";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, CheckCircle2, XCircle, Clock, Phone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSystemNotifications() {
  const {
    defaultInstance,
    notificationInstances,
    logs,
    isLoading,
    setDefaultInstance,
    toggleNotificationInstance,
  } = useSystemNotificationConfig();

  const handleSetDefault = (instanceId: string) => {
    if (instanceId !== 'none') {
      setDefaultInstance.mutate(instanceId);
    }
  };

  const handleToggleNotification = (instanceId: string, currentlyEnabled: boolean) => {
    toggleNotificationInstance.mutate({ 
      instanceId, 
      enable: !currentlyEnabled 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20"><CheckCircle2 className="w-3 h-3 mr-1" />Enviada</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'landing_subscription': 'Assinatura Landing',
      'access_credentials': 'Credenciais de Acesso',
      'asaas_invoice': 'Fatura Asaas',
      'asaas_subscription': 'Assinatura Asaas',
      'calendar_booking': 'Agendamento',
      'system': 'Sistema',
    };
    return types[type] || type;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notificações do Sistema</h1>
        <p className="text-muted-foreground">
          Configure a conexão do WhatsApp para envio de notificações do sistema e da landing page
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Conexões de Notificação
          </CardTitle>
          <CardDescription>
            Gerencie as conexões disponíveis para envio de notificações do sistema e da landing page.
            Estas conexões são compartilhadas entre todos os administradores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Conexão Padrão</label>
                <Select
                  value={defaultInstance?.id || 'none'}
                  onValueChange={handleSetDefault}
                  disabled={setDefaultInstance.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conexão padrão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>Nenhuma conexão</SelectItem>
                    {notificationInstances?.map((instance) => (
                      <SelectItem key={instance.id} value={instance.id}>
                        {instance.instance_name} ({instance.phone_number || instance.instance_id}) - {instance.client?.name || 'Sem nome'} - {instance.status}
                        {instance.is_default_notification && ' ⭐ Padrão'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  A conexão padrão será usada primeiro. Em caso de falha, outras conexões de notificação serão tentadas automaticamente.
                </p>
              </div>

              {defaultInstance && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="font-medium">Conexão Padrão Configurada</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Instância:</strong> {defaultInstance.instance_name}</p>
                    <p><strong>Telefone:</strong> {defaultInstance.phone_number || defaultInstance.instance_id}</p>
                    <p><strong>Cliente:</strong> {defaultInstance.clients?.name}</p>
                    <p><strong>Status:</strong> {defaultInstance.status}</p>
                  </div>
                </div>
              )}

              {notificationInstances && notificationInstances.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Todas as Conexões de Notificação</label>
                  <div className="space-y-2">
                    {notificationInstances.map((instance) => (
                      <div key={instance.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{instance.instance_name}</span>
                            {instance.is_default_notification && (
                              <Badge variant="default">Padrão</Badge>
                            )}
                            <Badge variant={instance.status === 'connected' ? 'default' : 'secondary'}>
                              {instance.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {instance.phone_number || instance.instance_id} • {instance.client?.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Logs de Notificações
          </CardTitle>
          <CardDescription>
            Histórico das últimas 100 notificações enviadas pelo sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mensagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getNotificationTypeLabel(log.notification_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.recipient_phone}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate text-sm text-muted-foreground">
                          {log.message_content.substring(0, 100)}
                          {log.message_content.length > 100 && '...'}
                        </div>
                        {log.error_message && (
                          <div className="text-xs text-destructive mt-1">
                            {log.error_message}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum log de notificação encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
