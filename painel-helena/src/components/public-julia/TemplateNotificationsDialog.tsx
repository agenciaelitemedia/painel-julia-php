import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, Plus, X, Loader2, Bell } from "lucide-react";
import { useUpdateTemplateObservers } from "@/hooks/useZapSignTemplates";

interface TemplateNotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateToken: string | null;
  templateName: string;
  sessionToken: string | null;
  onSave: () => void;
}

const MAX_OBSERVERS = 20;

export function TemplateNotificationsDialog({
  open,
  onOpenChange,
  templateToken,
  templateName,
  sessionToken,
  onSave
}: TemplateNotificationsDialogProps) {
  const [observers, setObservers] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  
  const updateObserversMutation = useUpdateTemplateObservers();

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAddEmail = () => {
    const email = newEmail.trim().toLowerCase();
    
    if (!email) return;
    
    if (!isValidEmail(email)) {
      toast.error("Email inválido");
      return;
    }
    
    if (observers.includes(email)) {
      toast.error("Este email já foi adicionado");
      return;
    }
    
    if (observers.length >= MAX_OBSERVERS) {
      toast.error(`Limite máximo de ${MAX_OBSERVERS} emails atingido`);
      return;
    }
    
    setObservers([...observers, email]);
    setNewEmail("");
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setObservers(observers.filter(email => email !== emailToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleSave = async () => {
    if (!templateToken || !sessionToken) {
      toast.error("Dados do template não disponíveis");
      return;
    }

    try {
      await updateObserversMutation.mutateAsync({
        templateToken,
        observers,
        sessionToken
      });

      toast.success("Notificações configuradas com sucesso");
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Update observers error:', error);
      toast.error(error.message || "Erro ao salvar notificações");
    }
  };

  const handleClose = () => {
    setObservers([]);
    setNewEmail("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notificações Externas
          </DialogTitle>
          <DialogDescription>
            Configure emails que receberão uma cópia do documento quando todos os signatários assinarem o template "{templateName}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Adicionar Email</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={observers.length >= MAX_OBSERVERS}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddEmail}
                disabled={!newEmail.trim() || observers.length >= MAX_OBSERVERS}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {observers.length}/{MAX_OBSERVERS} emails configurados
            </p>
          </div>

          {observers.length > 0 && (
            <div className="space-y-2">
              <Label>Emails Configurados</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30 min-h-[60px]">
                {observers.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    <Mail className="h-3 w-3" />
                    <span className="max-w-[180px] truncate">{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {observers.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                Nenhum email configurado ainda.
              </p>
              <p className="text-xs mt-1">
                Adicione emails para receber notificações quando o documento for assinado.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateObserversMutation.isPending}
          >
            {updateObserversMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
