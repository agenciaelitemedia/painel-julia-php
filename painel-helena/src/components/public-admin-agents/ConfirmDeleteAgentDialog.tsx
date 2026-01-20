import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { AdminAgentJulia } from "@/hooks/usePublicAdminAgentsJulia";

interface ConfirmDeleteAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: AdminAgentJulia | null;
  onConfirm: () => void;
  isLoading: boolean;
  isCheckingSession: boolean;
  hasSessions: boolean;
}

export function ConfirmDeleteAgentDialog({
  open,
  onOpenChange,
  agent,
  onConfirm,
  isLoading,
  isCheckingSession,
  hasSessions,
}: ConfirmDeleteAgentDialogProps) {
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
  const canDelete = confirmed && isCodeValid && !isLoading && !hasSessions && !isCheckingSession;

  const handleConfirm = () => {
    if (canDelete) {
      onConfirm();
    }
  };

  if (!agent) return null;

  return (
    <AlertDialog open={open} onOpenChange={(value) => !isLoading && onOpenChange(value)}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir Agente
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Você está prestes a excluir permanentemente o agente:
              </p>
              
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    Cód: {agent.cod_agent}
                  </Badge>
                </div>
                <p className="font-medium text-foreground">{agent.name}</p>
                {agent.business_name && (
                  <p className="text-sm text-muted-foreground">{agent.business_name}</p>
                )}
              </div>

              {/* Loading state while checking sessions */}
              {isCheckingSession ? (
                <div className="p-3 bg-muted/50 border rounded-lg flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Verificando sessões ativas...
                  </p>
                </div>
              ) : hasSessions ? (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Não é possível excluir este agente
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Existem sessões ativas associadas a este agente. Remova as sessões antes de excluir.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-sm font-medium text-amber-600">
                      Os seguintes dados serão excluídos:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                      <li>Configurações de followup</li>
                      <li>Configurações personalizadas (override_settings)</li>
                      <li>Vínculos de agentes usados</li>
                      <li>Vínculo Atende Julia (agents_helena)</li>
                      <li>Registro do agente</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      * O cliente não será excluído
                    </p>
                  </div>

                  {/* Confirmation Checkbox */}
                  <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                    <Checkbox
                      id="confirm-delete"
                      checked={confirmed}
                      onCheckedChange={(checked) => setConfirmed(checked === true)}
                    />
                    <Label
                      htmlFor="confirm-delete"
                      className="text-sm leading-tight cursor-pointer"
                    >
                      Entendo que esta ação é irreversível e todos os dados do agente serão permanentemente excluídos.
                    </Label>
                  </div>

                  {/* Code Input for Security */}
                  <div className="space-y-2">
                    <Label htmlFor="cod-agent-delete-confirm" className="text-sm">
                      Digite o código do agente para confirmar: <span className="font-mono font-bold">{agent.cod_agent}</span>
                    </Label>
                    <Input
                      id="cod-agent-delete-confirm"
                      placeholder="Digite o código do agente"
                      value={codAgentInput}
                      onChange={(e) => setCodAgentInput(e.target.value)}
                      className={`font-mono ${isCodeValid ? 'border-green-500 focus-visible:ring-green-500' : ''}`}
                    />
                    {codAgentInput && !isCodeValid && (
                      <p className="text-xs text-destructive">O código digitado não corresponde ao agente selecionado.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          {!hasSessions && !isCheckingSession && (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={!canDelete || isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Agente
                </>
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
