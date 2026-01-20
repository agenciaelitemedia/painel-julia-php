import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronRight, User, Clock, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TicketStatusBadge } from "@/components/public-tickets/shared/TicketStatusBadge";
import { TicketPriorityBadge } from "@/components/public-tickets/shared/TicketPriorityBadge";
import { PopupTicketQuickActions } from "./PopupTicketQuickActions";
import type { Ticket } from "@/hooks/usePublicTickets";

interface PopupTicketListProps {
  tickets: Ticket[];
  helenaCountId: string;
  userId: string;
  userName: string;
  sectors: Array<{ id: string; name: string }>;
  teamMembers: Array<{ id: string; user_name: string; sector_id: string }>;
  onUpdate: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export function PopupTicketList({
  tickets,
  helenaCountId,
  userId,
  userName,
  sectors,
  teamMembers,
  onUpdate,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: PopupTicketListProps) {
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const toggleExpand = (ticketId: string) => {
    setExpandedTicketId(expandedTicketId === ticketId ? null : ticketId);
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

  return (
    <div className="space-y-2">
      {tickets.map((ticket) => {
        const isExpanded = expandedTicketId === ticket.id;
        const sectorName = sectors.find(s => s.id === ticket.sector_id)?.name || "Sem setor";
        const assigneeName = ticket.assigned_to?.user_name || "Não atribuído";

        return (
          <Card
            key={ticket.id}
            className={`transition-all ${isExpanded ? 'ring-1 ring-primary' : ''}`}
          >
            <CardContent className="p-3">
              {/* Main ticket info */}
              <div
                className="flex items-start gap-2 cursor-pointer"
                onClick={() => toggleExpand(ticket.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      #{ticket.ticket_number}
                    </span>
                    <TicketStatusBadge status={ticket.status} />
                    <TicketPriorityBadge priority={ticket.priority} />
                  </div>
                  <h4 className="text-sm font-medium truncate">{ticket.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {assigneeName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(ticket.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </div>

              {/* Expanded actions */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t">
                  <PopupTicketQuickActions
                    ticket={ticket}
                    helenaCountId={helenaCountId}
                    userId={userId}
                    userName={userName}
                    sectors={sectors}
                    teamMembers={teamMembers}
                    onUpdate={onUpdate}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Load more trigger / loading indicator */}
      <div ref={loadMoreRef} className="py-2">
        {isLoadingMore && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Carregando...</span>
          </div>
        )}
      </div>
    </div>
  );
}
