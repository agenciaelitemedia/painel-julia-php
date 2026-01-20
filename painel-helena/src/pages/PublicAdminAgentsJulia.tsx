import { useState, useMemo, useEffect } from "react";
import { usePublicAppSecurity } from "@/hooks/usePublicAppSecurity";
import { usePublicAdminAgentsJulia, AdminAgentJulia } from "@/hooks/usePublicAdminAgentsJulia";
import { useUpdateAgentStatus } from "@/hooks/useUpdateAgentStatus";
import { useDeleteAgentJulia, useCheckAgentSessions } from "@/hooks/useDeleteAgentJulia";
import { Loader2, Users, Plus, RefreshCw, Link, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AgentJuliaFilters } from "@/components/public-admin-agents/AgentJuliaFilters";
import { AgentJuliaTable } from "@/components/public-admin-agents/AgentJuliaTable";
import { EditAgentJuliaWizardDialog } from "@/components/public-admin-agents/EditAgentJuliaWizardDialog";
import { CreateAgentJuliaWizardDialog } from "@/components/public-admin-agents/CreateAgentJuliaWizardDialog";
import { ConfirmStatusChangeDialog } from "@/components/public-admin-agents/ConfirmStatusChangeDialog";
import { LinkAgentHelenaDialog } from "@/components/public-admin-agents/LinkAgentHelenaDialog";
import { AgentDetailsDialog } from "@/components/public-admin-agents/AgentDetailsDialog";
import { ConfirmDeleteAgentDialog } from "@/components/public-admin-agents/ConfirmDeleteAgentDialog";
import { toast } from "sonner";


