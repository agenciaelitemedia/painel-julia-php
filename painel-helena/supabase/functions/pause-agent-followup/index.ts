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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { agent_id, is_paused } = await req.json();

    console.log(`[PauseAgentFollowup] Agente ${agent_id} pausado: ${is_paused}`);

    if (is_paused) {
      // ✅ REGRA: Quando agente é pausado, remover todos os leads das etapas de follow-up
      
      // Buscar todas as conversas ativas deste agente com follow-up em andamento
      const { data: conversations } = await supabase
        .from('agent_conversations')
        .select('id')
        .eq('agent_id', agent_id);

      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map(c => c.id);

        // Cancelar todas as execuções pendentes/agendadas
        const { data: cancelledExecutions, error: cancelError } = await supabase
          .from('followup_executions')
          .update({ status: 'cancelled' })
          .in('conversation_id', conversationIds)
          .in('status', ['scheduled', 'pending'])
          .select('id, conversation_id');

          if (cancelError) {
            console.error('[PauseAgentFollowup] Erro ao cancelar execuções:', cancelError);
          } else if (cancelledExecutions && cancelledExecutions.length > 0) {
            // Buscar client_id do agente para registrar corretamente o histórico
            const { data: agentRow } = await supabase
              .from('julia_agents')
              .select('client_id')
              .eq('id', agent_id)
              .single();

            const clientId = agentRow?.client_id;

            // Registrar no histórico para cada conversa afetada
            const historyInserts = cancelledExecutions.map(exec => ({
              conversation_id: exec.conversation_id,
              client_id: clientId,
              event_type: 'agent_paused',
              metadata: {
                execution_id: exec.id,
                paused_at: new Date().toISOString(),
                reason: 'Agente foi pausado - follow-up cancelado'
              }
            }));

            await supabase.from('followup_history').insert(historyInserts);

            console.log(`[PauseAgentFollowup] ✅ ${cancelledExecutions.length} execuções canceladas (agente pausado)`);
          } else {
          console.log(`[PauseAgentFollowup] ℹ️ Nenhuma execução ativa encontrada para cancelar`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: is_paused ? 'Follow-ups cancelados' : 'Agente reativado'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PauseAgentFollowup] Erro crítico:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
