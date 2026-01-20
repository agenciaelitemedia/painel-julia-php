-- Fase 1: Infraestrutura de Memória Vetorial + Sistema de Pausa

-- 1.1 Habilitar extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 1.2 Criar tabela para mensagens individuais com embeddings
CREATE TABLE IF NOT EXISTS public.agent_conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.julia_agents(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  remote_jid TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  importance_score NUMERIC DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_conversation_messages ON public.agent_conversation_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_messages ON public.agent_conversation_messages(agent_id, created_at DESC);

-- 1.3 Criar tabela para resumos automáticos
CREATE TABLE IF NOT EXISTS public.agent_conversation_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.julia_agents(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  embedding vector(1536),
  messages_count INTEGER NOT NULL,
  time_range_start TIMESTAMPTZ NOT NULL,
  time_range_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversation_summaries ON public.agent_conversation_summaries(conversation_id, created_at DESC);

-- 1.4 Adicionar campos de controle em julia_agents
ALTER TABLE public.julia_agents 
  ADD COLUMN IF NOT EXISTS pause_phrases TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_paused_globally BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS memory_max_messages INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS memory_retrieval_count INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS auto_summary_threshold INTEGER DEFAULT 100;

-- 1.5 Adicionar controle de pausa em agent_conversations
ALTER TABLE public.agent_conversations 
  ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paused_reason TEXT,
  ADD COLUMN IF NOT EXISTS pause_triggered_by TEXT;

-- 1.6 Função SQL para busca vetorial (Fase 5)
CREATE OR REPLACE FUNCTION public.search_similar_messages(
  p_conversation_id UUID,
  p_query_embedding vector(1536),
  p_match_count INT DEFAULT 5,
  p_similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  role TEXT,
  content TEXT,
  similarity FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.role,
    m.content,
    1 - (m.embedding <=> p_query_embedding) AS similarity,
    m.created_at
  FROM public.agent_conversation_messages m
  WHERE 
    m.conversation_id = p_conversation_id
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> p_query_embedding) > p_similarity_threshold
  ORDER BY m.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

-- 1.7 RLS Policies para agent_conversation_messages
ALTER TABLE public.agent_conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their client messages"
ON public.agent_conversation_messages
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR client_id = get_user_client_id(auth.uid())
);

CREATE POLICY "System can insert messages"
ON public.agent_conversation_messages
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) 
  OR client_id = get_user_client_id(auth.uid())
);

-- 1.8 RLS Policies para agent_conversation_summaries
ALTER TABLE public.agent_conversation_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their client summaries"
ON public.agent_conversation_summaries
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR agent_id IN (
    SELECT id FROM public.julia_agents 
    WHERE client_id = get_user_client_id(auth.uid())
  )
);

CREATE POLICY "System can insert summaries"
ON public.agent_conversation_summaries
FOR INSERT
WITH CHECK (true);

-- 1.9 Migrar dados existentes de agent_conversations.messages para nova tabela
INSERT INTO public.agent_conversation_messages 
  (conversation_id, agent_id, client_id, remote_jid, role, content, created_at, importance_score)
SELECT 
  c.id as conversation_id,
  c.agent_id,
  c.client_id,
  c.remote_jid,
  (msg->>'role')::TEXT as role,
  (msg->>'content')::TEXT as content,
  COALESCE((msg->>'timestamp')::timestamptz, c.created_at) as created_at,
  0.5 as importance_score
FROM public.agent_conversations c,
  jsonb_array_elements(c.messages) AS msg
WHERE c.messages IS NOT NULL 
  AND jsonb_array_length(c.messages) > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.agent_conversation_messages 
    WHERE conversation_id = c.id
  );

COMMENT ON TABLE public.agent_conversation_messages IS 'Armazena mensagens individuais com embeddings para memória de longo prazo';
COMMENT ON TABLE public.agent_conversation_summaries IS 'Resumos automáticos de conversas longas';
COMMENT ON FUNCTION public.search_similar_messages IS 'Busca mensagens semanticamente similares usando pgvector';