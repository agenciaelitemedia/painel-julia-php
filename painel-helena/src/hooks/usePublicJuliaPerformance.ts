import { usePublicExternalDbQuery } from "./usePublicExternalDbQuery";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getNowInBrazil, formatInBrazil } from "@/lib/utils/timezone";

export interface JuliaPerformanceRecord {
  cod_agent: string;
  agent_id: string;
  name: string;
  business_name: string;
  client_id: string;
  perfil_agent: string;
  session_id: string;
  total_msg: number;
  whatsapp: string;
  status_document: string;
  max_created_at: string;
  created_at: string;
}

export interface AgentOption {
  agent_id: string;
  label: string;
}

export interface PerformanceSummary {
  leads: number;
  contratos: number;
  assinados: number;
  emCurso: number;
  leadsToContratosPercent: number;
  leadsToAssinadosPercent: number;
  contratosToAssinadosPercent: number;
}

export const usePublicJuliaPerformanceData = (
  tipoAgente: string = "TODOS",
  agentId: string | null = null,
  dataInicio: Date | null = null,
  dataFim: Date | null = null,
  userCodAgents: string[] | null = null,
  sessionToken: string | null = null,
  generateFreshToken?: (() => string | null) | null
) => {
  const hoje = getNowInBrazil();
  const inicioFormatado = dataInicio ? formatInBrazil(dataInicio, "yyyy-MM-dd") : formatInBrazil(hoje, "yyyy-MM-dd");
  const fimFormatado = dataFim ? formatInBrazil(dataFim, "yyyy-MM-dd 23:59:59") : formatInBrazil(hoje, "yyyy-MM-dd 23:59:59");

  const query = `
    SELECT 
      cod_agent, 
      agent_id, 
      name, 
      business_name, 
      client_id, 
      perfil_agent, 
      session_id, 
      total_msg, 
      whatsapp, 
      status_document, 
      max_created_at, 
      created_at::timestamp
    FROM public.vw_desempenho_julia
    WHERE 1=1
      AND ($1 = 'TODOS' OR perfil_agent = $1)
      AND (COALESCE($2, '') = '' OR agent_id::text = $2)
      AND created_at >= $3::timestamp
      AND created_at <= $4::timestamp
      AND ($5::text[] IS NULL OR cod_agent::text = ANY($5::text[]))
    ORDER BY created_at DESC
  `;

  const params = [tipoAgente, agentId || "", inicioFormatado, fimFormatado, userCodAgents];

  return usePublicExternalDbQuery<JuliaPerformanceRecord>("public-julia-performance-data", query, params, {
    enabled: true,
    staleTime: 1000 * 60 * 5,
  }, sessionToken, generateFreshToken);
};

