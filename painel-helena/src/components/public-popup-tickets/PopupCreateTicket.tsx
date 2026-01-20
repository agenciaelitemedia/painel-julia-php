import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePublicTicketMutations } from "@/hooks/usePublicTicketMutations";

interface PopupCreateTicketProps {
  helenaCountId: string;
  codAgent: string;
  whatsappNumber: string;
  contactName: string;
  userId: string;
  userName: string;
  sectors: Array<{ id: string; name: string }>;
  teamMembers: Array<{ id: string; user_name: string; sector_id: string }>;
  helenaContactId: string;
  sessionId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PopupCreateTicket({
  helenaCountId,
  codAgent,
  whatsappNumber,
  contactName,
  userId,
  userName,
  sectors,
  teamMembers,
  helenaContactId,
  sessionId,
  onSuccess,
  onCancel,
}: PopupCreateTicketProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [priority, setPriority] = useState<"baixa" | "normal" | "alta" | "critica">("normal");
  const [assignedToId, setAssignedToId] = useState("");

  const { createTicket, isLoading } = usePublicTicketMutations(helenaCountId, userId, userName);

  const filteredTeamMembers = teamMembers.filter(
    (member) => member.sector_id === sectorId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    const result = await createTicket({
      title: title.trim(),
      description: description.trim() || undefined,
      sector_id: sectorId || undefined,
      priority,
      whatsapp_number: whatsappNumber || undefined,
      contact_name: contactName || undefined,
      cod_agent: codAgent || undefined,
      assigned_to_id: assignedToId || undefined,
      helena_contact_id: helenaContactId || undefined,
      session_id: sessionId || undefined,
    });

    if (result) {
      onSuccess();
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-medium">Novo Ticket</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Descreva o problema brevemente"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes adicionais..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Setor</Label>
            <Select value={sectorId} onValueChange={(v) => {
              setSectorId(v);
              setAssignedToId("");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
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
            <Label>Prioridade</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
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
        </div>

        {sectorId && filteredTeamMembers.length > 0 && (
          <div className="space-y-2">
            <Label>Atribuir para</Label>
            <Select value={assignedToId} onValueChange={setAssignedToId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione (opcional)" />
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

        {(whatsappNumber || contactName) && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="text-muted-foreground">Vinculado a:</p>
            <p className="font-medium">
              {contactName || whatsappNumber}
              {contactName && whatsappNumber && (
                <span className="text-muted-foreground ml-1">({whatsappNumber})</span>
              )}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={!title.trim() || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Ticket
          </Button>
        </div>
      </form>
    </div>
  );
}
