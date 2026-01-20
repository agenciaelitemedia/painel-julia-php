import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Repeat, TrendingUp, Users, MessageSquare, Clock, Activity } from "lucide-react";
import { Loader2 } from "lucide-react";

interface FollowupStats {
  total_sent: number;
  total_pending: number;
  total_failed: number;
  avg_response_time: number;
  conversion_rate: number;
}

export default function FollowupDashboard() {
  const { configId } = useParams<{ configId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['followup-config', configId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('followup_configs')
        .select(`
          *,
          julia_agents (
            name,
            agent_code
          )
        `)
        .eq('id', configId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!configId && !!profile?.client_id
  });

  const { data: steps } = useQuery({
    queryKey: ['followup-steps', configId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('followup_steps')
        .select('*')
        .eq('config_id', configId)
        .order('step_order');

      if (error) throw error;
      return data;
    },
    enabled: !!configId
  });

  // Buscar execuções com dados de conversas
  const { data: executions } = useQuery({
    queryKey: ['followup-executions', configId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('followup_executions')
        .select(`
          *,
          agent_conversations (
            contact_id,
            messages,
            last_message_at
          ),
          followup_steps (
            step_order,
            title
          )
        `)
        .eq('config_id', configId);

      if (error) throw error;
      return data;
    },
    enabled: !!configId
  });

  // Calcular estatísticas reais
  const stats: FollowupStats = {
    // 'sent' é o status real usado quando mensagem foi enviada com sucesso
    total_sent: executions?.filter(e => e.status === 'sent' || e.status === 'completed').length || 0,
    total_pending: executions?.filter(e => e.status === 'scheduled' || e.status === 'pending').length || 0,
    total_failed: executions?.filter(e => e.status === 'failed' || e.status === 'error').length || 0,
    avg_response_time: 0,
    conversion_rate: 0
  };

  // Calcular taxa de resposta
  if (executions) {
    // Usar 'sent' como status válido para mensagens enviadas
    const sentExecutions = executions.filter(e => e.status === 'sent' || e.status === 'completed');
    const uniqueConversations = new Map();
    
    sentExecutions.forEach(exec => {
      if (exec.agent_conversations && !uniqueConversations.has(exec.conversation_id)) {
        uniqueConversations.set(exec.conversation_id, exec.agent_conversations);
      }
    });
    
    // Verificar se houve resposta do usuário após o follow-up
    const respondedConversations = Array.from(uniqueConversations.values()).filter(conv => {
      const messages = conv.messages as any[];
      if (!messages || messages.length === 0) return false;
      
      // Procurar por mensagens do usuário (role: 'user' ou fromMe: false)
      const userMessages = messages.filter(msg => 
        msg.role === 'user' || msg.fromMe === false
      );
      
      return userMessages.length > 0;
    });
    
    if (uniqueConversations.size > 0) {
      stats.conversion_rate = Math.round((respondedConversations.length / uniqueConversations.size) * 100);
    }
  }

  // Calcular tempo médio de resposta em horas
  if (executions) {
    let totalResponseTime = 0;
    let responseCount = 0;

    executions.forEach(exec => {
      if (exec.agent_conversations && exec.sent_at && (exec.status === 'sent' || exec.status === 'completed')) {
        const messages = exec.agent_conversations.messages as any[];
        if (!messages) return;
        
        // Encontrar primeira mensagem do usuário após o envio do follow-up
        const sentTime = new Date(exec.sent_at).getTime();
        const userMessagesAfterSend = messages.filter(msg => {
          const isUserMessage = msg.role === 'user' || msg.fromMe === false;
          const messageTime = msg.timestamp ? new Date(msg.timestamp).getTime() : 0;
          return isUserMessage && messageTime > sentTime;
        });
        
        if (userMessagesAfterSend.length > 0) {
          const firstUserMessage = userMessagesAfterSend[0];
          const messageTime = new Date(firstUserMessage.timestamp).getTime();
          const responseTime = messageTime - sentTime;
          
          if (responseTime > 0) {
            totalResponseTime += responseTime;
            responseCount++;
          }
        }
      }
    });

    if (responseCount > 0) {
      stats.avg_response_time = Math.round((totalResponseTime / responseCount) / (1000 * 60 * 60)); // Converter para horas
    }
  }

  // Calcular contatos únicos alcançados
  const uniqueContactsReached = new Set(
    executions?.filter(e => e.status === 'sent' || e.status === 'completed').map(e => e.conversation_id)
  ).size || 0;

  if (configLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Configuração não encontrada</h2>
          <Button onClick={() => navigate('/followup')}>
            Voltar para Listagem
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/followup')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Repeat className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                Dashboard - {config.julia_agents?.name}
              </h1>
              <p className="text-muted-foreground">
                Monitoramento e estatísticas do follow-up
              </p>
            </div>
          </div>
        </div>
        <Badge variant={config.is_active ? "default" : "secondary"} className="h-fit">
          {config.is_active ? "Ativo" : "Inativo"}
        </Badge>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_sent}</div>
            <p className="text-xs text-muted-foreground">
              follow-ups completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contatos Alcançados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueContactsReached}</div>
            <p className="text-xs text-muted-foreground">
              contatos únicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversion_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.conversion_rate > 0 ? 'de engajamento' : 'aguardando respostas'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avg_response_time > 0 ? `${stats.avg_response_time}h` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.avg_response_time > 0 ? 'média de resposta' : 'sem dados ainda'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Configuração Atual */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Configuração</CardTitle>
            <CardDescription>Detalhes da configuração atual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Agente:</span>
              <Badge variant="outline">
                {config.julia_agents?.name} ({config.julia_agents?.agent_code})
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Mensagens automáticas:</span>
              <Badge variant="outline">
                {config.auto_message ? "Sim" : "Não"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Horário de funcionamento:</span>
              <Badge variant="outline">
                {config.start_hours?.substring(0, 5)} - {config.end_hours?.substring(0, 5)}
              </Badge>
            </div>
            {config.followup_from && config.followup_to && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Loop infinito:</span>
                <Badge variant="outline">
                  Etapa {config.followup_from} → {config.followup_to}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Etapas Configuradas</CardTitle>
            <CardDescription>Sequência de follow-up</CardDescription>
          </CardHeader>
          <CardContent>
            {steps && steps.length > 0 ? (
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{step.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {step.step_value} {step.step_unit === 'minutes' ? 'minutos' : step.step_unit === 'hours' ? 'horas' : 'dias'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma etapa configurada
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Atual */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Status dos Envios</CardTitle>
            <CardDescription>Distribuição atual das execuções</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="font-medium">Enviados com sucesso</span>
              </div>
              <Badge variant="outline" className="bg-white dark:bg-gray-900">
                {stats.total_sent}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="font-medium">Agendados</span>
              </div>
              <Badge variant="outline" className="bg-white dark:bg-gray-900">
                {stats.total_pending}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="font-medium">Falhas</span>
              </div>
              <Badge variant="outline" className="bg-white dark:bg-gray-900">
                {stats.total_failed}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métricas de Performance</CardTitle>
            <CardDescription>Indicadores de eficiência</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa de sucesso</span>
                <span className="font-medium">
                  {stats.total_sent > 0 
                    ? Math.round((stats.total_sent / (stats.total_sent + stats.total_failed)) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${stats.total_sent > 0 
                      ? Math.round((stats.total_sent / (stats.total_sent + stats.total_failed)) * 100)
                      : 0}%`
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa de engajamento</span>
                <span className="font-medium">{stats.conversion_rate}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${stats.conversion_rate}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de execuções</span>
                <span className="text-lg font-bold">
                  {(stats.total_sent || 0) + (stats.total_pending || 0) + (stats.total_failed || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
