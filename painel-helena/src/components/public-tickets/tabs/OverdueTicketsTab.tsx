import { useState } from "react";
import { AlertTriangle, Clock, Loader2 } from "lucide-react";
import { TicketCard } from "../cards/TicketCard";
import { TicketDetailsDialog } from "../dialogs/TicketDetailsDialog";
import { TicketChatModal } from "../dialogs/TicketChatModal";
import { Badge } from "@/components/ui/badge";
import { differenceInHours, differenceInMinutes } from "date-fns";

interface OverdueTicketsTabProps {
  tickets: any[];
  isLoading: boolean;
  helenaCountId: string;
  sectors: Array<{ id: string; name: string }>;
  teamMembers: Array<{ id: string; user_name: string; sector_id: string }>;
  onRefresh: () => void;
}

export function OverdueTicketsTab({
  tickets,
  isLoading,
  helenaCountId,
  sectors,
  teamMembers,
  onRefresh,
}: OverdueTicketsTabProps) {
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [chatTicket, setChatTicket] = useState<any>(null);

  // Filter overdue or breached tickets
  const overdueTickets = tickets.filter((ticket) => {
    if (ticket.status === "resolvido" || ticket.status === "cancelado") {
      return false;
    }
    if (ticket.sla_breached) return true;
    if (ticket.sla_deadline && new Date(ticket.sla_deadline) < new Date()) {
      return true;
    }
    return false;
  });

  // Sort by severity (most overdue first)
  const sortedTickets = [...overdueTickets].sort((a, b) => {
    // Priority first
    const priorityOrder = { critica: 0, alta: 1, normal: 2, baixa: 3 };
    const priorityDiff =
      (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) -
      (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);

    if (priorityDiff !== 0) return priorityDiff;

    // Then by how overdue they are
    const aDeadline = a.sla_deadline ? new Date(a.sla_deadline) : new Date();
    const bDeadline = b.sla_deadline ? new Date(b.sla_deadline) : new Date();
    return aDeadline.getTime() - bDeadline.getTime();
  });

  const getOverdueTime = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const hoursOverdue = differenceInHours(now, deadlineDate);
    const minutesOverdue = differenceInMinutes(now, deadlineDate);

    if (hoursOverdue >= 24) {
      return `${Math.floor(hoursOverdue / 24)}d ${hoursOverdue % 24}h atrasado`;
    }
    if (hoursOverdue >= 1) {
      return `${hoursOverdue}h atrasado`;
    }
    return `${minutesOverdue}min atrasado`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <div>
          <h3 className="font-semibold text-destructive">
            {overdueTickets.length} ticket{overdueTickets.length !== 1 ? "s" : ""} em
            atraso
          </h3>
          <p className="text-sm text-muted-foreground">
            Tickets que ultrapassaram o prazo de SLA
          </p>
        </div>
      </div>

      {sortedTickets.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nenhum ticket em atraso. Excelente!
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {sortedTickets.map((ticket) => (
            <div key={ticket.id} className="relative">
              <TicketCard
                ticket={ticket}
                onClick={() => setSelectedTicket(ticket)}
                onViewChat={() => setChatTicket(ticket)}
              />
              {ticket.sla_deadline && (
                <Badge
                  variant="destructive"
                  className="absolute top-2 right-2"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {getOverdueTime(ticket.sla_deadline)}
                </Badge>
              )}
            </div>
          ))}
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
