import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Pause, Play, Users, Clock, AlertCircle } from 'lucide-react';
import { useAgentConversations } from '@/hooks/useAgentConversations';
import { useJuliaAgents } from '@/hooks/useJuliaAgents';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ToolInvocationsPanel } from '@/components/agents/ToolInvocationsPanel';

export default function AgentConversations() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [confirmAction, setConfirmAction] = useState<{ type: 'pause-all' | 'resume-all' | null; }>({ type: null });
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  const { agents } = useJuliaAgents();
  const { conversations, isLoading, togglePause, pauseAll, resumeAll } = useAgentConversations(agentId);

  const agent = agents?.find(a => a.id === agentId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Agente não encontrado</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const activeConversations = conversations?.filter(c => !c.is_paused) || [];
  const pausedConversations = conversations?.filter(c => c.is_paused) || [];

  const handleTogglePause = async (conversationId: string, currentPaused: boolean) => {
    await togglePause.mutateAsync({
      conversationId,
      isPaused: !currentPaused,
      reason: currentPaused ? undefined : 'Pausado manualmente'
    });
  };

  const handlePauseAll = async () => {
    if (agentId) {
      await pauseAll.mutateAsync(agentId);
      setConfirmAction({ type: null });
    }
  };

  const handleResumeAll = async () => {
    if (agentId) {
      await resumeAll.mutateAsync(agentId);
      setConfirmAction({ type: null });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/agent_julia')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <p className="text-muted-foreground">Gerenciar conversas ativas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setConfirmAction({ type: 'pause-all' })}
            disabled={activeConversations.length === 0}
          >
            <Pause className="h-4 w-4 mr-2" />
            Pausar Todas
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirmAction({ type: 'resume-all' })}
            disabled={pausedConversations.length === 0}
          >
            <Play className="h-4 w-4 mr-2" />
            Reativar Todas
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Conversas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{conversations?.length || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Conversas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{activeConversations.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Conversas Pausadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Pause className="h-4 w-4 text-orange-500" />
              <span className="text-2xl font-bold">{pausedConversations.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Conversas Ativas</h2>
        {activeConversations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma conversa ativa no momento
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activeConversations.map((conversation) => (
              <Card key={conversation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {conversation.contacts?.name || conversation.remote_jid}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3" />
                        Última mensagem{' '}
                        {conversation.last_message_at
                          ? formatDistanceToNow(new Date(conversation.last_message_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })
                          : 'nunca'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                        Ativa
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedConversationId(conversation.id)}
                      >
                        Ver Detalhes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePause(conversation.id, false)}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pausar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Conversas Pausadas</h2>
        {pausedConversations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma conversa pausada
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pausedConversations.map((conversation) => (
              <Card key={conversation.id} className="border-orange-500/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {conversation.contacts?.name || conversation.remote_jid}
                      </CardTitle>
                      <CardDescription className="space-y-1 mt-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          Pausada{' '}
                          {conversation.paused_at
                            ? formatDistanceToNow(new Date(conversation.paused_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })
                            : 'recentemente'}
                        </div>
                        {conversation.paused_reason && (
                          <div className="flex items-center gap-2 text-xs">
                            <AlertCircle className="h-3 w-3" />
                            {conversation.paused_reason}
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-700 border-orange-500/20">
                        Pausada
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedConversationId(conversation.id)}
                      >
                        Ver Detalhes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePause(conversation.id, true)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Reativar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={confirmAction.type === 'pause-all'} onOpenChange={() => setConfirmAction({ type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pausar todas as conversas?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as {activeConversations.length} conversas ativas serão pausadas. O agente não responderá até que sejam reativadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePauseAll}>Pausar Todas</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction.type === 'resume-all'} onOpenChange={() => setConfirmAction({ type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reativar todas as conversas?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as {pausedConversations.length} conversas pausadas serão reativadas. O agente voltará a responder normalmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResumeAll}>Reativar Todas</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </div>

        <div className="lg:col-span-1">
          <ToolInvocationsPanel conversationId={selectedConversationId} />
        </div>
      </div>
    </div>
  );
}
