import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversation_id, agent_id, step_title } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[GenerateMessage] Gerando mensagem para conversa ${conversation_id}`);

    // Buscar últimas 10 mensagens da conversa
    const { data: messages, error: msgError } = await supabase
      .from('agent_conversation_messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (msgError) {
      console.error('[GenerateMessage] Erro ao buscar mensagens:', msgError);
      throw msgError;
    }

    // Buscar informações do agente
    const { data: agent, error: agentError } = await supabase
      .from('julia_agents')
      .select('name, agent_bio, custom_prompt')
      .eq('id', agent_id)
      .single();

    if (agentError) {
      console.error('[GenerateMessage] Erro ao buscar agente:', agentError);
      throw agentError;
    }

    // Montar contexto da conversa
    const conversationHistory = messages
      ?.reverse()
      .map(m => `${m.role === 'user' ? 'Lead' : agent.name}: ${m.content}`)
      .join('\n') || '';

    const lastUserMessage = messages?.find(m => m.role === 'user')?.content || '';

    // Preparar prompt para IA
    const systemPrompt = `Você é ${agent.name}, assistente de vendas/atendimento.

Contexto do agente:
${agent.agent_bio || 'Assistente focado em ajudar clientes'}

${agent.custom_prompt || ''}

Sua tarefa é gerar uma mensagem de follow-up persuasiva e natural que:
1. Retome o último assunto discutido de forma contextual
2. Seja amigável e não pareça robótica
3. Incentive o lead a responder
4. Tenha no máximo 280 caracteres
5. Use uma abordagem adequada ao contexto (não seja insistente se o lead já demonstrou desinteresse)

Histórico recente da conversa:
${conversationHistory}

Última mensagem do lead: "${lastUserMessage}"

IMPORTANTE: Retorne APENAS a mensagem de follow-up, sem explicações ou comentários adicionais.`;

    // Chamar Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Gere uma mensagem de follow-up para a etapa "${step_title}". O lead não respondeu há alguns minutos/horas/dias.` 
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[GenerateMessage] Erro na API Lovable AI:', errorText);
      throw new Error(`Erro ao gerar mensagem: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const generatedMessage = aiData.choices[0]?.message?.content?.trim() || 
      'Olá! Gostaria de retomar nossa conversa. Como posso ajudar?';

    console.log(`[GenerateMessage] ✅ Mensagem gerada: "${generatedMessage.substring(0, 50)}..."`);

    return new Response(
      JSON.stringify({ message: generatedMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[GenerateMessage] Erro crítico:', error);
    
    // Retornar mensagem padrão em caso de erro
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        message: 'Olá! Gostaria de retomar nossa conversa. Como posso ajudar?',
        error: errorMessage 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
