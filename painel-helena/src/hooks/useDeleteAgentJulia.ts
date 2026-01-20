import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExternalDbQueryResponse {
  success: boolean;
  data?: any[];
  rowCount?: number;
  error?: string;
}

export interface DeleteAgentData {
  agentId: number;
  codAgent: string;
}

export const useCheckAgentSessions = () => {
  return useMutation({
    mutationFn: async (agentId: number): Promise<boolean> => {
      const query = `
        SELECT COUNT(*) as count FROM public.sessions WHERE agent_id = $1
      `;
      
      const { data, error } = await supabase.functions.invoke<ExternalDbQueryResponse>(
        'public-external-db-query',
        { body: { query, params: [agentId] } }
      );

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Failed to check sessions');
      }

      const count = parseInt(data.data?.[0]?.count || '0', 10);
      return count > 0;
    }
  });
};

export const useDeleteAgentJulia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agentId, codAgent }: DeleteAgentData): Promise<void> => {
      // First check if there are sessions
      const checkQuery = `SELECT COUNT(*) as count FROM public.sessions WHERE agent_id = $1`;
      
      const { data: checkData, error: checkError } = await supabase.functions.invoke<ExternalDbQueryResponse>(
        'public-external-db-query',
        { body: { query: checkQuery, params: [agentId] } }
      );

      if (checkError || !checkData?.success) {
        throw new Error(checkData?.error || checkError?.message || 'Failed to check sessions');
      }

      const sessionCount = parseInt(checkData.data?.[0]?.count || '0', 10);
      if (sessionCount > 0) {
        throw new Error('Não é possível excluir este agente pois existem sessões ativas associadas.');
      }

      // Step 1: Delete followup_config
      const deleteFollowupQuery = `DELETE FROM public.followup_config WHERE cod_agent = $1`;
      await supabase.functions.invoke<ExternalDbQueryResponse>(
        'public-external-db-query',
        { body: { query: deleteFollowupQuery, params: [codAgent] } }
      );

      // Step 2: Delete override_settings
      const deleteOverrideQuery = `DELETE FROM public.override_settings WHERE agent_id = $1`;
      await supabase.functions.invoke<ExternalDbQueryResponse>(
        'public-external-db-query',
        { body: { query: deleteOverrideQuery, params: [agentId] } }
      );

      // Step 3: Delete used_agents
      const deleteUsedAgentQuery = `DELETE FROM public.used_agents WHERE agent_id = $1`;
      await supabase.functions.invoke<ExternalDbQueryResponse>(
        'public-external-db-query',
        { body: { query: deleteUsedAgentQuery, params: [agentId] } }
      );

      // Step 4: Delete agents_helena
      const deleteAgentsHelenaQuery = `DELETE FROM public.agents_helena WHERE cod_agent = $1`;
      await supabase.functions.invoke<ExternalDbQueryResponse>(
        'public-external-db-query',
        { body: { query: deleteAgentsHelenaQuery, params: [codAgent] } }
      );

      // Step 5: Delete agent
      const deleteAgentQuery = `DELETE FROM public.agents WHERE id = $1`;
      const { error: deleteError } = await supabase.functions.invoke<ExternalDbQueryResponse>(
        'public-external-db-query',
        { body: { query: deleteAgentQuery, params: [agentId] } }
      );

      if (deleteError) {
        throw new Error(deleteError.message || 'Failed to delete agent');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-admin-agents-julia'] });
      toast.success('Agente excluído com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao excluir agente: ${error.message}`);
    }
  });
};
