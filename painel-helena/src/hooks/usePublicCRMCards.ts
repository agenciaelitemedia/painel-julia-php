import { usePublicExternalDbQuery } from "./usePublicExternalDbQuery";

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
}

export const usePublicCRMCards = ({
  countId,
  codAgents,
  startDate,
  endDate,
  searchTerm,
  sessionToken,
  generateFreshToken,
}: UsePublicCRMCardsParams) => {
  const params: any[] = [];
  let paramIndex = 1;
  
  // Build query with mandatory helena_count_id filter
  let whereConditions = [`helena_count_id = $${paramIndex}`];
  params.push(countId);
  paramIndex++;

  // Cod agents filter
  if (codAgents && codAgents.length > 0) {
    whereConditions.push(`cod_agent = ANY($${paramIndex}::text[])`);
    params.push(codAgents);
    paramIndex++;
  }

  // Date filters
  if (startDate) {
    whereConditions.push(`created_at >= $${paramIndex}::timestamp`);
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    whereConditions.push(`created_at <= $${paramIndex}::timestamp`);
    params.push(endDate + ' 23:59:59');
    paramIndex++;
  }

  // Search filter
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

  const query = `
    SELECT 
      id, helena_count_id, cod_agent, whatsapp_number, contact_name,
      business_name, stage_id, stage_name, stage_slug, stage_color,
      stage_position, is_final, notes, created_at, stage_entered_at, updated_at
    FROM public.vw_crm_atendimento
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY stage_position ASC, stage_entered_at DESC
  `;

  return usePublicExternalDbQuery<CRMCard>(
    'crm-cards',
    query,
    params,
    {
      enabled: !!sessionToken && !!countId && !!codAgents && codAgents.length > 0,
      staleTime: 1000 * 30, // 30 seconds
    },
    sessionToken,
    generateFreshToken
  );
};
