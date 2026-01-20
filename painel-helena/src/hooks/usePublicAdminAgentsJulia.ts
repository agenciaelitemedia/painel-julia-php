import { usePublicExternalDbQuery } from "@/hooks/usePublicExternalDbQuery";

export interface AdminAgentJulia {
  cod_agent: number;
  name: string;
  business_name: string;
  federal_id: string;
  email: string;
  phone: string;
  plan: string;
  limit: number;
  used: number;
  due_date: string;
  total_last_used: number;
  state: string;
  city: string;
  country: string;
  zip_code: string;
  status: string | boolean;
  wp_number: string;
  helena_count_id: string;
  helena_user_id: string;
  helena_token: string;
  agent_id: number | null;
  is_closer: boolean;
  settings: string | null;
  prompt: string | null;
  hasSessions?: boolean;
}

export const usePublicAdminAgentsJulia = (
  sessionToken: string | null,
  generateFreshToken: (() => string | null) | null,
  enabled: boolean = true
) => {
  const sqlQuery = `
    SELECT 
      vc.cod_agent, vc.name, vc.business_name, vc.federal_id, 
      vc.email, vc.phone, vc.plan, vc."limit", vc.used, 
      vc.due_date, vc.total_last_used, vc.state, vc.city,
      COALESCE(vc.country, 'BR') as country, vc.zip_code,
      a.id as agent_id, a.status, COALESCE(a.is_closer, false) as is_closer, 
      a.settings::text as settings,
      ah.wp_number, ah.helena_count_id, ah.helena_user_id, ah.helena_token,
      os.prompt
    FROM public.view_clients vc
    INNER JOIN public.agents_helena ah ON vc.cod_agent = ah.cod_agent
    LEFT JOIN public.agents a ON vc.cod_agent = a.cod_agent
    LEFT JOIN public.override_settings os ON a.id = os.agent_id
    ORDER BY vc.cod_agent DESC
  `;

  const isEnabled = Boolean(enabled && sessionToken);

  return usePublicExternalDbQuery<AdminAgentJulia>(
    'admin-agents-julia',
    sqlQuery,
    [],
    {
      enabled: isEnabled,
      staleTime: 1000 * 60 * 2, // 2 minutos
      refetchOnWindowFocus: false,
    },
    sessionToken,
    generateFreshToken
  );
};
