import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useExternalDbQuery } from "./useExternalDbQuery";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface JuliaContractRecord {
  cod_agent: string;
  agent_id: string;
  name: string;
  business_name: string;
  client_id: string;
  perfil_agent: string;
  session_id: string;
  total_msg: number;
  whatsapp: string;
  max_created_at: string;
  created_at: string;
  cod_document: string;
  status_document: string;
  situacao: string;
  data_assinatura: string | null;
  resumo_do_caso: string;
  signer_name: string;
  signer_cpf: string;
  signer_uf: string;
  signer_cidade: string;
  signer_bairro: string;
  signer_endereco: string;
  signer_cep: string;
  zapsing_doctoken: string;
  is_confirm: string;
  document_case_id: number | null;
  case_title: string | null;
  case_number: string | null;
  case_category_name: string | null;
  case_category_color: string | null;
  linked_at: string | null;
  case_notes: string | null;
}

export interface CaseCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  display_order: number;
}

export interface CaseLegal {
  id: number;
  case_category_id: number;
  case_number: string;
  title: string;
  description: string;
  client_name: string;
  client_cpf: string;
  status: string;
  responsible_lawyer: string;
  court: string;
  case_value: number;
  start_date: string;
  expected_end_date: string;
  created_at: string;
  metadata: any;
}

export interface ContractSummary {
  total_contratos: number;
  total_assinados: number;
  total_em_curso: number;
  taxa_assinatura: number;
}

export const useJuliaContractsData = (
  tipoAgente: string = "TODOS",
  agentId: string | null = null,
  dataInicio: Date | null = null,
  dataFim: Date | null = null,
  statusContrato: string = "TODOS",
  userCodAgents: string[] | null = null,
) => {
  const hoje = new Date();
  const inicioFormatado = dataInicio ? format(dataInicio, "yyyy-MM-dd") : format(hoje, "yyyy-MM-dd");
  const fimFormatado = dataFim ? format(dataFim, "yyyy-MM-dd 23:59:59") : format(hoje, "yyyy-MM-dd 23:59:59");

  const query = `
    SELECT 
      cod_agent, agent_id, name, business_name, client_id, perfil_agent,
      session_id, total_msg, whatsapp, max_created_at, created_at,
      cod_document, status_document, situacao, data_assinatura, resumo_do_caso,
      signer_name, signer_cpf, signer_uf, signer_cidade, signer_bairro,
      signer_endereco, signer_cep, zapsing_doctoken, is_confirm,
      document_case_id, case_title, case_number, case_category_name,
      case_category_color, linked_at, case_notes
    FROM public.vw_desempenho_julia_contratos
    WHERE 1=1
      AND ($1 = 'TODOS' OR perfil_agent = $1)
      AND (COALESCE($2, '') = '' OR agent_id::text = $2)
      AND ($3 = 'TODOS' OR status_document = $3)
      AND created_at >= $4::timestamp
      AND created_at <= $5::timestamp
      AND ($6::text[] IS NULL OR cod_agent::text = ANY($6::text[]))
    ORDER BY created_at DESC
    LIMIT 500
  `;

  const params = [
    tipoAgente, 
    agentId || "", 
    statusContrato,
    inicioFormatado, 
    fimFormatado, 
    userCodAgents
  ];

  return useExternalDbQuery<JuliaContractRecord>(
    "julia-contracts-data", 
    query, 
    params, 
    {
      enabled: true,
      staleTime: 1000 * 60 * 5,
    }
  );
};

