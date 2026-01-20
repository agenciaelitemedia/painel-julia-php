import { usePublicExternalDbQuery } from "./usePublicExternalDbQuery";

interface CaseCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  display_order: number;
  case_count: number;
}

export const usePublicCaseCategories = (
  sessionToken: string | null,
  generateFreshToken?: (() => string | null) | null
) => {
  const query = `
    SELECT 
      cc.id,
      cc.name,
      cc.description,
      cc.icon,
      cc.color,
      cc.display_order,
      COALESCE(COUNT(cl.id)::int, 0) as case_count
    FROM public.case_category cc
    LEFT JOIN public.case_legal cl ON cl.case_category_id = cc.id AND cl.status = 'active'
    WHERE cc.is_active = true
    GROUP BY cc.id, cc.name, cc.description, cc.icon, cc.color, cc.display_order
    ORDER BY cc.name ASC
  `;

  return usePublicExternalDbQuery<CaseCategory>(
    "public-case-categories",
    query,
    [],
    {
      staleTime: 1000 * 60 * 15,
    },
    sessionToken,
    generateFreshToken
  );
};
