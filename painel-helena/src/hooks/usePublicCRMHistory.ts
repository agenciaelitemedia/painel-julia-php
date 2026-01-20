import { usePublicExternalDbQuery } from "./usePublicExternalDbQuery";

export interface CRMHistoryEntry {
  id: number;
  card_id: number;
  from_stage_id: number | null;
  from_stage_name: string | null;
  from_stage_color: string | null;
  to_stage_id: number;
  to_stage_name: string;
  to_stage_color: string;
  changed_by: string;
  changed_at: string;
  notes: string | null;
}

export const usePublicCRMHistory = (
  cardId: number | null,
  sessionToken: string | null,
  generateFreshToken?: (() => string | null) | null
) => {
  const query = `
    SELECT 
      h.id,
      h.card_id,
      h.from_stage_id,
      fs.name as from_stage_name,
      fs.color as from_stage_color,
      h.to_stage_id,
      ts.name as to_stage_name,
      ts.color as to_stage_color,
      h.changed_by,
      h.changed_at,
      h.notes
    FROM public.crm_atendimento_history h
    LEFT JOIN public.crm_atendimento_stages fs ON fs.id = h.from_stage_id
    JOIN public.crm_atendimento_stages ts ON ts.id = h.to_stage_id
    WHERE h.card_id = $1
    ORDER BY h.changed_at DESC
  `;

  return usePublicExternalDbQuery<CRMHistoryEntry>(
    `crm-history-${cardId}`,
    query,
    [cardId],
    {
      enabled: !!sessionToken && !!cardId,
      staleTime: 1000 * 60, // 1 minute
    },
    sessionToken,
    generateFreshToken
  );
};
