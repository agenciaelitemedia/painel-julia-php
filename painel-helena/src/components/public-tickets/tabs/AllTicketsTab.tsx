import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { TicketCard } from "../cards/TicketCard";
import { TicketFilters } from "../filters/TicketFilters";
import { TicketDetailsDialog } from "../dialogs/TicketDetailsDialog";
import { TicketChatModal } from "../dialogs/TicketChatModal";

interface AllTicketsTabProps {
  tickets: any[];
  isLoading: boolean;
  helenaCountId: string;
  sectors: Array<{ id: string; name: string }>;
  teamMembers: Array<{ id: string; user_name: string; sector_id: string }>;
  onRefresh: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export function AllTicketsTab({
  tickets,
  isLoading,
  helenaCountId,
  sectors,
  teamMembers,
  onRefresh,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: AllTicketsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState("todas");
  const [sectorFilter, setSectorFilter] = useState("todos");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [chatTicket, setChatTicket] = useState<any>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      !searchTerm ||
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_number?.toString().includes(searchTerm);

    const matchesStatus =
      statusFilter === "todos" || ticket.status === statusFilter;

    const matchesPriority =
      priorityFilter === "todas" || ticket.priority === priorityFilter;

    const matchesSector =
      sectorFilter === "todos" || ticket.sector_id === sectorFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesSector;
  });

  // Sort by date (newest first)
  const sortedTickets = [...filteredTickets].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const activeFiltersCount = [
    statusFilter !== "todos",
    priorityFilter !== "todas",
    sectorFilter !== "todos",
    searchTerm !== "",
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("todos");
    setPriorityFilter("todas");
    setSectorFilter("todos");
  };

  // Infinite scroll using IntersectionObserver
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, onLoadMore]);

  if (isLoading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TicketFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        sectorFilter={sectorFilter}
        onSectorChange={setSectorFilter}
        sectors={sectors}
        onClearFilters={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
      />

      <div className="text-sm text-muted-foreground">
        {sortedTickets.length} ticket{sortedTickets.length !== 1 ? "s" : ""} encontrado
        {sortedTickets.length !== 1 ? "s" : ""}
      </div>

      {sortedTickets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum ticket encontrado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {sortedTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => setSelectedTicket(ticket)}
              onViewChat={() => setChatTicket(ticket)}
            />
          ))}

          {/* Load more trigger / loading indicator */}
          <div ref={loadMoreRef} className="py-2">
            {isLoadingMore && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Carregando mais tickets...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTicket && (
        <TicketDetailsDialog
          open={!!selectedTicket}
          onOpenChange={(open) => !open && setSelectedTicket(null)}
          ticket={selectedTicket}
          helenaCountId={helenaCountId}
          sectors={sectors}
          teamMembers={teamMembers}
          onUpdate={onRefresh}
        />
      )}

      <TicketChatModal
        open={!!chatTicket}
        onOpenChange={(open) => !open && setChatTicket(null)}
        helenaCountId={helenaCountId}
        codAgent={chatTicket?.cod_agent || null}
        whatsappNumber={chatTicket?.whatsapp_number || null}
        sessionId={chatTicket?.session_id || null}
      />
    </div>
  );
}