export default function PublicAdminAgentsJulia() {
  const { sessionToken, generateFreshToken, isAuthorized, isLoading: securityLoading } = usePublicAppSecurity();
  
  const { data: agents, isLoading: agentsLoading, refetch } = usePublicAdminAgentsJulia(
    sessionToken,
    generateFreshToken,
    isAuthorized
  );

  const updateStatusMutation = useUpdateAgentStatus(sessionToken, generateFreshToken);
  const deleteAgentMutation = useDeleteAgentJulia();
  const checkSessionsMutation = useCheckAgentSessions();

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("cod_agent_desc");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [selectedAgent, setSelectedAgent] = useState<AdminAgentJulia | null>(null);
  
  // Status change dialog state
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ agent: AdminAgentJulia; newStatus: boolean } | null>(null);
  
  // Delete dialog state
  const [hasSessions, setHasSessions] = useState(false);
  const [checkingSession, setCheckingSession] = useState(false);

  // Filter by newly created agent
  const [filterByCodAgent, setFilterByCodAgent] = useState<string | null>(null);

  // Filter and sort agents
  const filteredAgents = useMemo(() => {
    if (!agents) return [];

    let result = [...agents];

    // Filter by specific cod_agent (after create)
    if (filterByCodAgent) {
      result = result.filter((agent) => agent.cod_agent?.toString() === filterByCodAgent);
      return result;
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (agent) =>
          agent.name?.toLowerCase().includes(term) ||
          agent.business_name?.toLowerCase().includes(term) ||
          agent.cod_agent?.toString().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((agent) => {
        const isActive = agent.status === 'active' || agent.status === 'ativo';
        return statusFilter === "active" ? isActive : !isActive;
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "cod_agent_asc":
          return a.cod_agent - b.cod_agent;
        case "cod_agent_desc":
          return b.cod_agent - a.cod_agent;
        case "name_asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name_desc":
          return (b.name || "").localeCompare(a.name || "");
        case "usage_asc":
          return a.used - b.used;
        case "usage_desc":
          return b.used - a.used;
        default:
          return 0;
      }
    });

    return result;
  }, [agents, searchTerm, statusFilter, sortBy, filterByCodAgent]);

  // Handlers
  const handleEdit = (agent: AdminAgentJulia) => {
    setSelectedAgent(agent);
    setEditDialogOpen(true);
  };

  const handleViewDetails = (agent: AdminAgentJulia) => {
    setSelectedAgent(agent);
    setDetailsDialogOpen(true);
  };

  const handleDelete = async (agent: AdminAgentJulia) => {
    setSelectedAgent(agent);
    setCheckingSession(true);
    setDeleteDialogOpen(true);

    try {
      // Check if agent has sessions
      if (agent.agent_id) {
        const hasActiveSessions = await checkSessionsMutation.mutateAsync(agent.agent_id);
        setHasSessions(hasActiveSessions);
      } else {
        setHasSessions(false);
      }
    } catch (error) {
      console.error('Error checking sessions:', error);
      setHasSessions(true); // Assume has sessions on error for safety
    } finally {
      setCheckingSession(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedAgent || !selectedAgent.agent_id) {
      toast.error('Erro: ID do agente não encontrado');
      return;
    }

    try {
      await deleteAgentMutation.mutateAsync({
        agentId: selectedAgent.agent_id,
        codAgent: selectedAgent.cod_agent.toString(),
      });
      setDeleteDialogOpen(false);
      setSelectedAgent(null);
      refetch();
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
  };

  const handleStatusChange = (agent: AdminAgentJulia, newStatus: boolean) => {
    // Open confirmation dialog instead of directly changing
    setPendingStatusChange({ agent, newStatus });
    setStatusChangeDialogOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingStatusChange) return;

    try {
      await updateStatusMutation.mutateAsync({
        codAgent: pendingStatusChange.agent.cod_agent,
        newStatus: pendingStatusChange.newStatus,
      });
      
      toast.success(
        `Agente ${pendingStatusChange.agent.cod_agent} ${pendingStatusChange.newStatus ? 'ativado' : 'desativado'} com sucesso!`
      );
      setStatusChangeDialogOpen(false);
      setPendingStatusChange(null);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(`Erro ao ${pendingStatusChange.newStatus ? 'ativar' : 'desativar'} agente: ${(error as Error).message}`);
    }
  };

  const handleSaveEdit = () => {
    refetch();
  };

  const handleAgentCreated = (codAgent: string) => {
    setFilterByCodAgent(codAgent);
    refetch();
  };

  // Loading state
  if (securityLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authorized
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="p-4 md:p-6 lg:p-8 pb-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Gerenciar Agentes Julia
              </h1>
              <p className="text-sm text-muted-foreground">
                Lista e gerenciamento de todos os agentes Atende Julia cadastrados
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setLinkDialogOpen(true)}>
              <Link className="h-4 w-4 mr-2" />
              Vincular Agente
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agente
            </Button>
          </div>
        </div>
      </div>

      {/* Filter indicator for newly created agent */}
      {filterByCodAgent && (
        <div className="px-4 md:px-6 lg:px-8 pb-4">
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <Badge variant="secondary" className="bg-primary text-primary-foreground">
              Agente Criado: {filterByCodAgent}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Mostrando apenas o agente recém-cadastrado
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setFilterByCodAgent(null)}
            >
              <X className="h-4 w-4 mr-1" />
              Ver Todos
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-4 md:px-6 lg:px-8 pb-4">
        <Card>
          <CardContent className="pt-4">
            <AgentJuliaFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              sortBy={sortBy}
              onSortByChange={setSortBy}
            />
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="px-4 md:px-6 lg:px-8 pb-8">
        <Card>
          <CardContent className="p-0">
            {agentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <AgentJuliaTable
                agents={filteredAgents}
                onEdit={handleEdit}
                onViewDetails={handleViewDetails}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            )}
          </CardContent>
        </Card>

        {/* Total count */}
        {!agentsLoading && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Exibindo {filteredAgents.length} de {agents?.length || 0} agentes
          </div>
        )}
      </div>

      {/* Dialogs */}
      <EditAgentJuliaWizardDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        agent={selectedAgent}
        onSuccess={handleSaveEdit}
      />

      <CreateAgentJuliaWizardDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleAgentCreated}
      />

      <ConfirmStatusChangeDialog
        open={statusChangeDialogOpen}
        onOpenChange={setStatusChangeDialogOpen}
        agent={pendingStatusChange?.agent || null}
        newStatus={pendingStatusChange?.newStatus || false}
        onConfirm={handleConfirmStatusChange}
        isLoading={updateStatusMutation.isPending}
      />

      <LinkAgentHelenaDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        sessionToken={sessionToken}
        generateFreshToken={generateFreshToken}
      />

      <AgentDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        agent={selectedAgent}
      />

      <ConfirmDeleteAgentDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        agent={selectedAgent}
        onConfirm={handleConfirmDelete}
        isLoading={deleteAgentMutation.isPending}
        isCheckingSession={checkingSession}
        hasSessions={hasSessions}
      />
    </div>
  );
}
