import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AvailableAgent {
  cod_agent: number;
  name: string;
  business_name: string | null;
}

interface ExternalDbQueryResponse {
  success: boolean;
  data?: AvailableAgent[];
  error?: string;
}

export const useAvailableAgentsForHelena = (
  sessionToken: string | null,
  generateFreshToken: (() => string | null) | null,
  enabled: boolean = true
) => {
  return useQuery<AvailableAgent[]>({
    queryKey: ['available-agents-helena'],
    queryFn: async () => {
      console.log('[useAvailableAgentsForHelena] Fetching available agents...');
      
      const headers: Record<string, string> = {};
      const freshToken = generateFreshToken ? generateFreshToken() : sessionToken;
      if (freshToken) {
        headers['x-session-token'] = freshToken;
      }

      // Query to get agents from view_clients that are NOT in agents_helena
      const query = `
        SELECT vc.cod_agent, vc.name, vc.business_name
        FROM public.view_clients vc
        WHERE NOT EXISTS (
          SELECT 1 FROM public.agents_helena ah 
          WHERE ah.cod_agent = vc.cod_agent
        )
        ORDER BY vc.name ASC
      `;

      const { data, error } = await supabase.functions.invoke<ExternalDbQueryResponse>(
        'public-external-db-query',
        {
          body: { query },
          headers
        }
      );

      if (error) {
        console.error('[useAvailableAgentsForHelena] Error:', error);
        throw new Error(error.message || 'Falha ao buscar agentes disponíveis');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha ao buscar dados');
      }

      console.log('[useAvailableAgentsForHelena] Fetched', data.data?.length, 'available agents');
      return data.data || [];
    },
    enabled: enabled && !!sessionToken,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};
