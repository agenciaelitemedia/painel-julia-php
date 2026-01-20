import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[Monitor] 🔍 Verificando pre_followups elegíveis...");

    // Buscar todas as configs ativas
    const { data: configs, error: configsError } = await supabase
      .from("followup_configs")
      .select("*, followup_steps(*)")
      .eq("is_active", true);

    if (configsError) throw configsError;

    console.log(`[Monitor] ${configs?.length || 0} configs ativas`);

    let conversationsProcessed = 0;
    let executionsCreated = 0;

    for (const config of configs || []) {
      const delayMinutes = Math.max(5, Number(config.trigger_delay_minutes) || 5);
      const cutoffTime = new Date(Date.now() - delayMinutes * 60 * 1000).toISOString();

      // ✅ NOVA QUERY SIMPLIFICADA: Buscar pre_followups elegíveis
      const { data: eligiblePreFollowups, error: pfError } = await supabase
        .from("pre_followup")
        .select(
          `
          id,
          conversation_id,
          agent_id,
          remote_jid,
          created_at,
          agent_message_content,
          agent_conversations!inner (
            id,
            is_paused,
            julia_agents!inner (
              is_active,
              is_paused_globally
            )
          )
        `,
        )
        .eq("status", "pending")
        .eq("client_id", config.client_id)
        .eq("agent_id", config.agent_id)
        .lt("created_at", cutoffTime)
        .gt("expires_at", new Date().toISOString())
        .not("remote_jid", "like", "%@g.us")
        .eq("agent_conversations.is_paused", false)
        .eq("agent_conversations.julia_agents.is_active", true)
        .eq("agent_conversations.julia_agents.is_paused_globally", false);

      if (pfError) {
        console.error(`[Monitor] Erro ao buscar pre_followups:`, pfError);
        continue;
      }

      console.log(`[Monitor] Config ${config.id}: ${eligiblePreFollowups?.length || 0} conversas elegíveis`);

      for (const pf of eligiblePreFollowups || []) {
        try {
          // Verificar se já tem follow-up ativo
          const { data: activeFollowups } = await supabase
            .from("followup_executions")
            .select("id")
            .eq("conversation_id", pf.conversation_id)
            .in("status", ["scheduled", "pending"])
            .limit(1);

          if (activeFollowups && activeFollowups.length > 0) {
            console.log(`[Monitor] ⏭️ Conversa já tem follow-up ativo`);
            continue;
          }

          // Agendar primeira etapa
          const steps = (config.followup_steps || []).sort((a: any, b: any) => a.step_order - b.step_order);
          if (steps.length === 0) continue;

          const firstStep = steps[0];
          const scheduledTime = new Date();

          switch (firstStep.step_unit) {
            case "minutes":
              scheduledTime.setMinutes(scheduledTime.getMinutes() + firstStep.step_value);
              break;
            case "hours":
              scheduledTime.setHours(scheduledTime.getHours() + firstStep.step_value);
              break;
            case "days":
              scheduledTime.setDate(scheduledTime.getDate() + firstStep.step_value);
              break;
          }

          // Criar execução e obter o id
          const { data: newExec, error: insertError } = await supabase
            .from("followup_executions")
            .insert({
              conversation_id: pf.conversation_id,
              config_id: config.id,
              step_id: firstStep.id,
              client_id: config.client_id,
              status: "scheduled",
              scheduled_at: scheduledTime.toISOString(),
            })
            .select("id")
            .single();

          if (insertError) {
            console.error(`[Monitor] Erro ao criar execução:`, insertError);
            continue;
          }

          // Registrar pivot do step agendado (ajuda o send-followup a checar estados terminais pós-pivô)
          await supabase.from("followup_history").insert({
            conversation_id: pf.conversation_id,
            client_id: config.client_id,
            execution_id: newExec?.id ?? null,
            config_id: config.id,
            event_type: "scheduled_step",
            metadata: {
              step_index: Number(firstStep.step_order || 1),
              step_unit: String(firstStep.step_unit || "minutes"),
              step_value: Number(firstStep.step_value || 0),
            },
            created_at: scheduledTime.toISOString(),
          });

          // Marcar pre_followup como processado
          await supabase
            .from("pre_followup")
            .update({
              status: "processed",
              processed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", pf.id);

          // Registrar no histórico
          await supabase.from("followup_history").insert({
            conversation_id: pf.conversation_id,
            client_id: config.client_id,
            event_type: "started",
            metadata: {
              pre_followup_id: pf.id,
              first_step_id: firstStep.id,
              delay_minutes: delayMinutes,
            },
          });

          executionsCreated++;
          conversationsProcessed++;
          console.log(`[Monitor] ✅ Follow-up agendado: ${pf.remote_jid}`);
        } catch (error) {
          console.error(`[Monitor] Erro ao processar pre_followup ${pf.id}:`, error);
        }
      }
    }

    console.log(`[Monitor] ✅ Finalizado: ${conversationsProcessed} processadas, ${executionsCreated} execuções`);

    return new Response(JSON.stringify({ success: true, conversationsProcessed, executionsCreated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Monitor] ❌ Erro crítico:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
