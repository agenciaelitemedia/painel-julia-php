import { usePublicExternalDbQuery } from "./usePublicExternalDbQuery";

interface AgentCase {
  id: number;
  cod_agent: number;
  case_category_id: number;
  case_legal_id: number;
  activation_phrase: string | null;
  status: boolean;
  campaing_link: string | null;
  case_fees: string | null;
  used_total: number;
  category_name: string;
  category_color: string | null;
  case_title: string;
  case_number: string | null;
}

export const usePublicAgentCases = (
  codAgent: string | null,
  sessionToken: string | null,
  generateFreshToken?: (() => string | null) | null
) => {
  const query = `
    SELECT 
      acl.id,
      acl.cod_agent,
      acl.case_category_id,
      acl.case_legal_id,
      acl.activation_phrase,
      acl.status,
      acl.campaing_link,
      acl.case_fees,
      acl.used_total,
      cc.name as category_name,
      cc.color as category_color,
      cl.title as case_title,
      cl.case_number
    FROM public.agent_case_legal acl
    LEFT JOIN public.case_category cc ON cc.id = acl.case_category_id
    LEFT JOIN public.case_legal cl ON cl.id = acl.case_legal_id
    WHERE acl.cod_agent = $1
    ORDER BY acl.created_at DESC
  `;

  return usePublicExternalDbQuery<AgentCase>(
    "public-agent-cases",
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
