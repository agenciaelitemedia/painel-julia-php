import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface CreateAgentJuliaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: CreateAgentData) => void;
}

export interface CreateAgentData {
  name: string;
  business_name: string;
  email: string;
  phone: string;
  plan: string;
  limit: number;
  wp_number: string;
}

export function CreateAgentJuliaDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateAgentJuliaDialogProps) {
  const [formData, setFormData] = useState<CreateAgentData>({
    name: '',
    business_name: '',
    email: '',
    phone: '',
    plan: '',
    limit: 100,
    wp_number: '',
  });

  const handleCreate = () => {
    if (!formData.name || !formData.email) {
      toast.error('Nome e email são obrigatórios');
      return;
    }
    
    onCreate(formData);
    toast.success('Agente criado com sucesso!');
    onOpenChange(false);
    setFormData({
      name: '',
      business_name: '',
      email: '',
      phone: '',
      plan: '',
      limit: 100,
      wp_number: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Agente Julia</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Nome */}
          <div className="grid gap-2">
            <Label htmlFor="new-name">Nome *</Label>
            <Input
              id="new-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do agente"
            />
          </div>

          {/* Escritório */}
          <div className="grid gap-2">
            <Label htmlFor="new-business">Escritório</Label>
            <Input
              id="new-business"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              placeholder="Nome do escritório"
            />
          </div>

          {/* Email */}
          <div className="grid gap-2">
            <Label htmlFor="new-email">Email *</Label>
            <Input
              id="new-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>

          {/* Telefone */}
          <div className="grid gap-2">
            <Label htmlFor="new-phone">Telefone</Label>
            <Input
              id="new-phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

          {/* Plano */}
          <div className="grid gap-2">
            <Label htmlFor="new-plan">Plano</Label>
            <Select
              value={formData.plan}
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
            <Label htmlFor="new-limit">Limite de Uso</Label>
            <Input
              id="new-limit"
              type="number"
              value={formData.limit}
              onChange={(e) => setFormData({ ...formData, limit: parseInt(e.target.value) || 0 })}
            />
          </div>

          {/* WhatsApp */}
          <div className="grid gap-2">
            <Label htmlFor="new-wp">Número WhatsApp</Label>
            <Input
              id="new-wp"
              value={formData.wp_number}
              onChange={(e) => setFormData({ ...formData, wp_number: e.target.value })}
              placeholder="5511999999999"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate}>
            Criar Agente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