export const usePublicJuliaPerformanceSummary = (
  tipoAgente: string = "TODOS",
  agentId: string | null = null,
  dataInicio: Date | null = null,
  dataFim: Date | null = null,
  userCodAgents: string[] | null = null,
  sessionToken: string | null = null,
  generateFreshToken?: (() => string | null) | null
) => {
  const hoje = getNowInBrazil();
  const inicioFormatado = dataInicio ? formatInBrazil(dataInicio, "yyyy-MM-dd") : formatInBrazil(hoje, "yyyy-MM-dd");
  const fimFormatado = dataFim ? formatInBrazil(dataFim, "yyyy-MM-dd 23:59:59") : formatInBrazil(hoje, "yyyy-MM-dd 23:59:59");

  return useQuery({
    queryKey: ["public-julia-performance-summary", tipoAgente, agentId, inicioFormatado, fimFormatado, userCodAgents],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      // Gerar token fresco para cada requisição
      const freshToken = generateFreshToken ? generateFreshToken() : sessionToken;
      if (freshToken) {
        headers['x-session-token'] = freshToken;
      }
      
      const { data, error } = await supabase.functions.invoke("public-julia-performance-summary", {
        body: {
          tipoAgente,
          agentId,
          dataInicio: inicioFormatado,
          dataFim: fimFormatado,
          codAgents: userCodAgents,
        },
        headers
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to fetch summary");

      return {
        leads: Number(data.data.total_leads),
        contratos: Number(data.data.total_contratos),
        assinados: Number(data.data.total_assinados),
        emCurso: Number(data.data.total_em_curso),
        leadsToContratosPercent:
          data.data.total_leads > 0
            ? Math.round((Number(data.data.total_contratos) / Number(data.data.total_leads)) * 100)
            : 0,
        leadsToAssinadosPercent:
          data.data.total_leads > 0
            ? Math.round((Number(data.data.total_assinados) / Number(data.data.total_leads)) * 100)
            : 0,
        contratosToAssinadosPercent:
          data.data.total_contratos > 0
            ? Math.round((Number(data.data.total_assinados) / Number(data.data.total_contratos)) * 100)
            : 0,
      };
    },
    enabled: true,
    staleTime: 1000 * 60 * 5,
  });
};

export const usePublicAgentsList = (
  userCodAgents: string[] | null = null, 
  sessionToken: string | null = null,
  generateFreshToken?: (() => string | null) | null
) => {
  const query = `
    SELECT DISTINCT 
      agent_id, 
      CONCAT('[', cod_agent, '] - ', business_name, ' - ', name) as label
    FROM public.vw_desempenho_julia
    WHERE perfil_agent IS NOT NULL
      AND ($1::text[] IS NULL OR cod_agent::text = ANY($1::text[]))
    ORDER BY label
  `;

  return usePublicExternalDbQuery<AgentOption>("public-julia-agents-list", query, [userCodAgents], {
    staleTime: 1000 * 60 * 10,
  }, sessionToken, generateFreshToken);
};

export const usePublicJuliaPerformanceComparison = (
  tipoAgente: string = "TODOS",
  agentId: string | null = null,
  dataInicio: Date | null = null,
  dataFim: Date | null = null,
  userCodAgents: string[] | null = null,
  sessionToken: string | null = null,
  generateFreshToken?: (() => string | null) | null
) => {
  const calculatePreviousPeriod = (inicio: Date, fim: Date) => {
    const inicioNormalizado = new Date(inicio);
    inicioNormalizado.setHours(0, 0, 0, 0);

    const fimNormalizado = new Date(fim);
    fimNormalizado.setHours(23, 59, 59, 999);

    const diffInDays = Math.floor((fimNormalizado.getTime() - inicioNormalizado.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const previousEnd = new Date(inicioNormalizado);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousEnd.setHours(23, 59, 59, 999);

    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - diffInDays + 1);
    previousStart.setHours(0, 0, 0, 0);

    return { previousStart, previousEnd };
  };

  const hoje = getNowInBrazil();
  const inicioAtual = dataInicio || hoje;
  const fimAtual = dataFim || hoje;

  const { previousStart, previousEnd } = calculatePreviousPeriod(inicioAtual, fimAtual);

  const inicioFormatado = formatInBrazil(previousStart, "yyyy-MM-dd");
  const fimFormatado = formatInBrazil(previousEnd, "yyyy-MM-dd 23:59:59");

  return useQuery({
    queryKey: ["public-julia-performance-comparison", tipoAgente, agentId, inicioFormatado, fimFormatado, userCodAgents],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      // Gerar token fresco para cada requisição
      const freshToken = generateFreshToken ? generateFreshToken() : sessionToken;
      if (freshToken) {
        headers['x-session-token'] = freshToken;
      }
      
      const { data, error } = await supabase.functions.invoke("public-julia-performance-summary", {
        body: {
          tipoAgente,
          agentId,
          dataInicio: inicioFormatado,
          dataFim: fimFormatado,
          codAgents: userCodAgents,
        },
        headers
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to fetch comparison");

      return {
        leads: Number(data.data.total_leads),
        contratos: Number(data.data.total_contratos),
        assinados: Number(data.data.total_assinados),
        emCurso: Number(data.data.total_em_curso),
        leadsToContratosPercent:
          data.data.total_leads > 0
            ? Math.round((Number(data.data.total_contratos) / Number(data.data.total_leads)) * 100)
            : 0,
        leadsToAssinadosPercent:
          data.data.total_leads > 0
            ? Math.round((Number(data.data.total_assinados) / Number(data.data.total_leads)) * 100)
            : 0,
        contratosToAssinadosPercent:
          data.data.total_contratos > 0
            ? Math.round((Number(data.data.total_assinados) / Number(data.data.total_contratos)) * 100)
            : 0,
      };
    },
    enabled: true,
    staleTime: 1000 * 60 * 5,
  });
};

export const usePublicJuliaPerformanceExport = (
  tipoAgente: string = "TODOS",
  agentId: string | null = null,
  dataInicio: Date | null = null,
  dataFim: Date | null = null,
  userCodAgents: string[] | null = null,
  enabled: boolean = false,
  sessionToken: string | null = null,
  generateFreshToken?: (() => string | null) | null
) => {
  const hoje = getNowInBrazil();
  const inicioFormatado = dataInicio ? formatInBrazil(dataInicio, "yyyy-MM-dd") : formatInBrazil(hoje, "yyyy-MM-dd");
  const fimFormatado = dataFim ? formatInBrazil(dataFim, "yyyy-MM-dd 23:59:59") : formatInBrazil(hoje, "yyyy-MM-dd 23:59:59");

  const query = `
    SELECT 
      cod_agent, 
      agent_id, 
      name, 
      business_name, 
      client_id, 
      perfil_agent, 
      session_id, 
      total_msg, 
      whatsapp, 
      status_document, 
      max_created_at, 
      created_at::timestamp
    FROM public.vw_desempenho_julia
    WHERE 1=1
      AND ($1 = 'TODOS' OR perfil_agent = $1)
      AND (COALESCE($2, '') = '' OR agent_id::text = $2)
      AND created_at >= $3::timestamp
      AND created_at <= $4::timestamp
      AND ($5::text[] IS NULL OR cod_agent::text = ANY($5::text[]))
    ORDER BY created_at DESC
  `;

  const params = [tipoAgente, agentId || "", inicioFormatado, fimFormatado, userCodAgents];

  return usePublicExternalDbQuery<JuliaPerformanceRecord>("public-julia-performance-export", query, params, {
    enabled,
    staleTime: 0,
  }, sessionToken, generateFreshToken);
};

export const calculateSummary = (data: JuliaPerformanceRecord[]): PerformanceSummary => {
  if (!data || data.length === 0) {
    return {
      leads: 0,
      contratos: 0,
      assinados: 0,
      emCurso: 0,
      leadsToContratosPercent: 0,
      leadsToAssinadosPercent: 0,
      contratosToAssinadosPercent: 0,
    };
  }

  const leads = data.length;

  const assinados = data.filter((r) => {
    const status = (r.status_document || "").toLowerCase().trim();
    return status === "signed" || status.includes("signed");
  }).length;

  const emCurso = data.filter((r) => {
    const status = (r.status_document || "").toLowerCase().trim();
    return status === "created" || status.includes("created");
  }).length;

  const contratos = assinados + emCurso;

  return {
    leads,
    contratos,
    assinados,
    emCurso,
    leadsToContratosPercent: leads > 0 ? Math.round((contratos / leads) * 100) : 0,
    leadsToAssinadosPercent: leads > 0 ? Math.round((assinados / leads) * 100) : 0,
    contratosToAssinadosPercent: contratos > 0 ? Math.round((assinados / contratos) * 100) : 0,
  };
};
