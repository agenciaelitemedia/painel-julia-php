-- Função para retornar summary agregado da Julia Performance
CREATE OR REPLACE FUNCTION public.get_julia_performance_summary(
  p_tipo_agente TEXT,
  p_agent_id TEXT,
  p_data_inicio TIMESTAMP,
  p_data_fim TIMESTAMP,
  p_cod_agents TEXT[]
)
RETURNS TABLE(
  total_leads BIGINT,
  total_contratos BIGINT,
  total_assinados BIGINT,
  total_em_curso BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_leads,
    COUNT(*) FILTER (
      WHERE LOWER(TRIM(COALESCE(status_document, ''))) IN ('signed', 'created')
      OR LOWER(TRIM(COALESCE(status_document, ''))) LIKE '%signed%'
      OR LOWER(TRIM(COALESCE(status_document, ''))) LIKE '%created%'
    )::BIGINT as total_contratos,
    COUNT(*) FILTER (
      WHERE LOWER(TRIM(COALESCE(status_document, ''))) = 'signed'
      OR LOWER(TRIM(COALESCE(status_document, ''))) LIKE '%signed%'
    )::BIGINT as total_assinados,
    COUNT(*) FILTER (
      WHERE LOWER(TRIM(COALESCE(status_document, ''))) = 'created'
      OR LOWER(TRIM(COALESCE(status_document, ''))) LIKE '%created%'
    )::BIGINT as total_em_curso
  FROM public.vw_desempenho_julia
  WHERE 1=1
    AND (p_tipo_agente = 'TODOS' OR perfil_agent = p_tipo_agente)
    AND (COALESCE(p_agent_id, '') = '' OR agent_id::text = p_agent_id)
    AND created_at >= p_data_inicio
    AND created_at <= p_data_fim
    AND (p_cod_agents IS NULL OR cod_agent::text = ANY(p_cod_agents));
END;
$$;