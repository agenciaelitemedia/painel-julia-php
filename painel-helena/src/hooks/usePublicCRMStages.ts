import { usePublicExternalDbQuery } from "./usePublicExternalDbQuery";

export interface CRMStage {
  id: number;
  name: string;
  slug: string;
  color: string;
  position: number;
  is_active: boolean;
  is_final: boolean;
}

export const usePublicCRMStages = (
  sessionToken: string | null,
  generateFreshToken?: (() => string | null) | null
) => {
  const query = `
    SELECT id, name, slug, color, position, is_active, is_final
    FROM public.crm_atendimento_stages
    WHERE is_active = true
    ORDER BY position ASC
  `;

  return usePublicExternalDbQuery<CRMStage>(
    'crm-stages',
    query,
    [],
    {
      enabled: !!sessionToken,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
    },
    sessionToken,
    generateFreshToken
  );
};
