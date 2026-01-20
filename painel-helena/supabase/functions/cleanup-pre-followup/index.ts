import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Cleanup] Iniciando limpeza de pre_followup...');

    // 1. Buscar pre_followups expirados para registrar no_response
    const { data: expired, error: expiredFetchError } = await supabase
      .from('pre_followup')
      .select(`
        id,
        conversation_id,
        client_id,
        agent_id,
        remote_jid,
        created_at,
        agent_conversations!inner (
          contacts!inner (
            name
          )
        )
      `)
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());

    if (expiredFetchError) {
      console.error('[Cleanup] Erro ao buscar expirados:', expiredFetchError);
    }

    // Registrar no_response para cada um ANTES de marcar como expirado
    for (const pf of expired || []) {
      try {
        // Verificar se já existe um follow-up ativo (não precisa registrar no_response)
        const { data: activeFollowup } = await supabase
          .from('followup_executions')
          .select('id')
          .eq('conversation_id', pf.conversation_id)
          .in('status', ['scheduled', 'pending', 'sent'])
          .limit(1)
          .maybeSingle();

        // Se NÃO tem follow-up ativo, significa que não há configuração
        // Então registrar no_response
        if (!activeFollowup) {
          const contacts = pf.agent_conversations as any;
          const contactName = contacts?.contacts?.[0]?.name || 'Desconhecido';
          
          await supabase.from('followup_history').insert({
            conversation_id: pf.conversation_id,
            client_id: pf.client_id,
            event_type: 'no_response',
            metadata: {
              reason: 'no_followup_config',
              contact_name: contactName,
              pre_followup_id: pf.id,
              expired_at: new Date().toISOString()
            }
          });

          console.log(`[Cleanup] ✅ Registrado no_response para ${pf.remote_jid} (sem config de follow-up)`);
        }
      } catch (error) {
        console.error(`[Cleanup] Erro ao processar pre_followup ${pf.id}:`, error);
      }
    }

    // 2. Agora marcar como expirado
    const { error: expireError } = await supabase
      .from('pre_followup')
      .update({
        status: 'expired',
        cancelled_at: new Date().toISOString(),
        cancelled_reason: 'auto_expired',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());

    const expiredCount = expired?.length || 0;
    console.log(`[Cleanup] ${expiredCount} registros expirados e processados`);

    // 2. Deletar registros finalizados (processed ou expired) há mais de 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: deleted, error: deleteError } = await supabase
      .from('pre_followup')
      .delete()
      .in('status', ['processed', 'expired'])
      .lt('updated_at', oneDayAgo)
      .select('id');

    const deletedCount = deleted?.length || 0;
    console.log(`[Cleanup] ${deletedCount} registros antigos deletados (>24h)`);

    // 3. Estatísticas
    const { data: stats } = await supabase
      .from('pre_followup')
      .select('status')
      .then(res => {
        const grouped = (res.data || []).reduce((acc: any, row: any) => {
          acc[row.status] = (acc[row.status] || 0) + 1;
          return acc;
        }, {});
        return { data: grouped };
      });

    console.log('[Cleanup] Estatísticas atuais:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        expired: expiredCount,
        deleted: deletedCount,
        current_stats: stats?.data || {}
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Cleanup] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
