import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LinkAgentHelenaData {
  cod_agent: number;
  helena_count_id: string;
  helena_token: string;
  helena_user_id?: string;
  wp_number?: string;
  status: boolean;
}

interface ExternalDbMutationResponse {
  success: boolean;
  rowCount?: number;
  error?: string;
}

export const useLinkAgentHelena = (
  sessionToken: string | null,
  generateFreshToken: (() => string | null) | null
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LinkAgentHelenaData) => {
      console.log('[useLinkAgentHelena] Linking agent:', data.cod_agent);
      
      const headers: Record<string, string> = {};
      const freshToken = generateFreshToken ? generateFreshToken() : sessionToken;
      if (freshToken) {
        headers['x-session-token'] = freshToken;
      }

      // 1. Insert into agents_helena table
      const insertHelenaQuery = `
        INSERT INTO public.agents_helena (
          cod_agent, helena_count_id, helena_token, helena_user_id, wp_number, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `;

      const helenaParams = [
        data.cod_agent,
        data.helena_count_id,
        data.helena_token,
        data.helena_user_id || null,
        data.wp_number || null,
        data.status
      ];

      const { data: helenaResult, error: helenaError } = await supabase.functions.invoke<ExternalDbMutationResponse>(
        'public-external-db-query',
        {
          body: { query: insertHelenaQuery, params: helenaParams },
          headers
        }
      );

      if (helenaError) {
        console.error('[useLinkAgentHelena] Error inserting into agents_helena:', helenaError);
        throw new Error(helenaError.message || 'Falha ao vincular agente na tabela agents_helena');
      }

      if (!helenaResult?.success) {
        throw new Error(helenaResult?.error || 'Falha ao vincular agente na tabela agents_helena');
      }

      console.log('[useLinkAgentHelena] agents_helena insert success. Rows affected:', helenaResult.rowCount);

      // 2. Update agents table with helena data (mapping: helena_count_id -> evo_url, helena_token -> evo_apikey, wp_number -> evo_instance)
      const updateAgentsQuery = `
        UPDATE public.agents
        SET evo_url = $1, evo_apikey = $2, evo_instance = $3, status = $4, updated_at = NOW()
        WHERE cod_agent = $5
      `;

      const agentsParams = [
        data.helena_count_id,
        data.helena_token,
        data.wp_number || null,
        data.status,
        data.cod_agent
      ];

      const { data: agentsResult, error: agentsError } = await supabase.functions.invoke<ExternalDbMutationResponse>(
        'public-external-db-query',
        {
          body: { query: updateAgentsQuery, params: agentsParams },
          headers
        }
      );

      if (agentsError) {
        console.error('[useLinkAgentHelena] Error updating agents:', agentsError);
        // Don't throw here, the main insert succeeded
      } else if (!agentsResult?.success) {
        console.error('[useLinkAgentHelena] agents update failed:', agentsResult?.error);
      } else {
        console.log('[useLinkAgentHelena] agents update success. Rows affected:', agentsResult.rowCount);
      }

      return { cod_agent: data.cod_agent, rowCount: helenaResult.rowCount };
    },
    onSuccess: () => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['admin-agents-julia'] });
      queryClient.invalidateQueries({ queryKey: ['available-agents-helena'] });
    },
  });
};
