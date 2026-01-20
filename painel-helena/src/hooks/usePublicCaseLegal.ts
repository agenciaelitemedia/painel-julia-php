import { usePublicExternalDbQuery } from "./usePublicExternalDbQuery";

interface CaseLegal {
  id: number;
  title: string;
  case_number: string | null;
  description: string | null;
  client_name: string | null;
}

export const usePublicCaseLegal = (
  categoryId: string | null,
  sessionToken: string | null,
  generateFreshToken?: (() => string | null) | null
) => {
  const query = `
    SELECT 
      id,
      title,
      case_number,
      description,
      client_name
    FROM public.case_legal
    WHERE status = 'active' 
      AND case_category_id = $1
    ORDER BY title ASC
  `;

  return usePublicExternalDbQuery<CaseLegal>(
    "public-case-legal",
    query,
    [categoryId || ""],
    {
      enabled: !!categoryId && categoryId.trim() !== "",
      staleTime: 1000 * 60 * 10,
    },
    sessionToken,
    generateFreshToken
  );
};
