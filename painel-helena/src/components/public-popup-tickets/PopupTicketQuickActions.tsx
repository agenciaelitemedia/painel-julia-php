import { useState } from "react";
import { Loader2, MessageSquare, CheckCircle, ArrowUpCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePublicTicketMutations } from "@/hooks/usePublicTicketMutations";
import { toast } from "sonner";
import type { Ticket } from "@/hooks/usePublicTickets";

interface PopupTicketQuickActionsProps {
  ticket: Ticket;
  helenaCountId: string;
  userId: string;
  userName: string;
  sectors: Array<{ id: string; name: string }>;
  teamMembers: Array<{ id: string; user_name: string; sector_id: string }>;
  onUpdate: () => void;
}

export function PopupTicketQuickActions({
  ticket,
  helenaCountId,
  userId,
  userName,
  sectors,
  teamMembers,
  onUpdate,
}: PopupTicketQuickActionsProps) {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState(ticket.status);

  const { updateTicket, addComment, isLoading } = usePublicTicketMutations(
    helenaCountId,
    userId,
    userName
  );

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus as any);
    const result = await updateTicket(ticket.id, { status: newStatus as any });
    if (result) {
      onUpdate();
    }
  };

  const handleResolve = async () => {
    const result = await updateTicket(ticket.id, { status: "resolvido" });
    if (result) {
      toast.success("Ticket resolvido!");
      onUpdate();
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    const success = await addComment(ticket.id, comment.trim(), true);
    if (success) {
      setComment("");
      setShowComment(false);
      onUpdate();
    }
  };

  const filteredTeamMembers = teamMembers.filter(
    (m) => m.sector_id === ticket.sector_id
  );

  return (
    <div className="space-y-3">
      {/* Quick Status Change */}
      <div className="flex flex-wrap gap-2">
        <Select value={status} onValueChange={handleStatusChange} disabled={isLoading}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="aberto">Aberto</SelectItem>
            <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
            <SelectItem value="aguardando">Aguardando</SelectItem>
            <SelectItem value="resolvido">Resolvido</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowComment(!showComment)}
          className="h-8 text-xs"
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          Comentar
        </Button>

        {ticket.status !== "resolvido" && (
          <Button
            variant="default"
            size="sm"
            onClick={handleResolve}
            disabled={isLoading}
            className="h-8 text-xs bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolver
          </Button>
        )}
      </div>

      {/* Comment Input */}
      {showComment && (
        <div className="space-y-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Adicionar comentário interno..."
            rows={2}
            className="text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowComment(false);
                setComment("");
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={!comment.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Send className="h-3 w-3 mr-1" />
              )}
              Enviar
            </Button>
          </div>
        </div>
      )}

      {/* Ticket info */}
      {ticket.description && (
        <div className="p-2 bg-muted rounded text-xs text-muted-foreground">
          {ticket.description.length > 100
            ? `${ticket.description.substring(0, 100)}...`
            : ticket.description}
        </div>
      )}
    </div>
  );
}
