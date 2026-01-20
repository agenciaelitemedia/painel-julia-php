import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, X } from "lucide-react";
import { usePublicAgentMutations } from "@/hooks/usePublicAgentMutations";

interface AgentCase {
  id: number;
  activation_phrase: string;
  campaing_link: string | null;
  case_fees?: string | null;
  case_title: string;
  category_name: string;
}

interface EditCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData: AgentCase | null;
  sessionToken: string | null;
}

export function EditCaseDialog({
  open,
  onOpenChange,
  caseData,
  sessionToken,
}: EditCaseDialogProps) {
  const [activationPhrases, setActivationPhrases] = useState<string[]>([]);
  const [newPhrase, setNewPhrase] = useState("");
  const [campaingLink, setCampaingLink] = useState("");
  const [caseFees, setCaseFees] = useState("");

  const { updateAgentCase } = usePublicAgentMutations();

  // Preencher campos quando o dialog abre com dados do caso
  useEffect(() => {
    if (open && caseData) {
      const phrases = caseData.activation_phrase?.split("||").filter(Boolean) || [];
      setActivationPhrases(phrases);
      setCampaingLink(caseData.campaing_link || "");
      setCaseFees(caseData.case_fees || "");
    }
  }, [open, caseData]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setActivationPhrases([]);
      setNewPhrase("");
      setCampaingLink("");
      setCaseFees("");
    }
  }, [open]);

  const handleAddPhrase = () => {
    const trimmed = newPhrase.trim();
    if (trimmed && !activationPhrases.includes(trimmed)) {
      setActivationPhrases([...activationPhrases, trimmed]);
      setNewPhrase("");
    }
  };

  const handleRemovePhrase = (phrase: string) => {
    setActivationPhrases(activationPhrases.filter((p) => p !== phrase));
  };

  const handleSubmit = () => {
    if (!sessionToken || !caseData || activationPhrases.length === 0) {
      return;
    }

    updateAgentCase.mutate(
      {
        id: caseData.id.toString(),
        activation_phrase: activationPhrases.join("||"),
        campaing_link: campaingLink.trim() || undefined,
        case_fees: caseFees.trim() || undefined,
        sessionToken,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const isFormValid = activationPhrases.length > 0;

  if (!caseData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Caso Vinculado</DialogTitle>
          <DialogDescription>
            Atualize as informações do caso {caseData.case_title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações do Caso (somente leitura) */}
          <div className="space-y-2 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Categoria:</span>
              <span className="text-sm font-semibold">{caseData.category_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Caso:</span>
              <span className="text-sm font-semibold">{caseData.case_title}</span>
            </div>
          </div>

          {/* Frases de Ativação */}
          <div className="space-y-2">
            <Label>Frases de Ativação *</Label>
            <div className="flex gap-2">
              <Input
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value.slice(0, 200))}
                placeholder="Digite uma frase de ativação"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddPhrase();
                  }
                }}
                maxLength={200}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddPhrase}
                disabled={!newPhrase.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {activationPhrases.length > 0 && (
              <div className="space-y-1 mt-2">
                {activationPhrases.map((phrase) => (
                  <div
                    key={phrase}
                    className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                  >
                    <span className="truncate flex-1">{phrase}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-2"
                      onClick={() => handleRemovePhrase(phrase)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Adicione uma ou mais frases que ativam esta campanha ({activationPhrases.length} adicionadas)
            </p>
          </div>

          {/* Link da Campanha */}
          <div className="space-y-2">
            <Label htmlFor="edit-link">Link da Campanha (opcional)</Label>
            <Input
              id="edit-link"
              type="url"
              value={campaingLink}
              onChange={(e) => setCampaingLink(e.target.value.slice(0, 200))}
              placeholder="https://..."
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              URL para rastreamento ou landing page da campanha
            </p>
          </div>

          {/* Mensagem de Honorários */}
          <div className="space-y-2">
            <Label htmlFor="edit-fees">Mensagem de Honorários do Caso (opcional)</Label>
            <Textarea
              id="edit-fees"
              value={caseFees}
              onChange={(e) => setCaseFees(e.target.value.slice(0, 1000))}
              placeholder="Digite a mensagem sobre os honorários do caso..."
              className="min-h-[200px] resize-y"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {caseFees.length}/1000 caracteres
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateAgentCase.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || updateAgentCase.isPending}
          >
            {updateAgentCase.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
