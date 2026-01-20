import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { execution_id } = await req.json();

    console.log('[TestFollowup] Iniciando teste de envio...', { execution_id });
    
    let executionQuery = supabase
      .from('followup_executions')
      .select(`
        *,
        followup_steps (*),
        followup_configs (*),
        agent_conversations!inner (
          remote_jid,
          agent_id,
          contact_id,
          contacts!inner (
            is_group,
            name,
            phone
          ),
          julia_agents (
            instance_id,
            whatsapp_instances (
              provider,
              api_token,
              api_url
            )
          )
        )
      `)
      .eq('agent_conversations.contacts.is_group', false)
      .in('status', ['scheduled', 'failed']);

    if (execution_id) {
      executionQuery = executionQuery.eq('id', execution_id);
    } else {
      executionQuery = executionQuery.limit(1);
    }

    const { data: executions, error: execError } = await executionQuery;

    console.log('[TestFollowup] Resultado da busca:', {
      found: executions?.length || 0,
      error: execError,
      executions: executions?.map(e => ({
        id: e.id,
        status: e.status,
        contact: e.agent_conversations?.contacts?.name
      }))
    });

    if (execError) {
      console.error('[TestFollowup] Erro ao buscar execução:', execError);
      throw execError;
    }

    if (!executions || executions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Nenhuma execução agendada ou com falha encontrada. Verifique se há execuções pendentes.',
          execution_id,
          debug: 'Busca retornou 0 resultados'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const execution = executions[0];
    const config = execution.followup_configs;
    const step = execution.followup_steps;
    const conversation = execution.agent_conversations;
    const contact = conversation?.contacts;

    console.log('[TestFollowup] Execução encontrada:', {
      execution_id: execution.id,
      contact: contact?.name,
      phone: contact?.phone,
      step: step?.title
    });

    if (!config || !step || !conversation || !contact) {
      throw new Error('Dados incompletos para execução');
    }

    if (contact.is_group) {
      throw new Error('Follow-up não permitido para grupos');
    }

    // Gerar mensagem
    let messageText = step.message;

    if (config.auto_message) {
      console.log('[TestFollowup] Gerando mensagem com IA...');
      
      const { data: generatedMsg, error: genError } = await supabase.functions.invoke(
        'generate-followup-message',
        {
          body: {
            conversation_id: execution.conversation_id,
            agent_id: conversation.agent_id,
            step_title: step.title
          }
        }
      );

      if (genError) {
        console.error('[TestFollowup] Erro ao gerar mensagem:', genError);
        messageText = `⏳ Olá! Gostaria de retomar nossa conversa. Como posso ajudar?`;
      } else {
        messageText = `⏳ ${generatedMsg.message}`;
      }
    } else {
      messageText = `⏳ ${messageText}`;
    }

    console.log('[TestFollowup] Mensagem preparada:', messageText.substring(0, 100));

    // Enviar via WhatsApp
    const instance = conversation.julia_agents?.whatsapp_instances;
    
    if (!instance) {
      throw new Error('Instância WhatsApp não encontrada');
    }

    console.log('[TestFollowup] Enviando via WhatsApp:', {
      api_url: instance.api_url,
      provider: instance.provider,
      remote_jid: conversation.remote_jid,
      has_token: !!instance.api_token
    });

    const sendResult = await sendWhatsAppMessage(
      instance.api_url,
      instance.api_token,
      conversation.remote_jid,
      messageText,
      instance.provider
    );

    if (!sendResult.success) {
      throw new Error(sendResult.error || 'Erro ao enviar mensagem');
    }

    console.log('[TestFollowup] ✅ Mensagem enviada com sucesso!');

    // Atualizar status
    await supabase
      .from('followup_executions')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        message_sent: messageText
      })
      .eq('id', execution.id);

    // Registrar no histórico
    await supabase.from('followup_history').insert({
      conversation_id: execution.conversation_id,
      execution_id: execution.id,
      client_id: execution.client_id,
      event_type: 'step_sent',
      metadata: {
        step_title: step.title,
        step_order: step.step_order,
        message_length: messageText.length,
        auto_generated: config.auto_message,
        test_send: true
      }
    });

    // Agendar próxima etapa, se existir
    const { data: nextStep } = await supabase
      .from('followup_steps')
      .select('*')
      .eq('config_id', config.id)
      .eq('step_order', step.step_order + 1)
      .maybeSingle();

    if (nextStep) {
      let nextScheduled = new Date();
      switch (nextStep.step_unit) {
        case 'minutes':
          nextScheduled = new Date(nextScheduled.getTime() + nextStep.step_value * 60 * 1000);
          break;
        case 'hours':
          nextScheduled = new Date(nextScheduled.getTime() + nextStep.step_value * 60 * 60 * 1000);
          break;
        case 'days':
          nextScheduled = new Date(nextScheduled.getTime() + nextStep.step_value * 24 * 60 * 60 * 1000);
          break;
      }

      await supabase.from('followup_executions').insert({
        conversation_id: execution.conversation_id,
        config_id: config.id,
        step_id: nextStep.id,
        client_id: execution.client_id,
        status: 'scheduled',
        scheduled_at: nextScheduled.toISOString(),
        is_infinite_loop: false,
        loop_iteration: (execution.loop_iteration || 0) + 1
      });

      await supabase.from('followup_history').insert({
        conversation_id: execution.conversation_id,
        client_id: execution.client_id,
        event_type: 'next_step_scheduled',
        metadata: {
          from_step: step.step_order,
          to_step: nextStep.step_order,
          scheduled_at: nextScheduled.toISOString(),
          test_send: true
        }
      });
    } else {
      // Última etapa: se NÃO estiver em loop infinito, marcar como "não responderam"
      if (!execution.is_infinite_loop) {
        await supabase.from('followup_history').insert({
          conversation_id: execution.conversation_id,
          client_id: execution.client_id,
          event_type: 'no_response',
          metadata: {
            final_step: step.step_order,
            step_title: step.title,
            test_send: true
          }
        });
        console.log(`[TestFollowup] 🔴 Lead sem resposta - etapa final ${step.step_order}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        execution_id: execution.id,
        contact: contact.name,
        phone: contact.phone,
        message: messageText,
        step: step.title,
        api_url: instance.api_url
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[TestFollowup] Erro crítico:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function sendWhatsAppMessage(
  apiUrl: string,
  token: string,
  remoteJid: string,
  message: string,
  provider?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const phone = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
    const isGroup = remoteJid.includes('@g.us');
    const lowerProv = (provider || '').toLowerCase();
    const isUazap = lowerProv.includes('uazap') || apiUrl.includes('uazapi.com');

    // Build endpoint, headers and body per provider
    const chatid = isGroup ? `${phone}@g.us` : `${phone}@s.whatsapp.net`;
    const endpoint = isUazap ? `${apiUrl}/send/text` : `${apiUrl}/message/sendText`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (isUazap) {
      headers['token'] = token;
    } else {
      headers['apitoken'] = token;
    }
    const body = isUazap
      ? { number: chatid, text: message }
      : { number: phone, text: message };

    console.log('[TestFollowup] Envio endpoint/body:', { endpoint, body, headers: Object.keys(headers) });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    console.log('[TestFollowup] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TestFollowup] Erro na resposta:', errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[TestFollowup] Erro ao enviar:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
