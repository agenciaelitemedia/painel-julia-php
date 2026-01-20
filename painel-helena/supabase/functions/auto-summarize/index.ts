import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('🔍 Buscando conversas para resumir...');

    // Buscar conversas com muitas mensagens sem resumo recente
    const { data: conversations, error: convError } = await supabaseClient
      .from('agent_conversations')
      .select(`
        id,
        agent_id,
        client_id,
        remote_jid,
        julia_agents!inner(
          auto_summary_threshold,
          ai_model_id,
          ai_models_config(model_name)
        )
      `)
      .limit(10);

    if (convError) {
      console.error('❌ Error fetching conversations:', convError);
      throw convError;
    }

    let summarizedCount = 0;

    for (const conv of conversations || []) {
      const agent = Array.isArray(conv.julia_agents) ? conv.julia_agents[0] : conv.julia_agents;
      const threshold = agent?.auto_summary_threshold || 100;

      // Contar mensagens não resumidas
      const { count } = await supabaseClient
        .from('agent_conversation_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id);

      if (!count || count < threshold) {
        continue;
      }

      console.log(`📝 Resumindo conversa ${conv.id} (${count} mensagens)`);

      // Buscar mensagens para resumir
      const { data: messages } = await supabaseClient
        .from('agent_conversation_messages')
        .select('role, content, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });

      if (!messages || messages.length === 0) continue;

      // Criar texto para resumir
      const conversationText = messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      // Chamar OpenAI para gerar resumo
      const agentConfig = Array.isArray(conv.julia_agents) ? conv.julia_agents[0] : conv.julia_agents;
      const modelConfig = Array.isArray(agentConfig?.ai_models_config) ? agentConfig.ai_models_config[0] : agentConfig?.ai_models_config;
      const model = modelConfig?.model_name || 'gpt-4o-mini';
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'Resuma a seguinte conversa de forma concisa, mantendo os pontos principais e contexto importante:'
            },
            {
              role: 'user',
              content: conversationText.substring(0, 50000) // Limitar tamanho
            }
          ],
          max_tokens: 500,
        }),
      });

      const data = await response.json();
      const summaryText = data.choices[0].message.content;

      // Gerar embedding do resumo
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: summaryText,
        }),
      });

      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data[0].embedding;

      // Salvar resumo
      const { error: summaryError } = await supabaseClient
        .from('agent_conversation_summaries')
        .insert({
          conversation_id: conv.id,
          agent_id: conv.agent_id,
          summary_text: summaryText,
          embedding,
          messages_count: messages.length,
          time_range_start: messages[0].created_at,
          time_range_end: messages[messages.length - 1].created_at,
        });

      if (summaryError) {
        console.error('❌ Error saving summary:', summaryError);
        continue;
      }

      summarizedCount++;
      console.log(`✅ Resumo salvo para conversa ${conv.id}`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      summarizedCount,
      message: `${summarizedCount} conversas resumidas com sucesso`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in auto-summarize:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
