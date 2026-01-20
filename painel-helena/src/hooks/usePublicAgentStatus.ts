import { usePublicExternalDbQuery } from "./usePublicExternalDbQuery";

export interface AgentStatus {
  name: string;
  business_name: string;
  agent_id: string;
  whatsapp_number: string | number;
  session_id: string;
  cod_agent: string;
  active: boolean;
}

export const usePublicAgentStatus = (
  countId: string | null,
  whatsappNumber: string | null,
  sessionToken: string | null,
  generateFreshToken?: (() => string | null) | null
) => {
  const query = `
    SELECT 
      c.name,
      c.business_name,
      a.id as agent_id,
      s.whatsapp_number,
      s.id as session_id,
      a.cod_agent,
      s.active
    FROM public.agents_helena ah
      INNER JOIN public.agents a ON a.cod_agent = ah.cod_agent
      INNER JOIN public.sessions s ON s.agent_id = a.id
      INNER JOIN public.clients c ON c.id = a.client_id
    WHERE ah.helena_count_id = $1
      AND s.whatsapp_number = $2
  `;

  return usePublicExternalDbQuery<AgentStatus>(
    'public-agent-status',
    query,
    [countId, whatsappNumber],
    {
      enabled: !!countId && !!whatsappNumber,
      staleTime: 30000,
    },
    sessionToken,
    generateFreshToken
  );
};
