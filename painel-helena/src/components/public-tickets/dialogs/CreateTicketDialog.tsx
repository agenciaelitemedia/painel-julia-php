import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PhoneInput } from "@/components/ui/phone-input";
import { usePublicTicketMutations } from "@/hooks/usePublicTicketMutations";
import { ContactSearchStep } from "./ContactSearchStep";
import { HelenaContact } from "@/hooks/useHelenaContactSearch";
import { toast } from "sonner";

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  helenaCountId: string;
  sectors: Array<{ id: string; name: string; default_priority: string }>;
  teamMembers: Array<{ id: string; user_name: string; sector_id: string }>;
  prefilledData?: {
    whatsappNumber?: string;
    contactName?: string;
    codAgent?: string;
    chatContext?: string;
    helenaContactId?: string;
  };
  onSuccess?: () => void;
}

export function CreateTicketDialog({
  open,
  onOpenChange,
  helenaCountId,
  sectors,
  teamMembers,
  prefilledData,
  onSuccess,
}: CreateTicketDialogProps) {
  // Two-step flow: 'search' (find/create contact) or 'form' (create ticket)
  const [step, setStep] = useState<'search' | 'form'>('search');
  const [selectedContact, setSelectedContact] = useState<HelenaContact | null>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(prefilledData?.chatContext || "");
  const [sectorId, setSectorId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [assignmentType, setAssignmentType] = useState<"auto" | "manual">("auto");
  const [assignedToId, setAssignedToId] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState(prefilledData?.whatsappNumber || "55");
  const [contactName, setContactName] = useState(prefilledData?.contactName || "");
  const [helenaContactId, setHelenaContactId] = useState<string | undefined>(prefilledData?.helenaContactId);

  // Determine initial step based on prefilledData
  useEffect(() => {
    if (open) {
      // If prefilledData has contact info, skip search step
      if (prefilledData?.whatsappNumber && prefilledData?.contactName) {
        setStep('form');
      } else {
        setStep('search');
      }
    }
  }, [open, prefilledData]);

  // Atualizar quando prefilledData mudar
  useEffect(() => {
    if (prefilledData?.whatsappNumber) {
      setWhatsappNumber(prefilledData.whatsappNumber);
    }
    if (prefilledData?.contactName) {
      setContactName(prefilledData.contactName);
    }
    if (prefilledData?.chatContext) {
      setDescription(prefilledData.chatContext);
    }
    if (prefilledData?.helenaContactId) {
      setHelenaContactId(prefilledData.helenaContactId);
    }
  }, [prefilledData]);

  // Handle contact selection from search step
  const handleContactSelected = (contact: HelenaContact) => {
    setSelectedContact(contact);
    setContactName(contact.name);
    setWhatsappNumber(contact.phoneNumber || "55");
    setHelenaContactId(contact.id);
    setStep('form');
  };

  const { createTicket, isLoading: isCreating } = usePublicTicketMutations(helenaCountId, null);

  const filteredTeamMembers = teamMembers.filter(
    (member) => member.sector_id === sectorId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (!sectorId) {
      toast.error("Selecione um setor");
      return;
    }

    try {
      // Validar WhatsApp
      const cleanWhatsapp = whatsappNumber.replace(/\D/g, "");
      if (cleanWhatsapp.length < 10) {
        toast.error("Número de WhatsApp inválido");
        return;
      }

      await createTicket({
        title: title.trim(),
        description: description.trim(),
        sector_id: sectorId,
        priority: priority as 'baixa' | 'normal' | 'alta' | 'critica',
        assigned_to_id: assignmentType === "manual" ? assignedToId || undefined : undefined,
        whatsapp_number: cleanWhatsapp,
        contact_name: contactName.trim() || undefined,
        cod_agent: prefilledData?.codAgent,
        chat_context: prefilledData?.chatContext,
        helena_contact_id: helenaContactId,
      });

      toast.success("Ticket criado com sucesso!");
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Erro ao criar ticket");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription(prefilledData?.chatContext || "");
    setSectorId("");
    setPriority("normal");
    setAssignmentType("auto");
    setAssignedToId("");
    setWhatsappNumber(prefilledData?.whatsappNumber || "55");
    setContactName(prefilledData?.contactName || "");
    setHelenaContactId(prefilledData?.helenaContactId);
    setSelectedContact(null);
    // Reset to search step only if no prefilledData
    if (!prefilledData?.whatsappNumber || !prefilledData?.contactName) {
      setStep('search');
    }
  };

  // Handle dialog close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'search' ? 'Selecionar Contato' : 'Criar Novo Ticket'}
          </DialogTitle>
        </DialogHeader>

        {step === 'search' ? (
          <ContactSearchStep
            helenaCountId={helenaCountId}
            onContactSelected={handleContactSelected}
            onCancel={() => handleOpenChange(false)}
          />
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contactName">Nome do Cliente</Label>
            <Input
              id="contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Nome do cliente..."
            />
          </div>

          <PhoneInput
            id="whatsappNumber"
            label="WhatsApp do Cliente"
            value={whatsappNumber}
            onChange={setWhatsappNumber}
            required
          />

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Descreva brevemente o problema..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Setor *</Label>
              <Select value={sectorId} onValueChange={setSectorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
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
              <Select value={priority} onValueChange={setPriority}>
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

          <div className="space-y-3">
            <Label>Responsável</Label>
            <RadioGroup
              value={assignmentType}
              onValueChange={(v) => setAssignmentType(v as "auto" | "manual")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="auto" id="auto" />
                <Label htmlFor="auto" className="font-normal cursor-pointer">
                  Automático (fila do setor)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual" className="font-normal cursor-pointer">
                  Manual
                </Label>
              </div>
            </RadioGroup>

            {assignmentType === "manual" && sectorId && (
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredTeamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.user_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>


          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Ticket
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
