import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ExternalDbQueryResponse {
  success: boolean;
  data?: any[];
  rowCount?: number;
  error?: string;
}

export const useExternalDbQuery = <T = any>(
  queryKey: string,
  sqlQuery: string,
  params: any[] = [],
  options?: Omit<UseQueryOptions<T[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<T[], Error>({
    queryKey: [queryKey, params],
    queryFn: async () => {
      console.log('[useExternalDbQuery] Executing query:', sqlQuery.substring(0, 100));
      
      const { data, error } = await supabase.functions.invoke<ExternalDbQueryResponse>(
        'external-db-query',
        {
          body: { query: sqlQuery, params }
        }
      );

      if (error) {
        console.error('[useExternalDbQuery] Error:', error);
        throw new Error(error.message || 'Failed to execute query');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Query failed');
      }

      console.log(`[useExternalDbQuery] Success. Rows: ${data.rowCount}`);
      return data.data as T[];
    },
    ...options
  });
};
