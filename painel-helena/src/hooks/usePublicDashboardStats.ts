import { usePublicJuliaPerformanceSummary } from "./usePublicJuliaPerformance";
import { usePublicExternalDbQuery } from "./usePublicExternalDbQuery";
import { getNowInBrazil } from "@/lib/utils/timezone";

interface DashboardStats {
  leads: number;
  contratos: number;
  followups: number;
  isLoading: boolean;
}

export const usePublicDashboardStats = (
  codAgents: string[] | null,
  sessionToken: string | null,
  generateFreshToken?: (() => string | null) | null
): DashboardStats => {
  const hoje = getNowInBrazil();
  
  // 1. Buscar leads e contratos via hook existente
  const { data: summary, isLoading: summaryLoading } = usePublicJuliaPerformanceSummary(
    "TODOS",
    null,
    hoje,
    hoje,
    codAgents,
    sessionToken,
    generateFreshToken
  );
  
  // 2. Buscar follow-ups da tabela followup_queue
  const followupQuery = `
    SELECT COUNT(*) as total
    FROM public.followup_queue
    WHERE state = 'SEND'
      AND created_at::date = CURRENT_DATE
      AND ($1::text[] IS NULL OR cod_agent::text = ANY($1::text[]))
  `;
  
  const { data: followups, isLoading: followupsLoading } = usePublicExternalDbQuery<{ total: number }>(
    "public-dashboard-followups",
    followupQuery,
    [codAgents],
    { 
      enabled: !!codAgents && codAgents.length > 0,
      staleTime: 1000 * 60 * 5,
    },
    sessionToken,
    generateFreshToken
  );
  
  return {
    leads: summary?.leads ?? 0,
    contratos: summary?.contratos ?? 0,
    followups: followups?.[0]?.total ?? 0,
    isLoading: summaryLoading || followupsLoading
  };
};
