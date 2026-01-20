import { useState } from "react";
import { Loader2, ArrowRightLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

interface TransferTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: any;
  helenaCountId: string;
  userId: string;
  userName: string;
  sectors: Array<{ id: string; name: string; support_level?: string }>;
  teamMembers: Array<{ id: string; user_name: string; sector_id: string; support_level?: string }>;
  onSuccess: () => void;
}

export function TransferTicketDialog({
  open,
  onOpenChange,
  ticket,
  helenaCountId,
  userId,
  userName,
  sectors,
  teamMembers,
  onSuccess,
}: TransferTicketDialogProps) {
  const [targetSectorId, setTargetSectorId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [reason, setReason] = useState("");

  const { updateTicket, addComment, isLoading } = usePublicTicketMutations(
    helenaCountId,
    userId,
    userName
  );

  const filteredTeamMembers = teamMembers.filter(
    (m) => m.sector_id === targetSectorId
  );

  const handleTransfer = async () => {
    if (!targetSectorId && !targetUserId) {
      toast.error("Selecione um setor ou responsável");
      return;
    }

    // Add transfer comment
    if (reason.trim()) {
      await addComment(
        ticket.id,
        `**Transferência:** ${reason.trim()}`,
        true
      );
    }

    // Update ticket
    const updates: any = {};
    if (targetSectorId && targetSectorId !== ticket.sector_id) {
      updates.sector_id = targetSectorId;
    }
    if (targetUserId) {
      updates.assigned_to_id = targetUserId === "unassigned" ? null : targetUserId;
    }

    const result = await updateTicket(ticket.id, updates);
    
    if (result) {
      toast.success("Ticket transferido com sucesso");
      onOpenChange(false);
      onSuccess();
      // Reset form
      setTargetSectorId("");
      setTargetUserId("");
      setReason("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transferir Ticket
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium">#{ticket?.ticket_number} - {ticket?.title}</p>
            <p className="text-muted-foreground mt-1">
              Setor atual: {sectors.find(s => s.id === ticket?.sector_id)?.name || "Nenhum"}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Novo Setor</Label>
            <Select 
              value={targetSectorId} 
              onValueChange={(v) => {
                setTargetSectorId(v);
                setTargetUserId("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o setor" />
              </SelectTrigger>
              <SelectContent>
                {sectors.map((sector) => (
                  <SelectItem 
                    key={sector.id} 
                    value={sector.id}
                    disabled={sector.id === ticket?.sector_id}
                  >
                    {sector.name}
                    {sector.support_level && (
                      <span className="ml-2 text-muted-foreground">
                        (Nível {sector.support_level.toUpperCase()})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {targetSectorId && (
            <div className="space-y-2">
              <Label>Novo Responsável (opcional)</Label>
              <Select value={targetUserId} onValueChange={setTargetUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Não atribuir</SelectItem>
                  {filteredTeamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.user_name}
                      {member.support_level && (
                        <span className="ml-2 text-muted-foreground">
                          ({member.support_level.toUpperCase()})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Motivo da Transferência</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo da transferência..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={isLoading || (!targetSectorId && !targetUserId)}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
