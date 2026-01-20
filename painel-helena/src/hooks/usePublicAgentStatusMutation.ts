import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ToggleActiveParams {
  sessionId: string;
  active: boolean;
  sessionToken: string | null;
  generateFreshToken?: (() => string | null) | null;
}

interface ExternalDbQueryResponse {
  success: boolean;
  data?: any[];
  rowCount?: number;
  error?: string;
}

export const usePublicAgentStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, active, sessionToken, generateFreshToken }: ToggleActiveParams) => {
      const headers: Record<string, string> = {};
      const freshToken = generateFreshToken ? generateFreshToken() : sessionToken;
      if (freshToken) {
        headers['x-session-token'] = freshToken;
      }

      const query = `UPDATE public.sessions SET active = $1 WHERE id = $2`;
      const params = [active, sessionId];

      const { data, error } = await supabase.functions.invoke<ExternalDbQueryResponse>(
        'public-external-db-query',
        {
          body: { query, params },
          headers
        }
      );

      if (error) {
        throw new Error(error.message || 'Falha ao atualizar status');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha ao atualizar status');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-agent-status'] });
    },
  });
};
