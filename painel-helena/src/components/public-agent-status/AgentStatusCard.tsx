import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Phone, Bot, Building2, Power } from "lucide-react";
import { AgentStatus } from "@/hooks/usePublicAgentStatus";
import { usePublicAgentStatusMutation } from "@/hooks/usePublicAgentStatusMutation";
import { toast } from "sonner";
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

interface AgentStatusCardProps {
  agent: AgentStatus;
  sessionToken: string | null;
  generateFreshToken?: (() => string | null) | null;
}

export function AgentStatusCard({ agent, sessionToken, generateFreshToken }: AgentStatusCardProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
  
  const mutation = usePublicAgentStatusMutation();

  const formatPhone = (phone: string | number) => {
    const phoneStr = String(phone);
    const cleaned = phoneStr.replace(/\D/g, '');
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    if (cleaned.length === 12) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    }
    return phoneStr;
  };

  const handleToggle = (checked: boolean) => {
    if (!checked) {
      // Desativar - mostrar confirmação
      setPendingStatus(checked);
      setShowConfirmDialog(true);
    } else {
      // Ativar - executar direto
      executeToggle(checked);
    }
  };

  const executeToggle = (newStatus: boolean) => {
    mutation.mutate(
      {
        sessionId: agent.session_id,
        active: newStatus,
        sessionToken,
        generateFreshToken,
      },
      {
        onSuccess: () => {
          toast.success(newStatus ? "Agent ativado com sucesso!" : "Agent desativado com sucesso!");
        },
        onError: (error) => {
          toast.error(`Erro ao alterar status: ${error.message}`);
        },
      }
    );
  };

  const handleConfirmDeactivate = () => {
    if (pendingStatus !== null) {
      executeToggle(pendingStatus);
    }
    setShowConfirmDialog(false);
    setPendingStatus(null);
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto shadow-lg border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{agent.name}</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Building2 className="h-3 w-3" />
                  {agent.business_name || "Sem nome comercial"}
                </CardDescription>
              </div>
            </div>
            <Badge 
              variant={agent.active ? "default" : "destructive"}
              className={`text-sm px-3 py-1 ${agent.active ? 'bg-green-500 hover:bg-green-600' : ''}`}
            >
              {agent.active ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp</p>
                <p className="font-medium">{formatPhone(agent.whatsapp_number)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Bot className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Código do Agent</p>
                <p className="font-medium font-mono">{agent.cod_agent}</p>
              </div>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/50 border">
            <div className="flex items-center gap-3">
              <Power className={`h-5 w-5 ${agent.active ? 'text-green-500' : 'text-muted-foreground'}`} />
              <div>
                <p className="font-medium">Status do Agent</p>
                <p className="text-sm text-muted-foreground">
                  {agent.active ? "O agent está respondendo" : "O agent está pausado"}
                </p>
              </div>
            </div>
            
            <Switch
              checked={agent.active}
              onCheckedChange={handleToggle}
              disabled={mutation.isPending}
              className="data-[state=checked]:bg-green-500"
            />
          </div>

          {mutation.isPending && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Atualizando...</span>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar Agent?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao desativar o agent, ele deixará de responder automaticamente às mensagens. 
              Você pode reativá-lo a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatus(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDeactivate}
              className="bg-destructive hover:bg-destructive/90"
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
