import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UpdateStatusParams {
  codAgent: number;
  newStatus: boolean;
}

interface ExternalDbMutationResponse {
  success: boolean;
  rowCount?: number;
  error?: string;
}

export const useUpdateAgentStatus = (
  sessionToken: string | null,
  generateFreshToken: (() => string | null) | null
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ codAgent, newStatus }: UpdateStatusParams) => {
      console.log('[useUpdateAgentStatus] Updating agent:', codAgent, 'to status:', newStatus);
      
      const headers: Record<string, string> = {};
      const freshToken = generateFreshToken ? generateFreshToken() : sessionToken;
      if (freshToken) {
        headers['x-session-token'] = freshToken;
      }

      // Update status in both agents and agents_helena tables
      const updateAgentsQuery = `
        UPDATE public.agents
        SET status = $1, updated_at = NOW()
        WHERE cod_agent = $2
      `;

      const updateHelenaQuery = `
        UPDATE public.agents_helena
        SET status = $1, updated_at = NOW()
        WHERE cod_agent = $2
      `;

      // Update agents table
      const { data, error } = await supabase.functions.invoke<ExternalDbMutationResponse>(
        'public-external-db-query',
        {
          body: { 
            query: updateAgentsQuery, 
            params: [newStatus, codAgent] 
          },
          headers
        }
      );

      if (error) {
        console.error('[useUpdateAgentStatus] Error updating agents:', error);
        throw new Error(error.message || 'Falha ao atualizar status do agente');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha ao atualizar status');
      }

      // Update agents_helena table
      const { data: helenaData, error: helenaError } = await supabase.functions.invoke<ExternalDbMutationResponse>(
        'public-external-db-query',
        {
          body: { 
            query: updateHelenaQuery, 
            params: [newStatus, codAgent] 
          },
          headers
        }
      );

      if (helenaError) {
        console.error('[useUpdateAgentStatus] Error updating agents_helena:', helenaError);
        // Don't throw here, the main update succeeded
      }

      console.log('[useUpdateAgentStatus] Helena update result:', helenaData);

      if (error) {
        console.error('[useUpdateAgentStatus] Error:', error);
        throw new Error(error.message || 'Falha ao atualizar status do agente');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha ao atualizar status');
      }

      console.log('[useUpdateAgentStatus] Success. Rows affected:', data.rowCount);
      return { codAgent, newStatus, rowCount: data.rowCount };
    },
    onSuccess: () => {
      // Invalidate the agents query to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['admin-agents-julia'] });
    },
  });
};
