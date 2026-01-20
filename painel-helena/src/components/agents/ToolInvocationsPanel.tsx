import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Clock, Wrench } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ToolInvocation {
  id: string;
  created_at: string;
  function_name: string;
  arguments: any;
  result: any;
  success: boolean;
  error_message: string | null;
  execution_time_ms: number;
}

interface ToolInvocationsPanelProps {
  conversationId: string | null;
}

export function ToolInvocationsPanel({ conversationId }: ToolInvocationsPanelProps) {
  const [invocations, setInvocations] = useState<ToolInvocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) {
      setInvocations([]);
      setLoading(false);
      return;
    }

    loadInvocations();

    // Subscrever para atualizações em tempo real
    const channel = supabase
      .channel(`tool-invocations-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_tool_invocations',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setInvocations(prev => [payload.new as ToolInvocation, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  async function loadInvocations() {
    if (!conversationId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('agent_tool_invocations')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Erro ao carregar tool invocations:', error);
    } else {
      setInvocations(data || []);
    }
    setLoading(false);
  }

  if (!conversationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Operações de Ferramentas
          </CardTitle>
          <CardDescription>
            Selecione uma conversa para ver as operações realizadas
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Operações de Ferramentas
        </CardTitle>
        <CardDescription>
          Histórico de ferramentas executadas nesta conversa
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando...
          </div>
        ) : invocations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma ferramenta foi executada ainda
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {invocations.map((inv) => (
                <div
                  key={inv.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {inv.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-semibold">
                        {getFunctionLabel(inv.function_name)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {inv.execution_time_ms}ms
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(inv.created_at), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </div>

                  {/* Argumentos */}
                  <div>
                    <div className="text-xs font-medium mb-1">Parâmetros:</div>
                    <div className="bg-muted rounded p-2 text-xs">
                      {formatArguments(inv.function_name, inv.arguments)}
                    </div>
                  </div>

                  {/* Resultado */}
                  {inv.success && inv.result && (
                    <div>
                      <div className="text-xs font-medium mb-1">Resultado:</div>
                      <div className="bg-muted rounded p-2 text-xs">
                        {formatResult(inv.function_name, inv.result)}
                      </div>
                    </div>
                  )}

                  {/* Erro */}
                  {!inv.success && inv.error_message && (
                    <div>
                      <Badge variant="destructive" className="text-xs">
                        Erro: {inv.error_message}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function getFunctionLabel(functionName: string): string {
  const labels: Record<string, string> = {
    'verificar_disponibilidade': 'Verificar Disponibilidade',
    'criar_agendamento': 'Criar Agendamento',
    'consultar_agendamentos': 'Consultar Agendamentos',
    'reagendar_agendamento': 'Reagendar',
    'cancelar_agendamento': 'Cancelar'
  };
  return labels[functionName] || functionName;
}

function formatArguments(functionName: string, args: any): string {
  if (functionName === 'verificar_disponibilidade') {
    return `Data: ${args.data_desejada}, Duração: ${args.duracao_minutos || 30} min`;
  }
  if (functionName === 'criar_agendamento') {
    return `Data/Hora: ${args.data_hora}, Duração: ${args.duracao_minutos} min, Cliente: ${args.nome_cliente}`;
  }
  return JSON.stringify(args, null, 2);
}

function formatResult(functionName: string, result: any): string {
  if (functionName === 'verificar_disponibilidade' && result.slots_disponiveis) {
    const count = result.slots_disponiveis.length;
    return `${count} horário(s) disponível(is)${count > 0 ? ': ' + result.slots_disponiveis.slice(0, 3).join(', ') : ''}`;
  }
  if (functionName === 'criar_agendamento' && result.success) {
    return `✅ Agendamento criado com sucesso`;
  }
  return JSON.stringify(result, null, 2).substring(0, 200);
}
