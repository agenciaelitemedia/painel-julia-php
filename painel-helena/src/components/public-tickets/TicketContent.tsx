import { useState } from "react";
import { Plus, Settings, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MyTicketsTab } from "./tabs/MyTicketsTab";
import { AllTicketsTab } from "./tabs/AllTicketsTab";
import { BySectorTab } from "./tabs/BySectorTab";
import { OverdueTicketsTab } from "./tabs/OverdueTicketsTab";
import { ReportsTab } from "./tabs/ReportsTab";
import { CreateTicketDialog } from "./dialogs/CreateTicketDialog";
import { ManageSectorsDialog } from "./dialogs/ManageSectorsDialog";
import { ManageTeamDialog } from "./dialogs/ManageTeamDialog";
import { usePublicTickets } from "@/hooks/usePublicTickets";
import { usePublicTicketSectors } from "@/hooks/usePublicTicketSectors";
import { usePublicTicketTeam } from "@/hooks/usePublicTicketTeam";
import { Badge } from "@/components/ui/badge";

interface TicketContentProps {
  helenaCountId: string;
  currentUserId?: string;
}

export function TicketContent({ helenaCountId, currentUserId }: TicketContentProps) {
  const [activeTab, setActiveTab] = useState("meus");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSectorsDialog, setShowSectorsDialog] = useState(false);
  const [showTeamDialog, setShowTeamDialog] = useState(false);

  // Use pageSize of 25 for main tickets page
  const { 
    tickets, 
    isLoading: ticketsLoading, 
    isLoadingMore,
    hasMore,
    fetchTickets,
    loadMore 
  } = usePublicTickets(helenaCountId, 25);
  
  const { sectors, isLoading: sectorsLoading } = usePublicTicketSectors(helenaCountId);
  const { members: teamMembers, isLoading: teamLoading } = usePublicTicketTeam(helenaCountId);
  
  const refetchTickets = () => fetchTickets();

  const isLoading = ticketsLoading || sectorsLoading || teamLoading;

  // Count open tickets
  const openTicketsCount = tickets.filter(
    (t) => t.status !== "resolvido" && t.status !== "cancelado"
  ).length;

  // Count overdue tickets
  const overdueCount = tickets.filter((ticket) => {
    if (ticket.status === "resolvido" || ticket.status === "cancelado") return false;
    if (ticket.sla_breached) return true;
    if (ticket.sla_deadline && new Date(ticket.sla_deadline) < new Date()) return true;
    return false;
  }).length;

  // Count my tickets
  const myTicketsCount = tickets.filter((ticket) => {
    const assignedMember = teamMembers.find((m) => m.id === ticket.assigned_to_id);
    return assignedMember?.user_id === currentUserId && 
           ticket.status !== "resolvido" && 
           ticket.status !== "cancelado";
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Central de Tickets</h1>
          <p className="text-muted-foreground">
            Gerencie chamados e acompanhe atendimentos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTeamDialog(true)}
          >
            <Users className="h-4 w-4 mr-2" />
            Equipe
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSectorsDialog(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Setores
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Ticket
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="meus" className="gap-2">
            Meus Tickets
            {myTicketsCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {myTicketsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="todos" className="gap-2">
            Todos
            {openTicketsCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {openTicketsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="setor">Por Setor</TabsTrigger>
          <TabsTrigger value="atraso" className="gap-2">
            Em Atraso
            {overdueCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {overdueCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="meus" className="mt-6">
          <MyTicketsTab
            tickets={tickets}
            isLoading={isLoading}
            helenaCountId={helenaCountId}
            sectors={sectors}
            teamMembers={teamMembers}
            currentUserId={currentUserId}
            onRefresh={refetchTickets}
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
          />
        </TabsContent>

        <TabsContent value="todos" className="mt-6">
          <AllTicketsTab
            tickets={tickets}
            isLoading={isLoading}
            helenaCountId={helenaCountId}
            sectors={sectors}
            teamMembers={teamMembers}
            onRefresh={refetchTickets}
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
          />
        </TabsContent>

        <TabsContent value="setor" className="mt-6">
          <BySectorTab
            tickets={tickets}
            isLoading={isLoading}
            helenaCountId={helenaCountId}
            sectors={sectors}
            teamMembers={teamMembers}
            onRefresh={refetchTickets}
          />
        </TabsContent>

        <TabsContent value="atraso" className="mt-6">
          <OverdueTicketsTab
            tickets={tickets}
            isLoading={isLoading}
            helenaCountId={helenaCountId}
            sectors={sectors}
            teamMembers={teamMembers}
            onRefresh={refetchTickets}
          />
        </TabsContent>

        <TabsContent value="relatorios" className="mt-6">
          <ReportsTab
            tickets={tickets}
            isLoading={isLoading}
            sectors={sectors}
            teamMembers={teamMembers}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateTicketDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        helenaCountId={helenaCountId}
        sectors={sectors}
        teamMembers={teamMembers}
        onSuccess={refetchTickets}
      />

      <ManageSectorsDialog
        open={showSectorsDialog}
        onOpenChange={setShowSectorsDialog}
        helenaCountId={helenaCountId}
      />

      <ManageTeamDialog
        open={showTeamDialog}
        onOpenChange={setShowTeamDialog}
        helenaCountId={helenaCountId}
      />
    </div>
  );
}
