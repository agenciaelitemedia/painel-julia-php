// Página de funil de follow-up - monitoramento de leads
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTestFollowupSend } from "@/hooks/useTestFollowupSend";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Filter, Users, MessageCircle, XCircle, Repeat, MoreVertical } from "lucide-react";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

type TimeFilter = "12h" | "1h" | "1d" | "custom";

interface LeadData {
  id: string;
  contact_name: string;
  contact_phone: string;
  current_step: string;
  step_order: number;
  status: "active" | "responded" | "lost" | "infinite_loop";
  is_infinite_loop: boolean;
  loop_iteration: number;
  last_interaction: Date;
  execution_status: string;
}

export default function FollowupFunnel() {
  const { configId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("12h");
  const { testSend } = useTestFollowupSend();

  const getTimeFilterDate = () => {
    const now = new Date();
    switch (timeFilter) {
      case "1h":
        return new Date(now.getTime() - 60 * 60 * 1000);
      case "12h":
        return new Date(now.getTime() - 12 * 60 * 60 * 1000);
      case "1d":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 12 * 60 * 60 * 1000);
    }
  };

  const { data: funnelData, isLoading } = useQuery({
    queryKey: ['followup-funnel', configId, timeFilter, profile?.client_id],
    queryFn: async () => {
      if (!profile?.client_id || !configId) return null;

      const filterDate = getTimeFilterDate();

      // Buscar TODAS as execuções de follow-up ordenadas por data de envio (última primeiro)
      const { data: executions, error: execError } = await supabase
        .from('followup_executions')
        .select(`
          id,
          conversation_id,
          step_id,
          status,
          scheduled_at,
          sent_at,
          is_infinite_loop,
          loop_iteration,
          agent_conversations!inner (
            remote_jid,
            last_message_at,
            contact_id,
            contacts!inner (
              name,
              phone,
              is_group
            )
          ),
          followup_steps (
            title,
            step_order
          )
        `)
        .eq('config_id', configId)
        .eq('agent_conversations.contacts.is_group', false)
        .gte('scheduled_at', filterDate.toISOString())
        .order('sent_at', { ascending: false })
        .order('scheduled_at', { ascending: false });

      if (execError) throw execError;

      // Buscar histórico completo - incluir TODOS os eventos relevantes
      const conversationIds = executions?.map(e => e.conversation_id) || [];
      const { data: history, error: historyError } = await supabase
        .from('followup_history')
        .select('*')
        .in('conversation_id', conversationIds)
        .in('event_type', ['user_responded', 'no_response', 'agent_paused', 'cancelled', 'infinite_loop'])
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;

      console.log('[FollowupFunnel] Execuções encontradas:', executions?.length);
      console.log('[FollowupFunnel] Histórico encontrado:', history?.length);

      // Processar dados em categorias
      const leads: LeadData[] = [];
      const conversationMap = new Map<string, LeadData>();

      executions?.forEach(exec => {
        const conversation = exec.agent_conversations;
        const contact = conversation?.contacts;
        const step = exec.followup_steps;
        
        if (!conversation || !contact || !step) return;

        // Verificar histórico de respostas - buscar eventos relevantes
        const conversationHistory = history?.filter(h => h.conversation_id === exec.conversation_id) || [];
        
        // Pegar eventos específicos
        const hasResponded = conversationHistory.some(h => h.event_type === 'user_responded');
        const hasNoResponse = conversationHistory.some(h => h.event_type === 'no_response');
        const hasInfiniteLoop = conversationHistory.some(h => h.event_type === 'infinite_loop');
        const isPaused = conversationHistory.some(h => h.event_type === 'agent_paused');
        
        // Se foi pausado pelo agente, IGNORAR este lead (não exibir no funil)
        if (isPaused) {
          console.log(`[FollowupFunnel] Lead ${contact.name} ignorado - agente foi pausado`);
          return;
        }
        
        // Determinar status do lead (ordem de prioridade)
        let status: LeadData['status'] = 'active';
        
        if (hasResponded) {
          // PRIORIDADE 1: Se respondeu em qualquer momento → "Responderam"
          status = 'responded';
        } else if (hasNoResponse) {
          // PRIORIDADE 2: Se chegou ao fim e não respondeu → "Não Responderam"
          status = 'lost';
        } else if (hasInfiniteLoop || exec.is_infinite_loop) {
          // PRIORIDADE 3: Se está em loop infinito → "Loop Infinito"
          status = 'infinite_loop';
        } else {
          // PRIORIDADE 4: Default → "Ativo" (ainda em processo)
          status = 'active';
        }
        
        // Pegar o último evento registrado para exibir a última interação
        const lastEvent = conversationHistory[0];

        const leadData: LeadData = {
          id: exec.id,
          contact_name: contact.name,
          contact_phone: contact.phone,
          current_step: step.title,
          step_order: step.step_order,
          status,
          is_infinite_loop: exec.is_infinite_loop,
          loop_iteration: exec.loop_iteration || 0,
          last_interaction: new Date(lastEvent?.created_at || exec.sent_at || exec.scheduled_at),
          execution_status: exec.status
        };

        // Usar apenas a execução mais recente por conversa (maior step_order ou mais recente)
        const existing = conversationMap.get(exec.conversation_id);
        if (!existing || 
            step.step_order > existing.step_order || 
            (step.step_order === existing.step_order && new Date(leadData.last_interaction) > new Date(existing.last_interaction))) {
          conversationMap.set(exec.conversation_id, leadData);
        }
      });

      return Array.from(conversationMap.values());
    },
    enabled: !!profile?.client_id && !!configId,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 5000
  });

  const categorizeLeads = () => {
    if (!funnelData) return { active: [], responded: [], lost: [], infiniteLoop: [] };

    return {
      active: funnelData.filter(l => l.status === 'active'),
      responded: funnelData.filter(l => l.status === 'responded'),
      lost: funnelData.filter(l => l.status === 'lost'),
      infiniteLoop: funnelData.filter(l => l.status === 'infinite_loop')
    };
  };

  const categories = categorizeLeads();

  const LeadCard = ({ lead }: { lead: LeadData }) => {
    const handleOpenChat = () => {
      // Navegar para a página de chat com o telefone do contato
      navigate(`/chat?phone=${encodeURIComponent(lead.contact_phone)}`);
    };
    
    return (
      <Card className="mb-3">
        <CardContent className="pt-4 pb-2">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold">{lead.contact_name}</h4>
              <p className="text-sm text-muted-foreground">{lead.contact_phone}</p>
            </div>
            <Badge variant={
              lead.status === 'responded' ? 'default' :
              lead.status === 'lost' ? 'destructive' :
              lead.status === 'infinite_loop' ? 'secondary' : 'outline'
            }>
              {lead.status === 'responded' ? 'Responderam' :
               lead.status === 'lost' ? 'Sem Resp.' :
               lead.status === 'infinite_loop' ? 'Loop Infinito' : 'Ativo'}
            </Badge>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {lead.status === 'lost' ? 'Última etapa:' : 'Etapa atual:'}
              </span>
              <span className="font-medium">{lead.current_step} (#{lead.step_order})</span>
            </div>
            {lead.is_infinite_loop && (
              <div className="flex items-center gap-2">
                <Repeat className="h-3 w-3" />
                <span className="text-muted-foreground">Iteração: {lead.loop_iteration}</span>
              </div>
            )}
            <div className="text-muted-foreground">
              {format(lead.last_interaction, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2 pb-3 justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenChat}
            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-500 dark:hover:text-green-400 dark:hover:bg-green-950/20"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        </CardFooter>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/followup')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Funil de Follow-up</h1>
            <p className="text-muted-foreground">
              Acompanhe o progresso dos seus leads
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => testSend()}
              className="flex items-center gap-2"
              variant="outline"
            >
              🧪 Testar Envio
            </Button>
            
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Última hora</SelectItem>
                <SelectItem value="12h">Últimas 12 horas</SelectItem>
                <SelectItem value="1d">Último dia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Métricas gerais */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.active.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-green-500" />
                Responderam
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.responded.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                Não Responderam
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.lost.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Repeat className="h-4 w-4 text-secondary" />
                Loop Infinito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.infiniteLoop.length}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Funil de leads - Layout Kanban */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 h-[calc(100vh-400px)]">
        {/* Coluna Ativos */}
        <Card className="flex flex-col bg-purple-50/50 dark:bg-purple-950/10">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">Ativos</CardTitle>
                <Badge variant="secondary" className="rounded-full">
                  {categories.active.length}
                </Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Visualizar todos</DropdownMenuItem>
                  <DropdownMenuItem>Exportar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden px-3">
            <ScrollArea className="h-full pr-3">
              <div className="space-y-3">
                {categories.active.map(lead => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Coluna Responderam */}
        <Card className="flex flex-col bg-green-50/50 dark:bg-green-950/10">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold text-green-700 dark:text-green-400">Responderam</CardTitle>
                <Badge variant="secondary" className="rounded-full">
                  {categories.responded.length}
                </Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Visualizar todos</DropdownMenuItem>
                  <DropdownMenuItem>Exportar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden px-3">
            <ScrollArea className="h-full pr-3">
              <div className="space-y-3">
                {categories.responded.map(lead => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Coluna Não Responderam */}
        <Card className="flex flex-col bg-red-50/50 dark:bg-red-950/10">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold text-red-700 dark:text-red-400">Não Responderam</CardTitle>
                <Badge variant="secondary" className="rounded-full">
                  {categories.lost.length}
                </Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Visualizar todos</DropdownMenuItem>
                  <DropdownMenuItem>Exportar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden px-3">
            <ScrollArea className="h-full pr-3">
              <div className="space-y-3">
                {categories.lost.map(lead => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Coluna Loop Infinito */}
        <Card className="flex flex-col bg-amber-50/50 dark:bg-amber-950/10">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold text-amber-700 dark:text-amber-400">Loop Infinito</CardTitle>
                <Badge variant="secondary" className="rounded-full">
                  {categories.infiniteLoop.length}
                </Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Visualizar todos</DropdownMenuItem>
                  <DropdownMenuItem>Exportar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden px-3">
            <ScrollArea className="h-full pr-3">
              <div className="space-y-3">
                {categories.infiniteLoop.map(lead => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
