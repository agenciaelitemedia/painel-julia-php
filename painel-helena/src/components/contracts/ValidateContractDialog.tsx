import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { JuliaContractRecord } from "@/hooks/useJuliaContracts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ValidateContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: JuliaContractRecord | null;
}

export function ValidateContractDialog({ open, onOpenChange, contract }: ValidateContractDialogProps) {
  const queryClient = useQueryClient();
  const [isValidating, setIsValidating] = useState(false);
  const [showInvalidAlert, setShowInvalidAlert] = useState(false);
  const [checklist, setChecklist] = useState({
    dadosConferidos: false,
    cpfValido: false,
    assinaturaConfirmada: false,
    enderecoCorreto: false,
  });
  const [observations, setObservations] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setChecklist({
        dadosConferidos: false,
        cpfValido: false,
        assinaturaConfirmada: false,
        enderecoCorreto: false,
      });
      setObservations("");
    }
  }, [open]);

  const allChecked = Object.values(checklist).every(v => v);

  const handleValidate = async () => {
    if (!contract || !allChecked) return;

    setIsValidating(true);
    try {
      const { error } = await supabase.functions.invoke("external-db-query", {
        body: {
          query: `
            UPDATE public.sing_document 
            SET is_valid = true, updated_at = NOW() 
            WHERE cod_document = $1
          `,
          params: [contract.cod_document],
        },
      });

      if (error) throw error;

      toast.success("Contrato validado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["julia-contracts-data"] });
      queryClient.invalidateQueries({ queryKey: ["julia-contracts-summary"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Erro ao validar contrato: ${error.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleInvalidateContract = () => {
    if (!observations.trim()) {
      toast.error("Por favor, preencha o campo de observações para invalidar o contrato.");
      return;
    }
    setShowInvalidAlert(true);
  };

  const confirmInvalidateContract = async () => {
    if (!contract) return;

    setIsValidating(true);
    try {
      const { error } = await supabase.functions.invoke("external-db-query", {
        body: {
          query: `
            UPDATE public.sing_document 
            SET is_valid = false, updated_at = NOW() 
            WHERE cod_document = $1
          `,
          params: [contract.cod_document],
        },
      });

      if (error) throw error;

      toast.success("Contrato marcado como inválido!");
      queryClient.invalidateQueries({ queryKey: ["julia-contracts-data"] });
      queryClient.invalidateQueries({ queryKey: ["julia-contracts-summary"] });
      setShowInvalidAlert(false);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Erro ao invalidar contrato: ${error.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Validar Contrato</DialogTitle>
          <DialogDescription>
            Contrato #{contract?.cod_document}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Checklist de Validação *</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dados"
                checked={checklist.dadosConferidos}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, dadosConferidos: checked as boolean }))
                }
              />
              <label htmlFor="dados" className="text-sm cursor-pointer">
                Dados do contratante conferidos
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="cpf"
                checked={checklist.cpfValido}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, cpfValido: checked as boolean }))
                }
              />
              <label htmlFor="cpf" className="text-sm cursor-pointer">
                CPF válido
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="assinatura"
                checked={checklist.assinaturaConfirmada}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, assinaturaConfirmada: checked as boolean }))
                }
              />
              <label htmlFor="assinatura" className="text-sm cursor-pointer">
                Assinatura confirmada
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="endereco"
                checked={checklist.enderecoCorreto}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, enderecoCorreto: checked as boolean }))
                }
              />
              <label htmlFor="endereco" className="text-sm cursor-pointer">
                Endereço correto
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              placeholder="Adicione observações sobre a validação..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            variant="destructive"
            onClick={handleInvalidateContract}
            disabled={isValidating}
          >
            {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Contrato Inválido
          </Button>
          <Button 
            onClick={handleValidate}
            disabled={!allChecked || isValidating}
          >
            {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Validar Contrato
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={showInvalidAlert} onOpenChange={setShowInvalidAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Invalidação do Contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação marcará o contrato como inválido e não poderá ser desfeita. 
              Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmInvalidateContract} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Invalidação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