export const useJuliaContractsSummary = (
  tipoAgente: string = "TODOS",
  agentId: string | null = null,
  dataInicio: Date | null = null,
  dataFim: Date | null = null,
  statusContrato: string = "TODOS",
  userCodAgents: string[] | null = null,
) => {
  const hoje = new Date();
  const inicioFormatado = dataInicio ? format(dataInicio, "yyyy-MM-dd") : format(hoje, "yyyy-MM-dd");
  const fimFormatado = dataFim ? format(dataFim, "yyyy-MM-dd 23:59:59") : format(hoje, "yyyy-MM-dd 23:59:59");

  const query = `
    SELECT 
      COUNT(*) as total_contratos,
      COUNT(CASE WHEN status_document = 'SIGNED' THEN 1 END) as total_assinados,
      COUNT(CASE WHEN status_document = 'CREATED' THEN 1 END) as total_em_curso,
      CASE 
        WHEN COUNT(*) > 0 THEN 
          ROUND((COUNT(CASE WHEN status_document = 'SIGNED' THEN 1 END)::decimal / COUNT(*)::decimal) * 100, 2)
        ELSE 0 
      END as taxa_assinatura
    FROM public.vw_desempenho_julia_contratos
    WHERE 1=1
      AND ($1 = 'TODOS' OR perfil_agent = $1)
      AND (COALESCE($2, '') = '' OR agent_id::text = $2)
      AND ($3 = 'TODOS' OR status_document = $3)
      AND created_at >= $4::timestamp
      AND created_at <= $5::timestamp
      AND ($6::text[] IS NULL OR cod_agent::text = ANY($6::text[]))
  `;

  const params = [
    tipoAgente, 
    agentId || "", 
    statusContrato,
    inicioFormatado, 
    fimFormatado, 
    userCodAgents
  ];

  return useExternalDbQuery<ContractSummary>(
    "julia-contracts-summary", 
    query, 
    params, 
    {
      enabled: true,
      staleTime: 1000 * 60 * 5,
    }
  );
};

export const useJuliaContractsComparison = (
  tipoAgente: string = "TODOS",
  agentId: string | null = null,
  dataInicio: Date | null = null,
  dataFim: Date | null = null,
  statusContrato: string = "TODOS",
  userCodAgents: string[] | null = null,
) => {
  const hoje = new Date();
  
  // Calcular período anterior
  let inicioAnterior: Date;
  let fimAnterior: Date;
  
  if (dataInicio && dataFim) {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diffInMs = fim.getTime() - inicio.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24)) + 1;
    
    fimAnterior = new Date(inicio);
    fimAnterior.setDate(fimAnterior.getDate() - 1);
    inicioAnterior = new Date(fimAnterior);
    inicioAnterior.setDate(inicioAnterior.getDate() - diffInDays + 1);
  } else {
    // Default: dia anterior
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    inicioAnterior = ontem;
    fimAnterior = ontem;
  }

  const inicioFormatado = format(inicioAnterior, "yyyy-MM-dd");
  const fimFormatado = format(fimAnterior, "yyyy-MM-dd 23:59:59");

  const query = `
    SELECT 
      COUNT(*) as total_contratos,
      COUNT(CASE WHEN status_document = 'SIGNED' THEN 1 END) as total_assinados,
      COUNT(CASE WHEN status_document = 'CREATED' THEN 1 END) as total_em_curso,
      CASE 
        WHEN COUNT(*) > 0 THEN 
          ROUND((COUNT(CASE WHEN status_document = 'SIGNED' THEN 1 END)::decimal / COUNT(*)::decimal) * 100, 2)
        ELSE 0 
      END as taxa_assinatura
    FROM public.vw_desempenho_julia_contratos
    WHERE 1=1
      AND ($1 = 'TODOS' OR perfil_agent = $1)
      AND (COALESCE($2, '') = '' OR agent_id::text = $2)
      AND ($3 = 'TODOS' OR status_document = $3)
      AND created_at >= $4::timestamp
      AND created_at <= $5::timestamp
      AND ($6::text[] IS NULL OR cod_agent::text = ANY($6::text[]))
  `;

  const params = [
    tipoAgente, 
    agentId || "", 
    statusContrato,
    inicioFormatado, 
    fimFormatado, 
    userCodAgents
  ];

  return useExternalDbQuery<ContractSummary>(
    "julia-contracts-comparison", 
    query, 
    params, 
    {
      enabled: true,
      staleTime: 1000 * 60 * 5,
    }
  );
};

export const useCaseCategories = () => {
  const query = `
    SELECT id, name, description, icon, color, is_active, display_order
    FROM public.case_category
    WHERE is_active = true
    ORDER BY display_order ASC
  `;

  return useExternalDbQuery<CaseCategory>(
    "case-categories", 
    query, 
    [],
    {
      enabled: true,
      staleTime: 1000 * 60 * 30,
    }
  );
};

