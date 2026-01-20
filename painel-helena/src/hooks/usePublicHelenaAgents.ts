import { usePublicExternalDbQuery } from "./usePublicExternalDbQuery";

interface HelenaAgent {
  cod_agent: number;
  name: string | null;
  used: number;
  previous_used: number;
  usage_percentage: number;
}

export const usePublicHelenaAgents = (
  countId: string | null,
  sessionToken: string | null,
  generateFreshToken?: (() => string | null) | null
) => {
  // Query using total_last_used from view_clients
  const query = `
    SELECT DISTINCT 
      ah.cod_agent,
      vc.name,
      COALESCE(vc.used, 0) as used,
      COALESCE(vc.last_used, 0) as previous_used,
      CASE 
        WHEN COALESCE(vc.last_used, 0) = 0 THEN 
          CASE 
            WHEN COALESCE(vc.used, 0) > 0 THEN 100.0
            ELSE 0.0
          END
        ELSE 
          ROUND(((COALESCE(vc.used, 0) - COALESCE(vc.last_used, 0))::numeric / vc.last_used::numeric * 100)::numeric, 1)
      END as usage_percentage
    FROM public.agents_helena ah
    LEFT JOIN public.view_clients vc ON vc.cod_agent::text = ah.cod_agent::text
    WHERE ah.helena_count_id = $1
      AND ah.status = true
      AND ah.cod_agent IS NOT NULL
    ORDER BY ah.cod_agent
  `;

  return usePublicExternalDbQuery<HelenaAgent>(
    "public-helena-agents",
    query,
    [countId || ""],
    {
      enabled: !!countId && countId.trim() !== "",
      staleTime: 1000 * 60 * 10,
    },
    sessionToken,
    generateFreshToken
  );
};
