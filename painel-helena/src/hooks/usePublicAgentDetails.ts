import { usePublicExternalDbQuery } from "./usePublicExternalDbQuery";

interface AgentDetails {
  cod_agent: number;
  status: boolean;
  bio: string | null;
  agent_welcome: string | null;
  agent_fees: string | null;
  name: string;
  business_name: string | null;
  perfil_agent: string | null;
  plan: string | null;
  due_date: string | null;
  used: number;
  limit: number;
}

export const usePublicAgentDetails = (
  codAgent: string | null,
  sessionToken: string | null,
  generateFreshToken?: (() => string | null) | null
) => {
  const query = `
    SELECT 
      a.cod_agent,
      a.status,
      a.agent_bio as bio,
      a.agent_welcome,
      a.agent_fees,
      vc.name,
      vc.business_name,
      NULL as perfil_agent,
      vc.plan,
      vc.due_date,
      vc.used,
      vc."limit"
    FROM public.agents a
    LEFT JOIN public.view_clients vc ON vc.cod_agent = a.cod_agent
    WHERE a.cod_agent = $1
    LIMIT 1
  `;

  return usePublicExternalDbQuery<AgentDetails>(
    "public-agent-details",
    query,
    [codAgent || ""],
    {
      enabled: !!codAgent && codAgent.trim() !== "",
      staleTime: 1000 * 60 * 5,
    },
    sessionToken,
    generateFreshToken
  );
};
