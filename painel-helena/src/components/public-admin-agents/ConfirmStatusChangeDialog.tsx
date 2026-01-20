import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { AdminAgentJulia } from "@/hooks/usePublicAdminAgentsJulia";

interface ConfirmStatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: AdminAgentJulia | null;
  newStatus: boolean;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmStatusChangeDialog({
  open,
  onOpenChange,
  agent,
  newStatus,
  onConfirm,
  isLoading = false,
}: ConfirmStatusChangeDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [codAgentInput, setCodAgentInput] = useState("");

  // Reset states when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setConfirmed(false);
      setCodAgentInput("");
    }
  }, [open]);

  const isCodeValid = agent ? codAgentInput === agent.cod_agent.toString() : false;
  const canConfirm = confirmed && isCodeValid && !isLoading;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
    }
  };

  if (!agent) return null;

  const actionText = newStatus ? "ATIVAR" : "DESATIVAR";
  const actionColor = newStatus ? "text-green-600" : "text-destructive";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${newStatus ? 'bg-green-100' : 'bg-destructive/10'}`}>
              <AlertTriangle className={`h-5 w-5 ${actionColor}`} />
            </div>
            <AlertDialogTitle>
              Confirmar {newStatus ? "Ativação" : "Desativação"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            Você está prestes a <span className={`font-semibold ${actionColor}`}>{actionText}</span> o agente:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Agent Info */}
          <div className="p-3 bg-muted/50 rounded-lg border">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Código:</span>
              <span className="font-mono font-bold">{agent.cod_agent}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-muted-foreground">Nome:</span>
              <span className="font-medium">{agent.name}</span>
            </div>
            {agent.business_name && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-muted-foreground">Escritório:</span>
                <span className="text-sm">{agent.business_name}</span>
              </div>
            )}
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
            <Checkbox
              id="confirm-action"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
            />
            <Label htmlFor="confirm-action" className="text-sm leading-tight cursor-pointer">
              Confirmo que desejo {newStatus ? "ativar" : "desativar"} este agente e entendo as consequências desta ação.
            </Label>
          </div>

          {/* Code Input for Security */}
          <div className="space-y-2">
            <Label htmlFor="cod-agent-confirm" className="text-sm">
              Digite o código do agente para confirmar: <span className="font-mono font-bold">{agent.cod_agent}</span>
            </Label>
            <Input
              id="cod-agent-confirm"
              placeholder="Digite o código do agente"
              value={codAgentInput}
              onChange={(e) => setCodAgentInput(e.target.value)}
              className={`font-mono ${isCodeValid ? 'border-green-500 focus-visible:ring-green-500' : ''}`}
            />
            {codAgentInput && !isCodeValid && (
              <p className="text-xs text-destructive">O código digitado não corresponde ao agente selecionado.</p>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant={newStatus ? "default" : "destructive"}
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              `${actionText} Agente`
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
