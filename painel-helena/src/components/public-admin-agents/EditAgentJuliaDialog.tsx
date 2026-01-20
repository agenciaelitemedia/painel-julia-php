import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminAgentJulia } from "@/hooks/usePublicAdminAgentsJulia";
import { toast } from "sonner";

interface EditAgentJuliaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: AdminAgentJulia | null;
  onSave: (agent: AdminAgentJulia) => void;
}

export function EditAgentJuliaDialog({
  open,
  onOpenChange,
  agent,
  onSave,
}: EditAgentJuliaDialogProps) {
  const [formData, setFormData] = useState<Partial<AdminAgentJulia>>({});

  useEffect(() => {
    if (agent) {
      setFormData({ ...agent });
    }
  }, [agent]);

  const handleSave = () => {
    if (!formData.cod_agent) return;
    
    onSave(formData as AdminAgentJulia);
    toast.success('Agente atualizado com sucesso!');
    onOpenChange(false);
  };

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Agente - {agent.cod_agent}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <Label htmlFor="status">Status Ativo</Label>
            <Switch
              id="status"
              checked={formData.status === 'active' || formData.status === 'ativo'}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, status: checked ? 'active' : 'inactive' })
              }
              className="data-[state=checked]:bg-green-500"
            />
          </div>

          {/* Nome */}
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Escritório */}
          <div className="grid gap-2">
            <Label htmlFor="business_name">Escritório</Label>
            <Input
              id="business_name"
              value={formData.business_name || ''}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
            />
          </div>

          {/* Plano */}
          <div className="grid gap-2">
            <Label htmlFor="plan">Plano</Label>
            <Select
              value={formData.plan || ''}
              onValueChange={(value) => setFormData({ ...formData, plan: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SDR Start">SDR Start</SelectItem>
                <SelectItem value="SDR Ultra">SDR Ultra</SelectItem>
                <SelectItem value="CLOSER Start">CLOSER Start</SelectItem>
                <SelectItem value="CLOSER Ultra">CLOSER Ultra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Limite */}
          <div className="grid gap-2">
            <Label htmlFor="limit">Limite de Uso</Label>
            <Input
              id="limit"
              type="number"
              value={formData.limit || 0}
              onChange={(e) => setFormData({ ...formData, limit: parseInt(e.target.value) || 0 })}
            />
          </div>

          {/* WhatsApp */}
          <div className="grid gap-2">
            <Label htmlFor="wp_number">Número WhatsApp</Label>
            <Input
              id="wp_number"
              value={formData.wp_number || ''}
              onChange={(e) => setFormData({ ...formData, wp_number: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
