import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ToolRegistry } from "../tools/tool-registry.ts";
import { AgentOrchestrator } from "../orchestrator/agent-orchestrator.ts";
import type { ToolsConfig } from "../tools/types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessMessageRequest {
  agent_id: string;
  contact_phone: string;
  message_text: string;
  message_type: string;
  remote_jid: string;
  instance_data: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      agent_id, 
      message_text, 
      remote_jid, 
      contact_phone,
      instance_data 
    } = await req.json() as ProcessMessageRequest;
    
    console.log('🤖 AI Agent Handler - Iniciando processamento', {
      agent_id,
      remote_jid,
      message_text: message_text.substring(0, 50) + '...'
    });

    // 1. Buscar configuração do agente
    const { data: agent, error: agentError } = await supabase
      .from('julia_agents')
      .select(`
        *,
        ai_models_config (
          model_name,
          max_tokens,
          temperature,
          pricing_per_1k_input,
          pricing_per_1k_output
        )
      `)
      .eq('id', agent_id)
      .single();

    if (agentError || !agent) {
      throw new Error(`Agent not found: ${agentError?.message}`);
    }

    console.log('✅ Agente encontrado:', agent.name);

    // Inicializar sistema de tools se habilitado (normalizando formatos antigos/novos)
    const rawTools: any = agent.tools_config || { enabled_tools: [] };
    let toolsConfig: ToolsConfig = { enabled_tools: [] };

    if (Array.isArray(rawTools.enabled_tools)) {
      if (rawTools.enabled_tools.length > 0 && typeof rawTools.enabled_tools[0] === 'string') {
        toolsConfig.enabled_tools = rawTools.enabled_tools as string[];
      } else {
        // Formato baseado em objetos: [{ tool_id, enabled, config }]
        const enabledList = (rawTools.enabled_tools as any[])
          .filter((t: any) => t?.enabled)
          .map((t: any) => t.tool_id)
          .filter(Boolean);
        toolsConfig.enabled_tools = enabledList;

        // Extrair config da booking tool
        const bookingItem = (rawTools.enabled_tools as any[])
          .find((t: any) => t?.tool_id === 'booking' && t?.enabled);
        if (bookingItem?.config?.calendar_id) {
          toolsConfig.booking = { calendar_id: bookingItem.config.calendar_id };
        }
      }
    }

    // Compatibilidade se já existir rawTools.booking
    if (!toolsConfig.booking && rawTools.booking?.calendar_id) {
      toolsConfig.booking = { calendar_id: rawTools.booking.calendar_id };
    }

    const toolRegistry = new ToolRegistry(toolsConfig);
    const hasTools = toolRegistry.hasEnabledTools();
    
    if (hasTools) {
      console.log('🔧 Sistema de tools habilitado:', toolsConfig.enabled_tools, 'booking:', toolsConfig.booking?.calendar_id || 'none');
    }

    // 2. Buscar/criar conversação
    let { data: conversation } = await supabase
      .from('agent_conversations')
      .select('*')
      .eq('agent_id', agent_id)
      .eq('remote_jid', remote_jid)
      .single();

    if (!conversation) {
      console.log('📝 Criando nova conversação');
      const { data: newConv, error: convError } = await supabase
        .from('agent_conversations')
        .insert({
          agent_id,
          remote_jid,
          client_id: agent.client_id,
          messages: []
        })
        .select()
        .single();

      if (convError) throw convError;
      conversation = newConv;
    }

    // Verificar se a conversa está pausada
    const isPaused = conversation.is_paused || agent.is_paused_globally;
    
    if (isPaused) {
      console.log('⏸️ Conversa pausada - salvando mensagem na memória mas não respondendo');
      
      // Salvar mensagem do usuário na memória mesmo com agente pausado
      const userMessageData = {
        conversation_id: conversation.id,
        agent_id,
        client_id: agent.client_id,
        remote_jid,
        role: 'user',
        content: message_text,
        importance_score: 0.5,
        metadata: {
          paused: true,
          paused_reason: conversation.paused_reason || 'Agente pausado globalmente',
          timestamp: new Date().toISOString()
        }
      };

      // Salvar em background e gerar embedding
      Promise.all([
        supabase.from('agent_conversation_messages').insert(userMessageData)
      ]).then(async () => {
        console.log('✅ Mensagem do usuário salva na memória (agente pausado)');
        
        // Gerar e salvar embedding
        try {
          const { data: embData } = await supabase.functions.invoke('generate-embedding', { 
            body: { text: message_text } 
          });

          if (embData?.embedding) {
            const { data: savedMsg } = await supabase
              .from('agent_conversation_messages')
              .select('id')
              .eq('conversation_id', conversation.id)
              .eq('role', 'user')
              .eq('content', message_text)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (savedMsg) {
              await supabase
                .from('agent_conversation_messages')
                .update({ embedding: embData.embedding })
                .eq('id', savedMsg.id);
              console.log('✅ Embedding salvo para mensagem pausada');
            }
          }
        } catch (error) {
          console.warn('⚠️ Erro ao salvar embedding:', error);
        }

        // Atualizar última mensagem na conversação
        await supabase
          .from('agent_conversations')
          .update({
            last_message_at: new Date().toISOString()
          })
          .eq('id', conversation.id);
      }).catch(error => {
        console.error('❌ Erro ao salvar mensagem pausada:', error);
      });

      return new Response(
        JSON.stringify({ 
          success: true,
          paused: true,
          reason: conversation.paused_reason || 'Agente pausado globalmente',
          message_saved: true
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar frases de pausa
    const pausePhrases = agent.pause_phrases || [];
    const shouldPause = pausePhrases.some((phrase: string) => 
      message_text.toLowerCase().includes(phrase.toLowerCase())
    );

    if (shouldPause) {
      console.log('⏸️ Frase de pausa detectada - pausando conversa');
      await supabase
        .from('agent_conversations')
        .update({
          is_paused: true,
          paused_at: new Date().toISOString(),
          paused_reason: 'Usuário solicitou pausa',
          pause_triggered_by: 'user_message'
        })
        .eq('id', conversation.id);

      return new Response(
        JSON.stringify({ 
          success: true,
          paused: true,
          message: 'Conversa pausada por solicitação do usuário'
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Carregar histórico de mensagens (últimas 50 do banco)
    const { data: recentMessages } = await supabase
      .from('agent_conversation_messages')
      .select('role, content, created_at, importance_score')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(agent.memory_max_messages || 50);

    // 4. Gerar embedding da mensagem atual para busca semântica
    let relevantContext: any[] = [];
    try {
      const { data: embeddingData, error: embError } = await supabase.functions.invoke('generate-embedding', {
        body: { text: message_text }
      });

      if (!embError && embeddingData?.embedding) {
        console.log('🔍 Buscando contexto relevante por similaridade');
        
        // Buscar mensagens similares usando a função SQL
        const { data: similarMessages } = await supabase
          .rpc('search_similar_messages', {
            p_conversation_id: conversation.id,
            p_query_embedding: embeddingData.embedding,
            p_match_count: agent.memory_retrieval_count || 5,
            p_similarity_threshold: 0.7
          });

        if (similarMessages && similarMessages.length > 0) {
          console.log(`📚 ${similarMessages.length} mensagens relevantes encontradas`);
          relevantContext = similarMessages;
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao buscar contexto semântico:', error);
    }

    // 5. Preparar contexto de conversação
    const today = new Date().toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    let systemContent = '';
    
    // Se for agente custom, juntar bio + custom_prompt
    if (agent.agent_type === 'custom') {
      const bio = agent.agent_bio || '';
      const customPrompt = agent.custom_prompt || '';
      
      // Construir prompt: bio + prompt principal (se existir)
      if (bio && customPrompt) {
        systemContent = `${bio}\n\n${customPrompt}`;
      } else if (bio) {
        systemContent = bio;
      } else if (customPrompt) {
        systemContent = customPrompt;
      } else {
        systemContent = 'Você é um assistente virtual inteligente. Responda de forma clara e útil.';
      }
      
      // Adicionar data de hoje no início
      systemContent = `Hoje é: ${today}\n\n${systemContent}`;
    } else {
      // Para agente Julia, usar system_instructions ou fallback
      systemContent = agent.system_instructions || 
                     'Você é um assistente virtual inteligente. Responda de forma clara e útil.';
    }
    
    const messages: any[] = [
      { 
        role: 'system', 
        content: systemContent
      }
    ];

    // Se a tool de agenda estiver habilitada, reforce o uso obrigatório das tools
    if (toolsConfig.enabled_tools.includes('booking') && toolsConfig.booking?.calendar_id) {
      messages.push({
        role: 'system',
        content: `Instruções de agendamento:
- Nunca invente horários livres. Sempre chame as funções de tool para consultar disponibilidade e criar agendamentos.
- Para verificar horários do dia solicitado, use a função "verificar_disponibilidade" com a data (YYYY-MM-DD) e duração padrão 30 minutos.
- Para criar um agendamento, use "criar_agendamento" informando o número do usuário ${contact_phone} quando necessário.
- Se não houver disponibilidade, informe claramente e ofereça checar outras datas.`
      });
    }

    // Adicionar contexto relevante se encontrado
    if (relevantContext.length > 0) {
      const contextSummary = relevantContext
        .map((msg: any) => `[${msg.role}]: ${msg.content}`)
        .join('\n');
      
      messages.push({
        role: 'system',
        content: `Contexto relevante da conversa:\n${contextSummary}`
      });
    }

    // Adicionar histórico recente (invertido para ordem cronológica)
    const history = (recentMessages || [])
      .reverse()
      .map((msg: any) => ({ role: msg.role, content: msg.content }));
    
    messages.push(...history);
    
    // Adicionar mensagem atual do usuário
    messages.push({ role: 'user', content: message_text });

    console.log('💬 Contexto preparado:', {
      system: messages[0].content.substring(0, 50) + '...',
      relevant_context: relevantContext.length,
      history_length: history.length,
      total_messages: messages.length
    });

    // 6. Chamar LLM (com ou sem tools)
    const startTime = Date.now();
    const model = agent.ai_models_config?.model_name || 'gpt-4o-mini';
    const temperature = agent.ai_models_config?.temperature || 0.7;
    const maxTokens = agent.ai_models_config?.max_tokens || 1000;
    
    let assistantMessage: string;
    let tokensInput: number;
    let tokensOutput: number;

    if (hasTools) {
      console.log('🤖 Usando Agent Orchestrator com tools');
      
      // Preparar contexto de execução para tools
      const toolContext = {
        supabase,
        agent_id,
        client_id: agent.client_id,
        remote_jid,
        conversation_id: conversation.id
      };

      // Obter definições de tools
      const toolDefinitions = toolRegistry.getEnabledToolDefinitions();

      // Criar orchestrator e executar
      const orchestrator = new AgentOrchestrator(toolContext, toolsConfig);
      const result = await orchestrator.run(
        messages,
        openaiKey,
        model,
        temperature,
        maxTokens,
        toolDefinitions
      );

      assistantMessage = result.finalResponse;
      tokensInput = result.totalTokens.input;
      tokensOutput = result.totalTokens.output;

      console.log('✅ Orchestrator concluído:', {
        iterations: result.iterations,
        tools_executed: result.toolsExecuted,
        tokens: `${tokensInput}+${tokensOutput}=${tokensInput + tokensOutput}`
      });
    } else {
      console.log('🔄 Chamando LLM direto (sem tools):', model);

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('❌ Erro OpenAI:', errorText);
        throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
      }

      const aiResponse = await openaiResponse.json();
      assistantMessage = aiResponse.choices[0].message.content;
      tokensInput = aiResponse.usage.prompt_tokens;
      tokensOutput = aiResponse.usage.completion_tokens;
    }

    const responseTime = Date.now() - startTime;
    console.log('✅ Resposta recebida em', responseTime, 'ms');
    console.log('💡 Resposta:', assistantMessage.substring(0, 100) + '...');

    // 7. Salvar mensagens na nova tabela de memória (background)
    const userMessageData = {
      conversation_id: conversation.id,
      agent_id,
      client_id: agent.client_id,
      remote_jid,
      role: 'user',
      content: message_text,
      importance_score: 0.5
    };

    const assistantMessageData = {
      conversation_id: conversation.id,
      agent_id,
      client_id: agent.client_id,
      remote_jid,
      role: 'assistant',
      content: assistantMessage,
      importance_score: 0.5
    };

    // Processar em background garantindo ordem (user -> assistant)
    (async () => {
      try {
        const now = new Date();
        const userCreatedAt = now.toISOString();
        const assistantCreatedAt = new Date(now.getTime() + 1).toISOString();

        // 1) Inserir mensagem do usuário primeiro
        await supabase.from('agent_conversation_messages').insert({
          ...userMessageData,
          created_at: userCreatedAt,
        });

        // 2) Inserir resposta do assistente depois
        await supabase.from('agent_conversation_messages').insert({
          ...assistantMessageData,
          created_at: assistantCreatedAt,
        });

        console.log('✅ Mensagens salvas na tabela agent_conversation_messages');

        // 3) Salvar também na tabela messages para aparecer no chat
        const { data: contact } = await supabase
          .from('contacts')
          .select('id')
          .eq('phone', remote_jid.replace('@s.whatsapp.net', ''))
          .eq('client_id', agent.client_id)
          .single();

        if (contact) {
          // Salvar mensagem do assistente na tabela messages
          await supabase.from('messages').insert({
            contact_id: contact.id,
            client_id: agent.client_id,
            content: assistantMessage,
            type: 'text',
            from_me: true,
            status: 'sent',
            timestamp: assistantCreatedAt
          });
          console.log('✅ Mensagem do agente salva na tabela messages');
        }

        // 4) Inserir/atualizar registro em pre_followup (somente se agente estiver ativo e não pausado)
        if (!agent.is_active || agent.is_paused_globally) {
          console.log(`⏸️ Pre-followup NÃO criado - Agente ${agent.is_active ? 'pausado' : 'desativado'}`);
        } else {
          try {
            const { error: preFollowupError } = await supabase
              .from('pre_followup')
              .insert({
                conversation_id: conversation.id,
                agent_id,
                client_id: agent.client_id,
                remote_jid,
                agent_message_id: null,
                agent_message_content: assistantMessage.substring(0, 500),
                agent_message_sent_at: assistantCreatedAt,
                status: 'pending',
                expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                metadata: {
                  model_used: model,
                  tokens_used: tokensInput + tokensOutput,
                  has_tools: hasTools
                }
              });

            if (preFollowupError) {
              // Se for erro de duplicata (registro pending já existe), apenas atualizar
              if (preFollowupError.code === '23505') {
                await supabase
                  .from('pre_followup')
                  .update({
                    agent_message_content: assistantMessage.substring(0, 500),
                    agent_message_sent_at: assistantCreatedAt,
                    updated_at: assistantCreatedAt,
                    metadata: {
                      model_used: model,
                      tokens_used: tokensInput + tokensOutput,
                      has_tools: hasTools,
                      updated: true
                    }
                  })
                  .eq('conversation_id', conversation.id)
                  .eq('status', 'pending');
                
                console.log('✅ Pre-followup atualizado (agente enviou nova mensagem)');
              } else {
                console.error('⚠️ Erro ao inserir pre_followup:', preFollowupError);
              }
            } else {
              console.log('✅ Pre-followup criado para conversa', conversation.remote_jid);
            }
          } catch (error) {
            console.error('⚠️ Exceção ao gerenciar pre_followup:', error);
            // Não interromper o fluxo principal se falhar
          }
        }

        // Gerar e salvar embeddings
        try {
          const [userEmb, assistantEmb] = await Promise.all([
            supabase.functions.invoke('generate-embedding', { body: { text: message_text } }),
            supabase.functions.invoke('generate-embedding', { body: { text: assistantMessage } })
          ]);

          if (userEmb.data?.embedding) {
            const { data: userMsg } = await supabase
              .from('agent_conversation_messages')
              .select('id')
              .eq('conversation_id', conversation.id)
              .eq('role', 'user')
              .eq('content', message_text)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (userMsg) {
              await supabase
                .from('agent_conversation_messages')
                .update({ embedding: userEmb.data.embedding })
                .eq('id', userMsg.id);
            }
          }

          if (assistantEmb.data?.embedding) {
            const { data: assistantMsg } = await supabase
              .from('agent_conversation_messages')
              .select('id')
              .eq('conversation_id', conversation.id)
              .eq('role', 'assistant')
              .eq('content', assistantMessage)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (assistantMsg) {
              await supabase
                .from('agent_conversation_messages')
                .update({ embedding: assistantEmb.data.embedding })
                .eq('id', assistantMsg.id);
            }
          }

          console.log('✅ Embeddings salvos');
        } catch (embError) {
          console.warn('⚠️ Erro ao salvar embeddings:', embError);
        }
      } catch (err) {
        console.error('⚠️ Erro ao salvar mensagens em ordem:', err);
      }
    })();

    // Atualizar conversação (manter compatibilidade com JSONB antigo)
    const updatedMessages = [
      ...messages.slice(1), // Remove system message
      { role: 'assistant', content: assistantMessage, timestamp: new Date().toISOString() }
    ];

    await supabase
      .from('agent_conversations')
      .update({
        messages: updatedMessages,
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversation.id);

    // 8. Salvar log de uso
    const pricingInput = agent.ai_models_config?.pricing_per_1k_input || 0;
    const pricingOutput = agent.ai_models_config?.pricing_per_1k_output || 0;
    
    const costInput = (tokensInput / 1000) * pricingInput;
    const costOutput = (tokensOutput / 1000) * pricingOutput;
    const totalCost = costInput + costOutput;

    await supabase
      .from('agent_usage_logs')
      .insert({
        agent_id,
        client_id: agent.client_id,
        model_used: model,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        cost_input: costInput,
        cost_output: costOutput,
        total_cost: totalCost,
        response_time_ms: responseTime,
        success: true
      });

    console.log('💰 Custo calculado: R$', totalCost.toFixed(4));

    // 9. Enviar resposta via WhatsApp
    console.log('📤 Enviando resposta via WhatsApp');
    console.log('📍 Instance data:', JSON.stringify({
      api_url: instance_data?.api_url,
      has_token: !!instance_data?.api_token,
      remote_jid
    }));
    
    if (!instance_data?.api_url || !instance_data?.api_token) {
      console.error('❌ Dados da instância incompletos:', {
        has_api_url: !!instance_data?.api_url,
        has_api_token: !!instance_data?.api_token,
        instance_data_keys: instance_data ? Object.keys(instance_data) : []
      });
      throw new Error('Instance data is incomplete (missing api_url or api_token)');
    }
    
    const chatId = remote_jid.includes('@') ? remote_jid : `${remote_jid}@s.whatsapp.net`;
    const whatsappUrl = `${instance_data.api_url}/send/text`;
    const whatsappPayload = {
      number: chatId,
      text: assistantMessage
    };

    console.log('📡 Enviando para:', whatsappUrl);

    const whatsappResponse = await fetch(whatsappUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': instance_data.api_token },
      body: JSON.stringify(whatsappPayload)
    });

    if (!whatsappResponse.ok) {
      const errorText = await whatsappResponse.text();
      console.error('❌ Erro ao enviar WhatsApp:', {
        status: whatsappResponse.status,
        statusText: whatsappResponse.statusText,
        body: errorText
      });
      throw new Error(`Failed to send WhatsApp message: ${whatsappResponse.status} - ${errorText}`);
    }

    console.log('✅ Resposta enviada com sucesso!');

    // 📝 NOTA: NÃO salvamos a mensagem aqui para evitar duplicação.
    // O webhook UAZAP já registra automaticamente todas as mensagens enviadas
    // quando elas retornam com fromMe=true.

    return new Response(
      JSON.stringify({ 
        success: true,
        response: assistantMessage,
        tokens: { input: tokensInput, output: tokensOutput },
        cost: totalCost,
        response_time_ms: responseTime
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('💥 Erro no AI Agent Handler:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
