import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgentPlan {
  id: number;
  name: string;
  limit: number;
  satus: boolean;
}

interface ExternalDbQueryResponse {
  success: boolean;
  data?: any[];
  rowCount?: number;
  error?: string;
}

export const useAgentPlans = () => {
  return useQuery<AgentPlan[], Error>({
    queryKey: ['agent-plans'],
    queryFn: async () => {
      const query = `
        SELECT id, name, "limit", satus
        FROM public.agents_plan
        WHERE satus = true
        ORDER BY name ASC
      `;
      
      const { data, error } = await supabase.functions.invoke<ExternalDbQueryResponse>(
        'public-external-db-query',
        { body: { query, params: [] } }
      );

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Failed to fetch plans');
      }

      return data.data as AgentPlan[];
    },
    staleTime: 60000,
  });
};
