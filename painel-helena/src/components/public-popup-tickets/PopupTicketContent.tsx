import { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, Ticket, TicketCheck, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PopupTicketList } from "./PopupTicketList";
import { PopupCreateTicket } from "./PopupCreateTicket";
import { PopupContactInfo } from "./PopupContactInfo";
import { usePublicTickets, TicketFilters } from "@/hooks/usePublicTickets";
import { usePublicTicketSectors } from "@/hooks/usePublicTicketSectors";
import { usePublicTicketTeam } from "@/hooks/usePublicTicketTeam";
import { useHelenaContactInfo } from "@/hooks/useHelenaContactInfo";
import { Skeleton } from "@/components/ui/skeleton";

interface PopupTicketContentProps {
  helenaCountId: string;
  codAgent: string;
  whatsappNumber: string;
  contactName: string;
  userId: string;
  userName: string;
  helenaContactId: string;
  sessionId?: string;
}

export function PopupTicketContent({
  helenaCountId,
  codAgent,
  whatsappNumber,
  contactName,
  userId,
  userName,
  helenaContactId,
  sessionId,
}: PopupTicketContentProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"pendentes" | "resolvidos">("pendentes");
  
  // Use pageSize of 10 for popup tickets
  const {
    tickets,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchTickets,
    contactStats,
    fetchContactStats,
    loadMore,
  } = usePublicTickets(helenaCountId, 10);
  
  const { sectors, isLoading: sectorsLoading, fetchSectors } = usePublicTicketSectors(helenaCountId);
  const { members: teamMembers, isLoading: teamLoading, fetchMembers: fetchTeamMembers } = usePublicTicketTeam(helenaCountId);
  
  // Fetch Helena contact info
  const { 
    contactInfo, 
    isLoading: contactLoading 
  } = useHelenaContactInfo(helenaCountId, helenaContactId);

  // Build contact filters
  const getContactFilters = useCallback((): TicketFilters => {
    const filters: TicketFilters = {
      order_by: 'overdue_first'
    };
    if (helenaContactId) {
      filters.helena_contact_id = helenaContactId;
    } else if (whatsappNumber) {
      filters.whatsapp_number = whatsappNumber;
    }
    return filters;
  }, [helenaContactId, whatsappNumber]);

  // Load initial data
  useEffect(() => {
    if (helenaCountId) {
      fetchSectors();
      fetchTeamMembers();
    }
  }, [helenaCountId]);

  // Load contact-specific stats
  useEffect(() => {
    if (helenaCountId) {
      const filters = getContactFilters();
      fetchContactStats(filters);
    }
  }, [helenaCountId, helenaContactId, whatsappNumber, fetchContactStats, getContactFilters]);

  // Load tickets only for this contact with overdue ordering
  useEffect(() => {
    if (helenaCountId) {
      const filters = getContactFilters();
      fetchTickets(filters, 1);
    }
  }, [helenaCountId, whatsappNumber, helenaContactId, fetchTickets, getContactFilters]);

  const handleRefresh = useCallback(() => {
    const filters = getContactFilters();
    fetchTickets(filters, 1);
    fetchContactStats(filters);
  }, [fetchTickets, fetchContactStats, getContactFilters]);

  const handleLoadMore = useCallback(() => {
    loadMore();
  }, [loadMore]);

  const handleTicketCreated = useCallback(() => {
    setShowCreateForm(false);
    handleRefresh();
  }, [handleRefresh]);

  // Filter contact tickets - separate pending and resolved
  const contactTickets = tickets.filter(t => {
    const matchesContact = helenaContactId 
      ? (t as any).helena_contact_id === helenaContactId 
      : t.whatsapp_number === whatsappNumber;
    return matchesContact;
  });

  const pendingTickets = contactTickets.filter(t => 
    !['resolvido', 'cancelado'].includes(t.status)
  );

  const resolvedTickets = contactTickets.filter(t => 
    t.status === 'resolvido'
  );

  // Count for badges
  const pendingCount = contactStats?.pending || pendingTickets.length;
  const resolvedCount = contactStats?.by_status?.resolvido || resolvedTickets.length;

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      {/* Contact Info Card */}
      <PopupContactInfo
        contactInfo={contactInfo}
        isLoading={contactLoading}
        fallbackName={contactName}
        fallbackPhone={whatsappNumber}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Tickets</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCreateForm(true)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        </div>
      </div>

      {/* Quick Stats - Contact specific */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="p-2">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Abertos</p>
              <p className="text-lg font-bold">{contactStats?.by_status?.aberto || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Em Atend.</p>
              <p className="text-lg font-bold">{contactStats?.by_status?.em_atendimento || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Aguard.</p>
              <p className="text-lg font-bold">{contactStats?.by_status?.aguardando || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-2">
          <div className="flex items-center gap-2">
            <TicketCheck className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Resolvidos</p>
              <p className="text-lg font-bold">{contactStats?.by_status?.resolvido || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Create Form or Ticket List with Tabs */}
      {showCreateForm ? (
        <PopupCreateTicket
          helenaCountId={helenaCountId}
          codAgent={codAgent}
          whatsappNumber={whatsappNumber}
          contactName={contactName}
          userId={userId}
          userName={userName}
          sectors={sectors}
          teamMembers={teamMembers}
          helenaContactId={helenaContactId}
          sessionId={sessionId}
          onSuccess={handleTicketCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pendentes" | "resolvidos")} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pendentes" className="gap-2">
                Pendentes
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] text-xs">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="resolvidos" className="gap-2">
                Resolvidos
                {resolvedCount > 0 && (
                  <Badge variant="outline" className="ml-1 h-5 min-w-[20px] text-xs">
                    {resolvedCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pendentes" className="flex-1 overflow-auto mt-4">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : pendingTickets.length > 0 ? (
                <PopupTicketList
                  tickets={pendingTickets}
                  helenaCountId={helenaCountId}
                  userId={userId}
                  userName={userName}
                  sectors={sectors}
                  teamMembers={teamMembers}
                  onUpdate={handleRefresh}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                  isLoadingMore={isLoadingMore}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <TicketCheck className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum ticket pendente
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowCreateForm(true)}
                    className="mt-1"
                  >
                    Criar novo ticket
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="resolvidos" className="flex-1 overflow-auto mt-4">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : resolvedTickets.length > 0 ? (
                <PopupTicketList
                  tickets={resolvedTickets}
                  helenaCountId={helenaCountId}
                  userId={userId}
                  userName={userName}
                  sectors={sectors}
                  teamMembers={teamMembers}
                  onUpdate={handleRefresh}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                  isLoadingMore={isLoadingMore}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <TicketCheck className="h-10 w-10 text-green-500/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum ticket resolvido
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
