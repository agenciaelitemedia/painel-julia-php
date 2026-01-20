import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Cpu, DollarSign, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AgentAnalytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['agent-analytics'],
    queryFn: async () => {
      // Buscar estatísticas do mês atual
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: logs, error } = await supabase
        .from('agent_usage_logs')
        .select(`
          *,
          julia_agents (
            name
          )
        `)
        .gte('created_at', startOfMonth.toISOString());

      if (error) throw error;

      const totalConversations = logs.length;
      const totalTokensInput = logs.reduce((sum, log) => sum + log.tokens_input, 0);
      const totalTokensOutput = logs.reduce((sum, log) => sum + log.tokens_output, 0);
      const totalCost = logs.reduce((sum, log) => sum + (log.total_cost || 0), 0);
      const avgResponseTime = logs.length > 0 
        ? logs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / logs.length 
        : 0;

      // Agrupar por agente
      const byAgent = logs.reduce((acc: any, log: any) => {
        const agentName = log.julia_agents?.name || 'Desconhecido';
        if (!acc[agentName]) {
          acc[agentName] = {
            name: agentName,
            conversations: 0,
            tokens: 0,
            cost: 0
          };
        }
        acc[agentName].conversations++;
        acc[agentName].tokens += log.tokens_input + log.tokens_output;
        acc[agentName].cost += log.total_cost || 0;
        return acc;
      }, {});

      return {
        totalConversations,
        totalTokens: totalTokensInput + totalTokensOutput,
        totalCost,
        avgResponseTime,
        byAgent: Object.values(byAgent),
        recentLogs: logs.slice(0, 10)
      };
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando analytics...</p>
          </div>
        ) : (
          <>
            {/* Cards de resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Conversas</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalConversations || 0}</div>
                  <p className="text-xs text-muted-foreground">Este mês</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tokens Usados</CardTitle>
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {((stats?.totalTokens || 0) / 1000).toFixed(1)}k
                  </div>
                  <p className="text-xs text-muted-foreground">Este mês</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Custo Estimado</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {(stats?.totalCost || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">Este mês</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(stats?.avgResponseTime || 0).toFixed(0)}ms
                  </div>
                  <p className="text-xs text-muted-foreground">Resposta</p>
                </CardContent>
              </Card>
            </div>

            {/* Uso por agente */}
            <Card>
              <CardHeader>
                <CardTitle>Uso por Agente</CardTitle>
                <CardDescription>Performance de cada agente no mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.byAgent && stats.byAgent.length > 0 ? (
                    stats.byAgent.map((agent: any) => (
                      <div key={agent.name} className="flex items-center justify-between border-b pb-3">
                        <div className="space-y-1">
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {agent.conversations} conversas • {(agent.tokens / 1000).toFixed(1)}k tokens
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">R$ {agent.cost.toFixed(2)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum dado disponível
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Conversas recentes */}
            <Card>
              <CardHeader>
                <CardTitle>Conversas Recentes</CardTitle>
                <CardDescription>Últimas interações dos agentes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.recentLogs && stats.recentLogs.length > 0 ? (
                    stats.recentLogs.map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between text-sm border-b pb-2">
                        <div className="space-y-1">
                          <p className="font-medium">{log.julia_agents?.name || 'Desconhecido'}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-xs">
                            {log.tokens_input + log.tokens_output} tokens
                          </p>
                          <p className="text-xs font-medium">
                            R$ {(log.total_cost || 0).toFixed(4)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma conversa registrada
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
  );
}
