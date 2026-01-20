import { usePublicExternalDbQuery } from "./usePublicExternalDbQuery";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CRMCard {
  id: number;
  helena_count_id: string;
  cod_agent: string;
  whatsapp_number: string;
  contact_name: string;
  business_name: string;
  stage_id: number;
  stage_name: string;
  stage_slug: string;
  stage_color: string;
  stage_position: number;
  is_final: boolean;
  notes: string;
  created_at: string;
  stage_entered_at: string;
  updated_at: string;
}

interface UsePublicCRMCardsParams {
  countId: string | null;
  codAgents: string[] | null;
  startDate: string | null;
  endDate: string | null;
  searchTerm: string | null;
  sessionToken: string | null;
  generateFreshToken?: (() => string | null) | null;
  limit?: number;
  offset?: number;
}

// Build query parameters and conditions
const buildQueryParams = (
  countId: string | null,
  codAgents: string[] | null,
  startDate: string | null,
  endDate: string | null,
  searchTerm: string | null
) => {
  const params: any[] = [];
  let paramIndex = 1;
  
  let whereConditions = [`helena_count_id = $${paramIndex}`];
  params.push(countId);
  paramIndex++;

  if (codAgents && codAgents.length > 0) {
    whereConditions.push(`cod_agent = ANY($${paramIndex}::text[])`);
    params.push(codAgents);
    paramIndex++;
  }

  if (startDate) {
    whereConditions.push(`updated_at >= $${paramIndex}::timestamp`);
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    whereConditions.push(`updated_at <= $${paramIndex}::timestamp`);
    params.push(endDate + ' 23:59:59');
    paramIndex++;
  }

  if (searchTerm && searchTerm.trim()) {
    const searchPattern = `%${searchTerm.trim()}%`;
    whereConditions.push(`(
      contact_name ILIKE $${paramIndex} OR 
      whatsapp_number ILIKE $${paramIndex} OR 
      cod_agent ILIKE $${paramIndex} OR
      business_name ILIKE $${paramIndex}
    )`);
    params.push(searchPattern);
    paramIndex++;
  }

  return { whereConditions, params, paramIndex };
};

export const usePublicCRMCardsOptimized = ({
  countId,
  codAgents,
  startDate,
  endDate,
  searchTerm,
  sessionToken,
  generateFreshToken,
  limit = 50,
  offset = 0,
}: UsePublicCRMCardsParams) => {
  // Check if we have required params before building query
  const isEnabled = !!sessionToken && !!countId && !!codAgents && codAgents.length > 0;
  
  // Only build query params if enabled
  const { whereConditions, params, paramIndex } = isEnabled 
    ? buildQueryParams(countId, codAgents, startDate, endDate, searchTerm)
    : { whereConditions: ['1=1'], params: [], paramIndex: 1 };

  // Build unique query key string - use stable key when disabled
  const queryKeyString = isEnabled
    ? `crm-cards-optimized-${countId}-${codAgents?.join(',')}-${startDate}-${endDate}-${searchTerm}-${limit}-${offset}`
    : 'crm-cards-optimized-disabled';

  // Optimized query with per-stage pagination using ROW_NUMBER
  const query = isEnabled
    ? `
      SELECT * FROM (
        SELECT 
          id, helena_count_id, cod_agent, whatsapp_number, contact_name,
          business_name, stage_id, stage_name, stage_slug, stage_color,
          stage_position, is_final, notes, created_at, stage_entered_at, updated_at,
          ROW_NUMBER() OVER (PARTITION BY stage_id ORDER BY stage_entered_at DESC) as rn
        FROM public.vw_crm_atendimento
        WHERE ${whereConditions.join(' AND ')}
      ) sub
      WHERE rn <= $${paramIndex}
      ORDER BY stage_position ASC, stage_entered_at DESC
    `
    : 'SELECT 1 WHERE false';

  const queryParams = isEnabled ? [...params, limit] : [];

  return usePublicExternalDbQuery<CRMCard>(
    queryKeyString,
    query,
    queryParams,
    {
      enabled: isEnabled,
      staleTime: 1000 * 60 * 2, // 2 minutes - reduced revalidation frequency
      refetchOnWindowFocus: false, // Avoid unnecessary refetches on tab focus
      gcTime: 1000 * 60 * 5, // 5 minutes - keep data in cache longer
    },
    sessionToken,
    generateFreshToken
  );
};

// Hook for counting total cards per stage (optimized - minimal data)
export const usePublicCRMCardsCounts = ({
  countId,
  codAgents,
  startDate,
  endDate,
  searchTerm,
  sessionToken,
  generateFreshToken,
}: Omit<UsePublicCRMCardsParams, 'limit' | 'offset'>) => {
  // Check if we have required params before building query
  const isEnabled = !!sessionToken && !!countId && !!codAgents && codAgents.length > 0;
  
  const { whereConditions, params } = isEnabled
    ? buildQueryParams(countId, codAgents, startDate, endDate, searchTerm)
    : { whereConditions: ['1=1'], params: [] };

  // Build unique query key string - use stable key when disabled
  const queryKeyString = isEnabled
    ? `crm-cards-counts-${countId}-${codAgents?.join(',')}-${startDate}-${endDate}-${searchTerm}`
    : 'crm-cards-counts-disabled';

  // Optimized count query - only fetch what's needed
  const query = isEnabled
    ? `
      SELECT 
        stage_id,
        COUNT(*)::integer as count
      FROM public.vw_crm_atendimento
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY stage_id
    `
    : 'SELECT 1 WHERE false';

  return usePublicExternalDbQuery<{
    stage_id: number;
    count: number;
  }>(
    queryKeyString,
    query,
    params,
    {
      enabled: isEnabled,
      staleTime: 1000 * 60 * 2, // 2 minutes - same as cards
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 5, // 5 minutes
    },
    sessionToken,
    generateFreshToken
  );
};