export const useCaseLegalByCategory = (categoryId: number | null) => {
  const query = `
    SELECT 
      id, case_category_id, case_number, title, description,
      client_name, client_cpf, status, responsible_lawyer, court,
      case_value, start_date, expected_end_date, created_at, metadata
    FROM public.case_legal
    WHERE status = 'active'
      AND ($1::int IS NULL OR case_category_id = $1)
    ORDER BY title ASC
  `;

  return useExternalDbQuery<CaseLegal>(
    `case-legal-by-category-${categoryId}`, 
    query, 
    [categoryId],
    {
      enabled: categoryId !== null,
      staleTime: 1000 * 60 * 10,
    }
  );
};

export const useLinkContractToCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      codDocument,
      caseLegalId,
      linkedBy,
      notes,
    }: {
      codDocument: string;
      caseLegalId: number;
      linkedBy: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("external-db-query", {
        body: {
          query: `
            INSERT INTO public.contract_case_link (cod_document, case_legal_id, linked_by, notes)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (cod_document) 
            DO UPDATE SET case_legal_id = $2, linked_by = $3, notes = $4, linked_at = NOW()
            RETURNING *
          `,
          params: [codDocument, caseLegalId, linkedBy, notes || null],
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["julia-contracts-data"] });
      queryClient.invalidateQueries({ queryKey: ["julia-contracts-summary"] });
      toast.success("Caso vinculado ao contrato com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao vincular caso: ${error.message}`);
    },
  });
};

export const useUnlinkContractFromCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (codDocument: string) => {
      const { data, error } = await supabase.functions.invoke("external-db-query", {
        body: {
          query: `DELETE FROM public.contract_case_link WHERE cod_document = $1`,
          params: [codDocument],
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["julia-contracts-data"] });
      queryClient.invalidateQueries({ queryKey: ["julia-contracts-summary"] });
      toast.success("Caso desvinculado do contrato!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao desvincular caso: ${error.message}`);
    },
  });
};

export const useCreateCaseLegal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (caseData: Partial<CaseLegal>) => {
      const { data, error } = await supabase.functions.invoke("external-db-query", {
        body: {
          query: `
            INSERT INTO public.case_legal (
              case_category_id, title, description, case_number,
              client_name, client_cpf, responsible_lawyer
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
          `,
          params: [
            caseData.case_category_id,
            caseData.title,
            caseData.description || null,
            caseData.case_number || null,
            caseData.client_name || null,
            caseData.client_cpf || null,
            caseData.responsible_lawyer || null,
          ],
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-legal-by-category"] });
      toast.success("Caso jurídico criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar caso: ${error.message}`);
    },
  });
};

export const useJuliaContractsExport = (
  tipoAgente: string = "TODOS",
  agentId: string | null = null,
  dataInicio: Date | null = null,
  dataFim: Date | null = null,
  statusContrato: string = "TODOS",
  userCodAgents: string[] | null = null,
  enabled: boolean = false
) => {
  const hoje = new Date();
  const inicioFormatado = dataInicio ? format(dataInicio, "yyyy-MM-dd") : format(hoje, "yyyy-MM-dd");
  const fimFormatado = dataFim ? format(dataFim, "yyyy-MM-dd 23:59:59") : format(hoje, "yyyy-MM-dd 23:59:59");

  const query = `
    SELECT *
    FROM public.vw_desempenho_julia_contratos
    WHERE 1=1
      AND ($1 = 'TODOS' OR perfil_agent = $1)
      AND (COALESCE($2, '') = '' OR agent_id::text = $2)
      AND ($3 = 'TODOS' OR status_document = $3)
      AND created_at >= $4::timestamp
      AND created_at <= $5::timestamp
      AND ($6::text[] IS NULL OR cod_agent::text = ANY($6::text[]))
    ORDER BY created_at DESC
  `;

  const params = [
    tipoAgente, 
    agentId || "", 
    statusContrato,
    inicioFormatado, 
    fimFormatado, 
    userCodAgents
  ];

  return useExternalDbQuery<JuliaContractRecord>(
    "julia-contracts-export", 
    query, 
    params, 
    {
      enabled,
      staleTime: 0,
    }
  );
};
