import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AIModelDialog } from "@/components/admin/AIModelDialog";

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

export default function AIModelsConfig() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const queryClient = useQueryClient();

  const { data: models, isLoading } = useQuery({
    queryKey: ['ai-models'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_models_config')
        .select('*')
        .order('display_name');
      
      if (error) throw error;
      return data as AIModel[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (modelId: string) => {
      const { error } = await supabase
        .from('ai_models_config')
        .delete()
        .eq('id', modelId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-models'] });
      toast.success('Modelo deletado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao deletar modelo: ' + error.message);
    }
  });

  const toggleDefaultMutation = useMutation({
    mutationFn: async (modelId: string) => {
      // Primeiro, remover default de todos
      await supabase
        .from('ai_models_config')
        .update({ is_default: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Depois, definir o selecionado como default
      const { error } = await supabase
        .from('ai_models_config')
        .update({ is_default: true })
        .eq('id', modelId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-models'] });
      toast.success('Modelo padrão atualizado');
    }
  });

  const handleEdit = (model: AIModel) => {
    setSelectedModel(model);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedModel(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Modelos de IA</h1>
          <p className="text-muted-foreground">Configure os modelos disponíveis para os agentes</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Modelo
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando modelos...</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {models?.map((model) => (
            <Card key={model.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle>{model.display_name}</CardTitle>
                    <CardDescription>{model.provider}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {model.is_default && (
                      <Badge variant="default">Padrão</Badge>
                    )}
                    {model.is_active ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-700">
                        Inativo
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {model.description || 'Sem descrição'}
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modelo:</span>
                    <span className="font-mono">{model.model_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Tokens:</span>
                    <span>{model.max_tokens}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Temperature:</span>
                    <span>{model.temperature}</span>
                  </div>
                  {model.pricing_per_1k_input && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Custo (1k tokens):</span>
                      <span>
                        R$ {model.pricing_per_1k_input.toFixed(4)} / 
                        R$ {model.pricing_per_1k_output?.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleEdit(model)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  {!model.is_default && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleDefaultMutation.mutate(model.id)}
                    >
                      Definir como Padrão
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja deletar este modelo?')) {
                        deleteMutation.mutate(model.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AIModelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        model={selectedModel}
      />
    </div>
  );
}
