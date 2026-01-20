import { useState } from "react";
import { Loader2, ArrowUpCircle, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { usePublicTicketMutations } from "@/hooks/usePublicTicketMutations";
import { toast } from "sonner";

interface EscalateTicketDialogProps {
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

const SUPPORT_LEVELS = [
  { value: "n1", label: "N1 - Suporte Básico", color: "bg-blue-500" },
  { value: "n2", label: "N2 - Suporte Técnico", color: "bg-yellow-500" },
  { value: "n3", label: "N3 - Suporte Especializado", color: "bg-red-500" },
];

export function EscalateTicketDialog({
  open,
  onOpenChange,
  ticket,
  helenaCountId,
  userId,
  userName,
  sectors,
  teamMembers,
  onSuccess,
}: EscalateTicketDialogProps) {
  const currentLevel = ticket?.current_level || "n1";
  const [targetLevel, setTargetLevel] = useState("");
  const [targetSectorId, setTargetSectorId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [reason, setReason] = useState("");

  const { updateTicket, addComment, isLoading } = usePublicTicketMutations(
    helenaCountId,
    userId,
    userName
  );

  // Filter sectors by target level
  const filteredSectors = sectors.filter(
    (s) => s.support_level === targetLevel
  );

  const filteredTeamMembers = teamMembers.filter(
    (m) => m.sector_id === targetSectorId && m.support_level === targetLevel
  );

  // Get available next levels
  const getNextLevels = () => {
    const levelIndex = SUPPORT_LEVELS.findIndex((l) => l.value === currentLevel);
    return SUPPORT_LEVELS.slice(levelIndex + 1);
  };

  const nextLevels = getNextLevels();

  const handleEscalate = async () => {
    if (!targetLevel) {
      toast.error("Selecione o nível de escalonamento");
      return;
    }

    if (!reason.trim()) {
      toast.error("Informe o motivo do escalonamento");
      return;
    }

    // Add escalation comment
    await addComment(
      ticket.id,
      `**Escalonamento para ${targetLevel.toUpperCase()}:** ${reason.trim()}`,
      true
    );

    // Update ticket with new level
    const updates: any = {
      // Note: These fields need to be handled by the edge function
    };

    if (targetSectorId) {
      updates.sector_id = targetSectorId;
    }
    if (targetUserId) {
      updates.assigned_to_id = targetUserId;
    }

    const result = await updateTicket(ticket.id, updates);
    
    if (result) {
      toast.success(`Ticket escalonado para ${targetLevel.toUpperCase()}`);
      onOpenChange(false);
      onSuccess();
      // Reset form
      setTargetLevel("");
      setTargetSectorId("");
      setTargetUserId("");
      setReason("");
    }
  };

  const currentLevelInfo = SUPPORT_LEVELS.find((l) => l.value === currentLevel);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-orange-500" />
            Escalonar Ticket
          </DialogTitle>
          <DialogDescription>
            Encaminhe este ticket para um nível superior de suporte.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current ticket info */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">#{ticket?.ticket_number} - {ticket?.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Escalonamentos: {ticket?.escalation_count || 0}
                </p>
              </div>
              <Badge className={`${currentLevelInfo?.color} text-white`}>
                Nível {currentLevel?.toUpperCase()}
              </Badge>
            </div>
          </div>

          {nextLevels.length === 0 ? (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm">
                Este ticket já está no nível máximo de suporte (N3).
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Escalonar para *</Label>
                <Select 
                  value={targetLevel} 
                  onValueChange={(v) => {
                    setTargetLevel(v);
                    setTargetSectorId("");
                    setTargetUserId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    {nextLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${level.color}`} />
                          {level.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {targetLevel && filteredSectors.length > 0 && (
                <div className="space-y-2">
                  <Label>Setor de {targetLevel.toUpperCase()} (opcional)</Label>
                  <Select 
                    value={targetSectorId} 
                    onValueChange={(v) => {
                      setTargetSectorId(v);
                      setTargetUserId("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Manter setor atual" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {targetSectorId && filteredTeamMembers.length > 0 && (
                <div className="space-y-2">
                  <Label>Atribuir para (opcional)</Label>
                  <Select value={targetUserId} onValueChange={setTargetUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Atribuição automática" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTeamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.user_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Motivo do Escalonamento *</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Descreva o motivo do escalonamento e o que já foi tentado..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Inclua informações sobre tentativas de resolução anteriores.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          {nextLevels.length > 0 && (
            <Button
              onClick={handleEscalate}
              disabled={isLoading || !targetLevel || !reason.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Escalonar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
