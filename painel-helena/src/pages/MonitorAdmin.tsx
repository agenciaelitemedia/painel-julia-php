import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Play, Clock, Settings, Activity, CheckCircle2, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MonitorAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [intervalMinutes, setIntervalMinutes] = useState(2);
  const [triggerDelayMinutes, setTriggerDelayMinutes] = useState(30);


  // Buscar configuração do cron job
  const { data: cronConfig } = useQuery({
    queryKey: ['cron-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cron_job_config')
        .select('*')
        .eq('job_name', 'monitor-conversations-job')
        .single();
      
      if (error) throw error;
      if (data) setIntervalMinutes(data.interval_minutes);
      return data;
    }
  });

  // Buscar configuração do follow-up (trigger_delay_minutes)
  const { data: followupConfig } = useQuery({
    queryKey: ['followup-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('followup_configs')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();
      
      if (error) throw error;
      if (data) setTriggerDelayMinutes(data.trigger_delay_minutes);
      return data;
    }
  });

  // Buscar logs de execução
  const { data: executionLogs } = useQuery({
    queryKey: ['monitor-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monitor_execution_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000 // Atualizar a cada 10 segundos
  });

  // Buscar estatísticas de pre_followup
  const { data: preFollowupStats } = useQuery({
    queryKey: ['pre-followup-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pre_followup')
        .select('status, created_at');

      if (error) throw error;

      const now = Date.now();
      const stats = (data || []).reduce((acc: any, row: any) => {
        acc[row.status] = (acc[row.status] || 0) + 1;
        
        if (row.status === 'pending') {
          const age = (now - new Date(row.created_at).getTime()) / 1000 / 60;
          acc.avg_wait_time = ((acc.avg_wait_time || 0) + age) / 2;
        }
        
        return acc;
      }, {});

      return stats;
    },
    refetchInterval: 10000
  });

  // Buscar pre_followups elegíveis (nova lógica)
  const { data: eligiblePreFollowups } = useQuery({
    queryKey: ['eligible-pre-followups', triggerDelayMinutes, followupConfig?.id],
    enabled: !!followupConfig,
    queryFn: async () => {
      const cutoffTime = new Date(Date.now() - Math.max(5, triggerDelayMinutes) * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('pre_followup')
        .select(`
          id,
          remote_jid,
          created_at,
          agent_conversations!inner (
            is_paused,
            contacts!inner (
              is_group,
              name
            ),
            julia_agents!inner (
              is_paused_globally
            )
          )
        `)
        .eq('status', 'pending')
        .eq('client_id', followupConfig!.client_id)
        .eq('agent_id', followupConfig!.agent_id)
        .lt('created_at', cutoffTime)
        .gt('expires_at', new Date().toISOString())
        .eq('agent_conversations.is_paused', false)
        .eq('agent_conversations.contacts.is_group', false)
        .eq('agent_conversations.julia_agents.is_paused_globally', false);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
  });

  // Executar monitor manualmente
  const executeMonitor = useMutation({
    mutationFn: async () => {
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('monitor-conversations', {
        body: { execution_type: 'manual' }
      });

      if (error) throw error;

      const duration = Date.now() - startTime;

      // Registrar execução
      await supabase.from('monitor_execution_logs').insert({
        execution_type: 'manual',
        conversations_processed: data.conversationsProcessed || 0,
        executions_created: data.executionsCreated || 0,
        duration_ms: duration,
        success: true,
        metadata: data
      });

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Monitor executado com sucesso!",
        description: `${data.conversationsProcessed} conversas processadas, ${data.executionsCreated} execuções criadas.`,
      });
      queryClient.invalidateQueries({ queryKey: ['monitor-logs'] });
    },
    onError: (error: any) => {
      // Registrar erro
      supabase.from('monitor_execution_logs').insert({
        execution_type: 'manual',
        success: false,
        error_message: error.message
      });

      toast({
        title: "Erro ao executar monitor",
        description: error.message,
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ['monitor-logs'] });
    }
  });

  // Atualizar configuração do cron
  const updateCronConfig = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('cron_job_config')
        .update({ 
          interval_minutes: intervalMinutes,
          last_updated_at: new Date().toISOString()
        })
        .eq('job_name', 'monitor-conversations-job');

      if (error) throw error;

      // Atualizar o cron job no Supabase
      // Nota: Isso requer uma migration SQL para recriar o job com o novo intervalo
      toast({
        title: "Atenção",
        description: "Para aplicar o novo intervalo, é necessário recriar o Cron Job via SQL. Entre em contato com o administrador do sistema.",
        variant: "default",
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuração salva",
        description: "O intervalo foi atualizado no banco de dados.",
      });
      queryClient.invalidateQueries({ queryKey: ['cron-config'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar configuração",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Atualizar trigger_delay_minutes do follow-up
  const updateTriggerDelay = useMutation({
    mutationFn: async () => {
      if (!followupConfig) throw new Error("Nenhuma configuração de follow-up encontrada");

      const { error } = await supabase
        .from('followup_configs')
        .update({ 
          trigger_delay_minutes: triggerDelayMinutes
        })
        .eq('id', followupConfig.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Delay de disparo atualizado",
        description: `O follow-up será disparado após ${triggerDelayMinutes} minutos de inatividade.`,
      });
      queryClient.invalidateQueries({ queryKey: ['followup-config'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar delay",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Administração do Monitor de Follow-up</h1>
        <p className="text-muted-foreground">
          Gerencie a execução e configuração do monitor de conversas inativas
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Execução Manual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Execução Manual
            </CardTitle>
            <CardDescription>
              Execute o monitor imediatamente para processar conversas inativas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => executeMonitor.mutate()}
              disabled={executeMonitor.isPending}
              className="w-full"
            >
              {executeMonitor.isPending ? (
                <>
                  <Activity className="mr-2 h-4 w-4 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Executar Agora
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Configuração do Agendamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuração do Agendamento
            </CardTitle>
            <CardDescription>
              Configure o intervalo de execução automática
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="interval">Intervalo de Verificação (minutos)</Label>
              <Input
                id="interval"
                type="number"
                min="1"
                max="60"
                value={intervalMinutes}
                onChange={(e) => setIntervalMinutes(parseInt(e.target.value) || 2)}
              />
              <p className="text-xs text-muted-foreground">
                Atual: a cada {cronConfig?.interval_minutes || 2} minutos
              </p>
            </div>
            <Button 
              onClick={() => updateCronConfig.mutate()}
              disabled={updateCronConfig.isPending}
              variant="secondary"
              className="w-full"
            >
              <Clock className="mr-2 h-4 w-4" />
              Salvar Intervalo
            </Button>
          </CardContent>
        </Card>

        {/* Configuração do Trigger Delay */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tempo de Inatividade
            </CardTitle>
            <CardDescription>
              Conversas inativas por este tempo serão incluídas no follow-up
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="triggerDelay">Minutos de Inatividade</Label>
              <Input
                id="triggerDelay"
                type="number"
                min="1"
                max="1440"
                value={triggerDelayMinutes}
                onChange={(e) => setTriggerDelayMinutes(parseInt(e.target.value) || 5)}
              />
              <p className="text-xs text-muted-foreground">
                Atual: {followupConfig?.trigger_delay_minutes || 5} minutos
              </p>
              {eligiblePreFollowups !== undefined && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    ✅ {eligiblePreFollowups.length} conversa(s) pronta(s) para follow-up
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    📋 Aguardando há mais de {triggerDelayMinutes} minutos sem resposta do lead
                  </p>
                  {eligiblePreFollowups.length > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      💡 Execute o monitor para processar estas conversas
                    </p>
                  )}
                </div>
              )}
            </div>
            <Button 
              onClick={() => updateTriggerDelay.mutate()}
              disabled={updateTriggerDelay.isPending}
              variant="secondary"
              className="w-full"
            >
              <Clock className="mr-2 h-4 w-4" />
              Salvar Configuração
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pre-Follow-up Stats */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pre-Follow-up (Conversas Aguardando)
          </CardTitle>
          <CardDescription>
            Conversas que receberam mensagem do agente e aguardam resposta do lead
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {preFollowupStats?.pending || 0}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">Pendentes</div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {preFollowupStats?.cancelled || 0}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Responderam</div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {preFollowupStats?.processed || 0}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Processados</div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {Math.round(preFollowupStats?.avg_wait_time || 0)}m
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">Tempo médio de espera</div>
            </div>
          </div>
          
          {(preFollowupStats?.pending || 0) > 50 && (
            <div className="mt-4 p-4 border border-yellow-500 bg-yellow-50 dark:bg-yellow-950 rounded-lg flex gap-2">
              <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
              <div>
                <div className="font-semibold text-yellow-800 dark:text-yellow-200">Atenção</div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  Mais de 50 conversas aguardando resposta. Verifique se o sistema está funcionando corretamente.
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações da Configuração */}
      {cronConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Configuração Atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delay para Follow-up:</span>
              <span className="font-medium">{followupConfig?.trigger_delay_minutes ?? '-'} minutos de inatividade</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Intervalo de Verificação:</span>
              <span className="font-medium">A cada {cronConfig.interval_minutes} minutos</span>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              ℹ️ O monitor só detecta conversas que estão inativas há <strong>mais de {cronConfig.interval_minutes} minutos</strong>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Logs de Execução */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Histórico de Execuções
          </CardTitle>
          <CardDescription>
            Últimas 20 execuções do monitor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Conversas</TableHead>
                  <TableHead className="text-right">Execuções</TableHead>
                  <TableHead className="text-right">Duração</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executionLogs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {new Date(log.executed_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.execution_type === 'manual' ? 'default' : 'secondary'}>
                        {log.execution_type === 'manual' ? 'Manual' : 'Automático'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.success ? (
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          Sucesso
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Erro
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{log.conversations_processed}</TableCell>
                    <TableCell className="text-right">{log.executions_created}</TableCell>
                    <TableCell className="text-right">
                      {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(2)}s` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {(!executionLogs || executionLogs.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhuma execução registrada ainda
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
