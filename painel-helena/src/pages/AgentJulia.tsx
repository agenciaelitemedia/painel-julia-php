import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, Pencil, Trash2, Loader2, AlertCircle, Settings, MessageCircle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useJuliaAgents } from "@/hooks/useJuliaAgents";
import { useClientData } from "@/hooks/useClientData";
import { CreateAgentDialog } from "@/components/agents/CreateAgentDialog";
import { EditAgentDialog } from "@/components/agents/EditAgentDialog";
import { ConfigureAgentDialog } from "@/components/agents/ConfigureAgentDialog";
import { JuliaAgent } from "@/hooks/useJuliaAgents";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
export default function AgentJulia() {
  const navigate = useNavigate();
  const {
    agents,
    isLoading,
    createAgent,
    updateAgent,
    deleteAgent,
    configureAgent
  } = useJuliaAgents();
  const {
    clientData
  } = useClientData();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [configureDialogOpen, setConfigureDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<JuliaAgent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const canAddAgent = !clientData || agents && agents.length < clientData.max_agents;
  const handleCreateAgent = async (name: string, instanceId: string | null, agentType: 'julia' | 'custom') => {
    if (!clientData) return;
    await createAgent.mutateAsync({
      name,
      client_id: clientData.id,
      client_code: clientData.client_code || '',
      instance_id: instanceId,
      agent_type: agentType
    });
    setCreateDialogOpen(false);
  };
  const handleEditAgent = async (id: string, name: string, is_active: boolean, instance_id: string | null, agent_type: 'julia' | 'custom', is_paused_globally?: boolean) => {
    await updateAgent.mutateAsync({
      id,
      name,
      is_active,
      instance_id,
      agent_type,
      is_paused_globally
    });
    setEditDialogOpen(false);
    setSelectedAgent(null);
  };
  const handleDeleteAgent = async () => {
    if (!agentToDelete) return;
    await deleteAgent.mutateAsync(agentToDelete);
    setDeleteDialogOpen(false);
    setAgentToDelete(null);
  };
  const openEditDialog = (agent: JuliaAgent) => {
    setSelectedAgent(agent);
    setEditDialogOpen(true);
  };
  const openDeleteDialog = (agentId: string) => {
    setAgentToDelete(agentId);
    setDeleteDialogOpen(true);
  };
  const openConfigureDialog = (agent: JuliaAgent) => {
    setSelectedAgent(agent);
    setConfigureDialogOpen(true);
  };
  const handleConfigureAgent = async (agentId: string, selectedCode?: string, customPrompt?: string, aiModelId?: string, aiTemperature?: number, aiMaxTokens?: number, systemInstructions?: string, pausePhrases?: string[], toolsConfig?: {
    enabled_tools: any[];
  }, agentBio?: string, startConversationPhrases?: any) => {
    await configureAgent.mutateAsync({
      id: agentId,
      selectedCode,
      customPrompt,
      aiModelId,
      aiTemperature,
      aiMaxTokens,
      systemInstructions,
      pausePhrases,
      toolsConfig,
      agentBio,
      startConversationPhrases
    });
    setConfigureDialogOpen(false);
    setSelectedAgent(null);
  };
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  return <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">JULIA - Assistentes e Agentes</h1>
          <p className="text-muted-foreground">
            Gerencie os agentes de IA da Julia para atendimento automatizado
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} disabled={!canAddAgent}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Agente
        </Button>
      </div>

      {!canAddAgent && <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você atingiu o limite de {clientData?.max_agents} agente(s) permitido(s) para o seu plano.
          </AlertDescription>
        </Alert>}

      {agents && agents.length > 0 ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agents.map(agent => <Card key={agent.id} className={agent.agent_type === 'julia' ? 'bg-primary/5' : 'bg-muted/50'}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription className="text-xs">
                        Código: {agent.agent_code}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={agent.is_active ? "default" : "secondary"}>
                    {agent.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="flex justify-center pt-2.5">
                  {!agent.instance_id ? <Badge variant="outline" className="bg-muted text-muted-foreground border-muted-foreground/20 w-full justify-center">
                      Sem conexão definida
                    </Badge> : agent.whatsapp_instances?.status === 'connected' ? <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1.5 w-full justify-center">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {agent.whatsapp_instances.instance_name}
                    </Badge> : <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 gap-1.5 w-full justify-center">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {agent.whatsapp_instances?.instance_name || 'Desconectada'}
                    </Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/agent-conversations/${agent.id}`)} className="w-full">
                    <Users className="mr-2 h-3 w-3" />
                    Gerenciar Conversas
                  </Button>
                  <div className="flex flex-col gap-2">
                    
                    <div className="flex gap-2 justify-between">
                      <Button variant="outline" size="sm" onClick={() => openConfigureDialog(agent)}>
                        <Settings className="mr-2 h-3 w-3" />
                        Configurar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(agent)}>
                        <Pencil className="mr-2 h-3 w-3" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(agent.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div> : <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum agente criado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie seu primeiro agente da Julia para começar
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Agente
            </Button>
          </CardContent>
        </Card>}

      <CreateAgentDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onSubmit={handleCreateAgent} isLoading={createAgent.isPending} />

      <EditAgentDialog agent={selectedAgent} open={editDialogOpen} onOpenChange={setEditDialogOpen} onSubmit={handleEditAgent} isLoading={updateAgent.isPending} />

      <ConfigureAgentDialog agent={selectedAgent} open={configureDialogOpen} onOpenChange={setConfigureDialogOpen} onSubmit={handleConfigureAgent} isLoading={configureAgent?.isPending || false} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAgent}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}