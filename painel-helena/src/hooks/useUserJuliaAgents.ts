import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface UserJuliaAgent {
  id: string;
  user_id: string;
  cod_agent: string;
  is_default: boolean;
  created_at: string;
}

export const useUserJuliaAgents = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar cod_agents do usuário logado
  const { data: userAgents, isLoading } = useQuery({
    queryKey: ['user-julia-agents', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_julia_agents')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as UserJuliaAgent[];
    },
    enabled: !!user
  });

  // Adicionar novo cod_agent
  const addAgent = useMutation({
    mutationFn: async ({ cod_agent, is_default }: { cod_agent: string; is_default?: boolean }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('user_julia_agents')
        .insert({
          user_id: user.id,
          cod_agent,
          is_default: is_default || false,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-julia-agents'] });
      toast.success("Agente vinculado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao vincular agente: ${error.message}`);
    }
  });

  // Remover cod_agent
  const removeAgent = useMutation({
    mutationFn: async (agentId: string) => {
      const { error } = await supabase
        .from('user_julia_agents')
        .delete()
        .eq('id', agentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-julia-agents'] });
      toast.success("Agente removido com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao remover agente: ${error.message}`);
    }
  });

  // Definir agente padrão
  const setDefaultAgent = useMutation({
    mutationFn: async (agentId: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Primeiro, remover is_default de todos os agentes do usuário
      await supabase
        .from('user_julia_agents')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Depois, definir o novo padrão
      const { error } = await supabase
        .from('user_julia_agents')
        .update({ is_default: true })
        .eq('id', agentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-julia-agents'] });
      toast.success("Agente padrão definido!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao definir agente padrão: ${error.message}`);
    }
  });

  // Obter cod_agent padrão
  const defaultAgent = userAgents?.find(a => a.is_default) || userAgents?.[0];

  return {
    userAgents,
    defaultAgent,
    isLoading,
    hasCodAgents: (userAgents?.length || 0) > 0,
    addAgent,
    removeAgent,
    setDefaultAgent
  };
};
