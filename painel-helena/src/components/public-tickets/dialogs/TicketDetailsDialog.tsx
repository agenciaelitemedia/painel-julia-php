import { useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketStatusBadge } from "../shared/TicketStatusBadge";
import { TicketPriorityBadge } from "../shared/TicketPriorityBadge";
import { TicketTimeline } from "../shared/TicketTimeline";
import { usePublicTicketMutations } from "@/hooks/usePublicTicketMutations";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TicketDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: any;
  helenaCountId: string;
  sectors: Array<{ id: string; name: string }>;
  teamMembers: Array<{ id: string; user_name: string; sector_id: string }>;
  onUpdate?: () => void;
}

export function TicketDetailsDialog({
  open,
  onOpenChange,
  ticket,
  helenaCountId,
  sectors,
  teamMembers,
  onUpdate,
}: TicketDetailsDialogProps) {
  const [newComment, setNewComment] = useState("");
  const [status, setStatus] = useState(ticket?.status || "");
  const [priority, setPriority] = useState(ticket?.priority || "");
  const [sectorId, setSectorId] = useState(ticket?.sector_id || "");
  const [assignedToId, setAssignedToId] = useState(ticket?.assigned_to_id || "");

  const { updateTicket, addComment, isLoading } =
    usePublicTicketMutations(helenaCountId, null);
  const isUpdating = isLoading;
  const isAddingComment = isLoading;

  const filteredTeamMembers = teamMembers.filter(
    (member) => member.sector_id === (sectorId || ticket?.sector_id)
  );

  const handleUpdateStatus = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      await updateTicket(ticket.id, {
        status: newStatus as any,
      });
      toast.success("Status atualizado");
      onUpdate?.();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleUpdatePriority = async (newPriority: string) => {
    setPriority(newPriority);
    try {
      await updateTicket(ticket.id, {
        priority: newPriority as any,
      });
      toast.success("Prioridade atualizada");
      onUpdate?.();
    } catch (error) {
      toast.error("Erro ao atualizar prioridade");
    }
  };

  const handleUpdateSector = async (newSectorId: string) => {
    setSectorId(newSectorId);
    setAssignedToId("");
    try {
      await updateTicket(ticket.id, {
        sector_id: newSectorId,
        assigned_to_id: null,
      });
      toast.success("Setor atualizado");
      onUpdate?.();
    } catch (error) {
      toast.error("Erro ao atualizar setor");
    }
  };

  const handleUpdateAssignment = async (newAssignedToId: string) => {
    const actualValue = newAssignedToId === "unassigned" ? null : newAssignedToId;
    setAssignedToId(newAssignedToId);
    try {
      await updateTicket(ticket.id, {
        assigned_to_id: actualValue,
      });
      toast.success("Responsável atualizado");
      onUpdate?.();
    } catch (error) {
      toast.error("Erro ao atualizar responsável");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await addComment(ticket.id, newComment.trim(), true);
      setNewComment("");
      toast.success("Comentário adicionado");
      onUpdate?.();
    } catch (error) {
      toast.error("Erro ao adicionar comentário");
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl">{ticket.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Ticket #{ticket.ticket_number} • Criado em{" "}
                {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="comments">Comentários</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            {ticket.description && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-medium mb-2">Descrição</h4>
                <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
              </div>
            )}

            {ticket.contact_name && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-medium mb-2">Contato Vinculado</h4>
                <p className="text-sm">
                  {ticket.contact_name}
                  {ticket.whatsapp_number && (
                    <span className="text-muted-foreground ml-2">
                      ({ticket.whatsapp_number})
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={status || ticket.status}
                  onValueChange={handleUpdateStatus}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
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
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Prioridade</label>
                <Select
                  value={priority || ticket.priority}
                  onValueChange={handleUpdatePriority}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Setor</label>
                <Select
                  value={sectorId || ticket.sector_id}
                  onValueChange={handleUpdateSector}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((sector) => (
                      <SelectItem key={sector.id} value={sector.id}>
                        {sector.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Responsável</label>
                <Select
                  value={assignedToId || ticket.assigned_to_id || "unassigned"}
                  onValueChange={handleUpdateAssignment}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Não atribuído" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Não atribuído</SelectItem>
                    {filteredTeamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.user_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Textarea
                placeholder="Adicionar comentário interno..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || isAddingComment}
                size="sm"
              >
                {isAddingComment && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <MessageSquare className="mr-2 h-4 w-4" />
                Adicionar Comentário
              </Button>
            </div>

            {ticket.comments && ticket.comments.length > 0 ? (
              <div className="space-y-3">
                {ticket.comments.map((comment: any) => (
                  <div
                    key={comment.id}
                    className="p-3 bg-muted rounded-lg border-l-2 border-primary"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {comment.user_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum comentário ainda
              </p>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <TicketTimeline history={ticket.history || []} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
