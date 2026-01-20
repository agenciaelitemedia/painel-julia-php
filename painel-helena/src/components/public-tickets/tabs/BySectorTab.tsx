import { useState } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { TicketCard } from "../cards/TicketCard";
import { TicketDetailsDialog } from "../dialogs/TicketDetailsDialog";
import { TicketChatModal } from "../dialogs/TicketChatModal";
import { TicketStatusBadge } from "../shared/TicketStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BySectorTabProps {
  tickets: any[];
  isLoading: boolean;
  helenaCountId: string;
  sectors: Array<{ id: string; name: string; color?: string }>;
  teamMembers: Array<{ id: string; user_name: string; sector_id: string }>;
  onRefresh: () => void;
}

export function BySectorTab({
  tickets,
  isLoading,
  helenaCountId,
  sectors,
  teamMembers,
  onRefresh,
}: BySectorTabProps) {
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(
    new Set(sectors.map((s) => s.id))
  );
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [chatTicket, setChatTicket] = useState<any>(null);

  const toggleSector = (sectorId: string) => {
    const newExpanded = new Set(expandedSectors);
    if (newExpanded.has(sectorId)) {
      newExpanded.delete(sectorId);
    } else {
      newExpanded.add(sectorId);
    }
    setExpandedSectors(newExpanded);
  };

  const getTicketsBySector = (sectorId: string) => {
    return tickets.filter((t) => t.sector_id === sectorId);
  };

  const getStatusCounts = (sectorTickets: any[]) => {
    const counts: Record<string, number> = {
      aberto: 0,
      em_atendimento: 0,
      aguardando: 0,
      resolvido: 0,
      cancelado: 0,
    };
    sectorTickets.forEach((ticket) => {
      if (counts[ticket.status] !== undefined) {
        counts[ticket.status]++;
      }
    });
    return counts;
  };

  const hasOverdueTickets = (sectorTickets: any[]) => {
    return sectorTickets.some(
      (t) => t.sla_breached || (t.sla_deadline && new Date(t.sla_deadline) < new Date())
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Include tickets without sector
  const ticketsWithoutSector = tickets.filter((t) => !t.sector_id);

  return (
    <div className="space-y-4">
      {sectors.map((sector) => {
        const sectorTickets = getTicketsBySector(sector.id);
        const statusCounts = getStatusCounts(sectorTickets);
        const isExpanded = expandedSectors.has(sector.id);
        const hasOverdue = hasOverdueTickets(sectorTickets);

        return (
          <div
            key={sector.id}
            className="border rounded-lg overflow-hidden"
          >
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start p-4 h-auto hover:bg-muted/50",
                hasOverdue && "border-l-4 border-l-destructive"
              )}
              onClick={() => toggleSector(sector.id)}
            >
              <div className="flex items-center gap-3 w-full">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: sector.color || "#6366f1" }}
                />
                <span className="font-medium">{sector.name}</span>
                <Badge variant="secondary" className="ml-2">
                  {sectorTickets.length}
                </Badge>

                <div className="flex gap-2 ml-auto">
                  {statusCounts.aberto > 0 && (
                    <div className="flex items-center gap-1">
                      <TicketStatusBadge status="aberto" />
                      <span className="text-xs">{statusCounts.aberto}</span>
                    </div>
                  )}
                  {statusCounts.em_atendimento > 0 && (
                    <div className="flex items-center gap-1">
                      <TicketStatusBadge status="em_atendimento" />
                      <span className="text-xs">{statusCounts.em_atendimento}</span>
                    </div>
                  )}
                  {statusCounts.aguardando > 0 && (
                    <div className="flex items-center gap-1">
                      <TicketStatusBadge status="aguardando" />
                      <span className="text-xs">{statusCounts.aguardando}</span>
                    </div>
                  )}
                </div>

                {hasOverdue && (
                  <Badge variant="destructive" className="ml-2">
                    SLA
                  </Badge>
                )}
              </div>
            </Button>

            {isExpanded && (
              <div className="p-4 pt-0 space-y-2">
                {sectorTickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum ticket neste setor
                  </p>
                ) : (
                  sectorTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onClick={() => setSelectedTicket(ticket)}
                      onViewChat={() => setChatTicket(ticket)}
                      compact
                    />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}

      {ticketsWithoutSector.length > 0 && (
        <div className="border rounded-lg overflow-hidden border-dashed">
          <div className="p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-muted-foreground" />
              <span className="font-medium text-muted-foreground">
                Sem Setor
              </span>
              <Badge variant="secondary">{ticketsWithoutSector.length}</Badge>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {ticketsWithoutSector.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={() => setSelectedTicket(ticket)}
                onViewChat={() => setChatTicket(ticket)}
                compact
              />
            ))}
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
