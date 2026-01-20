import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ExternalDbQueryResponse {
  success: boolean;
  data?: any[];
  rowCount?: number;
  error?: string;
}

export const usePublicExternalDbQuery = <T = any>(
  queryKey: string,
  sqlQuery: string,
  params: any[] = [],
  options?: Omit<UseQueryOptions<T[], Error>, 'queryKey' | 'queryFn'>,
  sessionToken?: string | null,
  generateFreshToken?: (() => string | null) | null
) => {
  return useQuery<T[], Error>({
    queryKey: [queryKey, params],
    queryFn: async () => {
      console.log('[usePublicExternalDbQuery] Executing query:', sqlQuery.substring(0, 100));
      
      const headers: Record<string, string> = {};
      // Gerar token fresco para cada requisição
      const freshToken = generateFreshToken ? generateFreshToken() : sessionToken;
      if (freshToken) {
        headers['x-session-token'] = freshToken;
      }
      
      const { data, error } = await supabase.functions.invoke<ExternalDbQueryResponse>(
        'public-external-db-query',
        {
          body: { query: sqlQuery, params },
          headers
        }
      );

      if (error) {
        console.error('[usePublicExternalDbQuery] Error:', error);
        throw new Error(error.message || 'Failed to execute query');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Query failed');
      }

      console.log(`[usePublicExternalDbQuery] Success. Rows: ${data.rowCount}`);
      return data.data as T[];
    },
    ...options
  });
};
