import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Search, Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WebhookLog {
  id: string;
  created_at: string;
  event_type: string;
  provider: string;
  instance_token?: string;
  resolved_client_id?: string;
  resolved_instance_id?: string;
  resolution_method?: string;
  phone?: string;
  remote_jid?: string;
  contact_name?: string;
  message_type?: string;
  is_from_me?: boolean;
  is_group?: boolean;
  request_headers: any;
  request_body: any;
  processing_status: string;
  error_message?: string;
  processing_time_ms?: number;
}

export default function WebhookLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["webhook-logs", searchQuery, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("webhook_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") {
        query = query.eq("processing_status", statusFilter);
      }

      if (searchQuery) {
        query = query.or(
          `phone.ilike.%${searchQuery}%,contact_name.ilike.%${searchQuery}%,event_type.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as WebhookLog[];
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      success: "default",
      failed: "destructive",
      received: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logs do Webhook</h1>
          <p className="text-muted-foreground">
            Monitore todos os eventos recebidos pelo webhook em tempo real
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por telefone, nome do contato ou tipo de evento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="failed">Falha</SelectItem>
                <SelectItem value="received">Recebido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eventos Recentes ({logs?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando logs...
              </div>
            ) : logs && logs.length > 0 ? (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.processing_status)}
                          <span className="font-medium">{log.event_type}</span>
                          {getStatusBadge(log.processing_status)}
                          <Badge variant="outline">{log.provider}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          {log.contact_name && (
                            <div>
                              <span className="font-medium">Contato:</span> {log.contact_name}
                            </div>
                          )}
                          {log.phone && (
                            <div>
                              <span className="font-medium">Telefone:</span> {log.phone}
                            </div>
                          )}
                          {log.message_type && (
                            <div>
                              <span className="font-medium">Tipo:</span> {log.message_type}
                            </div>
                          )}
                          {log.processing_time_ms !== null && (
                            <div>
                              <span className="font-medium">Tempo:</span> {log.processing_time_ms}ms
                            </div>
                          )}
                        </div>

                        {log.error_message && (
                          <div className="text-sm text-destructive">
                            ⚠️ {log.error_message}
                          </div>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum log encontrado
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Evento</DialogTitle>
            <DialogDescription>
              {selectedLog && formatDistanceToNow(new Date(selectedLog.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  {getStatusBadge(selectedLog.processing_status)}
                </div>
                <div>
                  <span className="font-medium">Provedor:</span> {selectedLog.provider}
                </div>
                <div>
                  <span className="font-medium">Tipo de Evento:</span> {selectedLog.event_type}
                </div>
                <div>
                  <span className="font-medium">Método de Resolução:</span>{" "}
                  {selectedLog.resolution_method || "N/A"}
                </div>
                {selectedLog.phone && (
                  <div>
                    <span className="font-medium">Telefone:</span> {selectedLog.phone}
                  </div>
                )}
                {selectedLog.contact_name && (
                  <div>
                    <span className="font-medium">Nome do Contato:</span> {selectedLog.contact_name}
                  </div>
                )}
                {selectedLog.message_type && (
                  <div>
                    <span className="font-medium">Tipo de Mensagem:</span> {selectedLog.message_type}
                  </div>
                )}
                {selectedLog.processing_time_ms !== null && (
                  <div>
                    <span className="font-medium">Tempo de Processamento:</span>{" "}
                    {selectedLog.processing_time_ms}ms
                  </div>
                )}
                {selectedLog.is_from_me !== null && (
                  <div>
                    <span className="font-medium">De Mim:</span>{" "}
                    {selectedLog.is_from_me ? "Sim" : "Não"}
                  </div>
                )}
                {selectedLog.is_group !== null && (
                  <div>
                    <span className="font-medium">É Grupo:</span>{" "}
                    {selectedLog.is_group ? "Sim" : "Não"}
                  </div>
                )}
              </div>

              {selectedLog.error_message && (
                <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                  <div className="font-medium text-destructive mb-2">Mensagem de Erro:</div>
                  <div className="text-sm">{selectedLog.error_message}</div>
                </div>
              )}

              <div>
                <div className="font-medium mb-2">Headers da Requisição:</div>
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(selectedLog.request_headers, null, 2)}
                </pre>
              </div>

              <div>
                <div className="font-medium mb-2">Payload Completo:</div>
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(selectedLog.request_body, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
