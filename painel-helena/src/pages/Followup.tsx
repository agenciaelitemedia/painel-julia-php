import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Trash2, Loader2, Repeat, BarChart3, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface FollowupConfigItem {
  id: string;
  agent_id: string;
  is_active: boolean;
  auto_message: boolean;
  followup_from: number | null;
  followup_to: number | null;
  julia_agents: {
    name: string;
    agent_code: string;
  } | null;
}

export default function Followup() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);

  const { data: configs, isLoading } = useQuery({
    queryKey: ['followup-configs', profile?.client_id],
    queryFn: async () => {
      if (!profile?.client_id) return [];
      
      const { data, error } = await supabase
        .from('followup_configs')
        .select(`
          id,
          agent_id,
          is_active,
          auto_message,
          followup_from,
          followup_to,
          julia_agents (
            name,
            agent_code
          )
        `)
        .eq('client_id', profile.client_id);

      if (error) throw error;
      return data as FollowupConfigItem[];
    },
    enabled: !!profile?.client_id
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Deletar steps primeiro
      await supabase
        .from('followup_steps')
        .delete()
        .eq('config_id', id);

      // Depois deletar config
      const { error } = await supabase
        .from('followup_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followup-configs'] });
      toast.success('Configuração de follow-up excluída com sucesso');
      setDeleteDialogOpen(false);
      setConfigToDelete(null);
    },
    onError: (error) => {
      toast.error('Erro ao excluir configuração');
      console.error('Error deleting config:', error);
    }
  });

  const handleDelete = (id: string) => {
    setConfigToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (config: FollowupConfigItem) => {
    navigate(`/followup-config/${config.id}`);
  };

  const handleDeleteConfig = (id: string) => {
    handleDelete(id);
  };

  const confirmDelete = () => {
    if (configToDelete) {
      deleteMutation.mutate(configToDelete);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Follow-up Automático</h1>
          <p className="text-muted-foreground">
            Configure sequências de mensagens automáticas para reengajamento
          </p>
        </div>
        <Button onClick={() => navigate('/followup-config/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Configuração
        </Button>
      </div>

      {configs && configs.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {configs.map((config) => (
            <Card key={config.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Repeat className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {config.julia_agents?.name || 'Agente não encontrado'}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {config.julia_agents?.agent_code}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={config.is_active ? "default" : "secondary"}>
                    {config.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Mensagens automáticas:</span>
                    <Badge variant="outline">
                      {config.auto_message ? "Sim" : "Não"}
                    </Badge>
                  </div>
                  {config.followup_from && config.followup_to && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Loop infinito:</span>
                      <Badge variant="outline">
                        Etapa {config.followup_from} → {config.followup_to}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate(`/followup-funnel/${config.id}`)}
                    className="flex-1"
                  >
                    <Users className="mr-2 h-3 w-3" />
                    Funil
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate(`/followup-dashboard/${config.id}`)}
                    className="flex-1"
                  >
                    <BarChart3 className="mr-2 h-3 w-3" />
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(config)}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteConfig(config.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Repeat className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma configuração criada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie sua primeira configuração de follow-up para começar
            </p>
            <Button onClick={() => navigate('/followup-config/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Configuração
            </Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta configuração de follow-up? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
