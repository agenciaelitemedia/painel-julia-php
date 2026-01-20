import { usePublicExternalDbQuery } from "./usePublicExternalDbQuery";
import { format } from "date-fns";

export interface DocumentRecord {
  id: number;
  name: string;
  business_name: string;
  agent_id: string;
  helena_count_id: string;
  helena_user_id: string;
  whatsapp_number: string | number;
  cod_agent: string | number;
  active: boolean;
  note_case: string | null;
  resume: string | null;
  legal_report: string | null;
  initial_petition: string | null;
  created_at: string;
  total_msg: number;
  max_created_at: string;
}

export interface DocumentsSummary {
  total: number;
  withResume: number;
  withLegalReport: number;
  withInitialPetition: number;
}

export const usePublicDocumentsData = (
  countId: string | null,
  dataInicio: Date | null,
  dataFim: Date | null,
  codAgents: string[] | null,
  selectedCodAgent: string | null,
  sessionToken: string | null,
  generateFreshToken: (() => string | null) | null
) => {
  const whereConditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  // Filtro obrigatório por helena_count_id (igual à aba Meus Agents)
  whereConditions.push(`helena_count_id = $${paramIndex++}`);
  params.push(countId);

  // Filtro por cod_agent específico (quando selecionado)
  if (selectedCodAgent && selectedCodAgent !== "TODOS") {
    whereConditions.push(`cod_agent = $${paramIndex++}`);
    params.push(selectedCodAgent);
  } else if (codAgents && codAgents.length > 0) {
    // Filtro por todos os cod_agents do usuário (quando nenhum específico selecionado)
    const placeholders = codAgents.map((_, i) => `$${paramIndex + i}`).join(", ");
    whereConditions.push(`cod_agent IN (${placeholders})`);
    params.push(...codAgents);
    paramIndex += codAgents.length;
  }

  // Filtro por data
  if (dataInicio) {
    whereConditions.push(`created_at >= $${paramIndex++}`);
    params.push(format(dataInicio, "yyyy-MM-dd 00:00:00"));
  }
  if (dataFim) {
    whereConditions.push(`created_at <= $${paramIndex++}`);
    params.push(format(dataFim, "yyyy-MM-dd 23:59:59"));
  }

  const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

  const query = `
    SELECT 
      id, name, business_name, agent_id, helena_count_id, helena_user_id,
      whatsapp_number, cod_agent, active, note_case, resume, legal_report,
      initial_petition, created_at, total_msg, max_created_at
    FROM public.vw_agents_helena
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT 500
  `;

  return usePublicExternalDbQuery<DocumentRecord>(
    "public-documents-data",
    query,
    params,
    {
      enabled: !!sessionToken && !!countId && !!codAgents && codAgents.length > 0,
      staleTime: 30000,
    },
    sessionToken,
    generateFreshToken
  );
};

export const calculateDocumentsSummary = (data: DocumentRecord[]): DocumentsSummary => {
  return {
    total: data.length,
    withResume: data.filter(d => d.resume && d.resume.trim().length > 0).length,
    withLegalReport: data.filter(d => d.legal_report && d.legal_report.trim().length > 0).length,
    withInitialPetition: data.filter(d => d.initial_petition && d.initial_petition.trim().length > 0).length,
  };
};
