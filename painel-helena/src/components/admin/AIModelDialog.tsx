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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIModel {
  id: string;
  provider: string;
  model_name: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  is_default: boolean;
  max_tokens: number;
  temperature: number;
  pricing_per_1k_input: number | null;
  pricing_per_1k_output: number | null;
  capabilities: any;
}

interface AIModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: AIModel | null;
}

export function AIModelDialog({ open, onOpenChange, model }: AIModelDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    provider: 'openai',
    model_name: '',
    display_name: '',
    description: '',
    is_active: true,
    max_tokens: 4096,
    temperature: 0.7,
    pricing_per_1k_input: 0,
    pricing_per_1k_output: 0,
  });

  useEffect(() => {
    if (model) {
      setFormData({
        provider: model.provider,
        model_name: model.model_name,
        display_name: model.display_name,
        description: model.description || '',
        is_active: model.is_active,
        max_tokens: model.max_tokens,
        temperature: model.temperature,
        pricing_per_1k_input: model.pricing_per_1k_input || 0,
        pricing_per_1k_output: model.pricing_per_1k_output || 0,
      });
    } else {
      setFormData({
        provider: 'openai',
        model_name: '',
        display_name: '',
        description: '',
        is_active: true,
        max_tokens: 4096,
        temperature: 0.7,
        pricing_per_1k_input: 0,
        pricing_per_1k_output: 0,
      });
    }
  }, [model]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (model) {
        const { error } = await supabase
          .from('ai_models_config')
          .update(formData)
          .eq('id', model.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ai_models_config')
          .insert([formData]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-models'] });
      toast.success(model ? 'Modelo atualizado' : 'Modelo criado');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar: ' + error.message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {model ? 'Editar Modelo' : 'Novo Modelo de IA'}
          </DialogTitle>
          <DialogDescription>
            Configure os parâmetros do modelo de IA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select 
                value={formData.provider}
                onValueChange={(value) => setFormData({ ...formData, provider: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model_name">Nome do Modelo</Label>
              <Input
                id="model_name"
                value={formData.model_name}
                onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                placeholder="gpt-4o-mini"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name">Nome de Exibição</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="GPT-4o Mini"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do modelo..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_tokens">Máximo de Tokens</Label>
              <Input
                id="max_tokens"
                type="number"
                value={formData.max_tokens}
                onChange={(e) => setFormData({ ...formData, max_tokens: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pricing_input">Custo Input (por 1k tokens)</Label>
              <Input
                id="pricing_input"
                type="number"
                step="0.0001"
                value={formData.pricing_per_1k_input}
                onChange={(e) => setFormData({ ...formData, pricing_per_1k_input: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricing_output">Custo Output (por 1k tokens)</Label>
              <Input
                id="pricing_output"
                type="number"
                step="0.0001"
                value={formData.pricing_per_1k_output}
                onChange={(e) => setFormData({ ...formData, pricing_per_1k_output: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Modelo Ativo</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
