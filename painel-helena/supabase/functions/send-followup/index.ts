// supabase/functions/send-followup/index.ts
// Envia a etapa atual do follow-up e agenda automaticamente a próxima, se houver.
// Inclui verificação de estado terminal pós-pivô.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Json = Record<string, unknown>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TERMINAL_EVENTS = [
  "finished",
  "completed",
  "cancelled",
  "no_response",
  "timeout",
  "lead_moved",
  "agent_paused",
  "user_responded",
];

function badRequest(msg: string, extra: Json = {}) {
  return new Response(JSON.stringify({ ok: false, error: msg, ...extra }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function ok(payload: Json) {
  return new Response(JSON.stringify({ ok: true, ...payload }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function nowIso() {
  return new Date().toISOString();
}

function addMinutes(dateIso: string, minutes: number): string {
  const d = new Date(dateIso);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

// ⛳️ Envio da mensagem do followup (substitua pelo seu sender real)
async function sendFollowupMessage(args: {
  remoteJid: string; // 5531...@s.whatsapp.net
  text: string;
  clientId: string | number;
  agentId?: string | number;
}): Promise<{ success: boolean; provider_message_id?: string; error?: string }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1) Descobrir credenciais/instance
    let instance: any = null;
    if (args.agentId) {
      const { data: agent, error } = await supabase
        .from("julia_agents")
        .select("whatsapp_instances(id, api_url, api_token, instance_id, provider)")
        .eq("id", args.agentId)
        .maybeSingle();
      if (error) console.error("[sendFollowup] erro buscando agent:", error);
      instance = agent?.whatsapp_instances;
    }
    if (!instance) {
      const { data: wi, error } = await supabase
        .from("whatsapp_instances")
        .select("id, api_url, api_token, instance_id, provider, status")
        .eq("client_id", args.clientId)
        .eq("status", "connected")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) console.error("[sendFollowup] erro buscando instance por client:", error);
      instance = wi;
    }

    if (!instance?.api_url || !instance?.api_token || !instance?.instance_id) {
      return { success: false, error: "No connected whatsapp instance for client/agent" };
    }

    const provider = String(instance.provider || "uazap").toLowerCase();
    const base = String(instance.api_url).replace(/\/+$/, "");
    const pn = args.remoteJid.replace(/@(s\.whatsapp\.net|c\.us|lid)$/i, "");
    const text = args.text;

    const isUazap = provider.includes("uazap") || base.includes("uazap") || base.includes("uazapi");

    // 2) Adapta payloads
    const evoBody = (withInstanceInBody = false) => ({
      number: pn,
      text,
      options: {
        delay: 0,
        presence: "composing",
        linkPreview: false,
        track_source: "followup",
        source: "followup",
      },
      ...(withInstanceInBody ? { instanceId: instance.instance_id } : {}),
    });

    const uazapBody = {
      // alguns setups UAZAP pedem "chatId", outros "number"
      // enviamos os dois para maximizar compatibilidade
      chatId: `${pn}@s.whatsapp.net`,
      number: pn,
      text,
      track_source: "followup",
      source: "followup",
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (isUazap) {
      headers["token"] = instance.api_token;
    } else {
      // Evolution e afins costumam usar apitoken
      headers["apitoken"] = instance.api_token;
    }

    // 3) Estratégias por provedor + fallbacks
    type Attempt = { method: "POST" | "GET"; url: string; body?: any; asQuery?: boolean; label: string };

    const attempts: Attempt[] = [];

    if (!isUazap) {
      // Evolução padrão
      attempts.push(
        {
          label: "EV1 POST /message/sendText/{id}",
          method: "POST",
          url: `${base}/message/sendText/${instance.instance_id}`,
          body: evoBody(false),
        },
        {
          label: "EV2 POST /message/sendText (instanceId no corpo)",
          method: "POST",
          url: `${base}/message/sendText`,
          body: evoBody(true),
        },
        // Alguns stacks antigos aceitam GET com query (pouco comum, mas previne 405)
        {
          label: "EV3 GET /message/sendText/{id}?number=&text=",
          method: "GET",
          url: `${base}/message/sendText/${instance.instance_id}?number=${encodeURIComponent(pn)}&text=${encodeURIComponent(text)}`,
        },
      );
    } else {
      // UAZAP: variações comuns
      attempts.push(
        { label: "UA1 POST /messages/sendText", method: "POST", url: `${base}/messages/sendText`, body: uazapBody },
        { label: "UA2 POST /message/sendText", method: "POST", url: `${base}/message/sendText`, body: uazapBody },
        {
          label: "UA3 POST /message/sendText/{id}",
          method: "POST",
          url: `${base}/message/sendText/${instance.instance_id}`,
          body: uazapBody,
        },
        // Muitos servidores UAZAP expõem rota alternativa /send/text
        {
          label: "UA4 POST /send/text",
          method: "POST",
          url: `${base}/send/text`,
          body: { number: `${pn}@s.whatsapp.net`, text },
        },
        // GETs tolerantes
        {
          label: "UA5 GET /messages/sendText?number=&text=",
          method: "GET",
          url: `${base}/messages/sendText?number=${encodeURIComponent(pn)}&text=${encodeURIComponent(text)}`,
        },
        {
          label: "UA6 GET /message/sendText?number=&text=",
          method: "GET",
          url: `${base}/message/sendText?number=${encodeURIComponent(pn)}&text=${encodeURIComponent(text)}`,
        },
        {
          label: "UA7 GET /message/sendText/{id}?number=&text=",
          method: "GET",
          url: `${base}/message/sendText/${instance.instance_id}?number=${encodeURIComponent(pn)}&text=${encodeURIComponent(text)}`,
        },
      );
    }

    // 4) Tenta na ordem, trata 405/404 como sinal para próximo fallback
    let lastErr: string | undefined;
    for (const att of attempts) {
      try {
        const res = await fetch(att.url, {
          method: att.method,
          headers,
          body: att.method === "POST" ? JSON.stringify(att.body ?? {}) : undefined,
        });

        const raw = await res.text();
        let data: any = null;
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          data = { raw };
        }

        if (res.ok) {
          const providerId = data?.messageId || data?.id || data?.data?.id || `fu_${Date.now()}`;
          console.log(`[followup-send] OK via ${att.label}`, { url: att.url, provider, providerId });
          return { success: true, provider_message_id: providerId };
        }

        // 405/404 => tenta próxima rota
        if (res.status === 405 || res.status === 404) {
          console.warn(`[followup-send] Fallback (${att.label}) -> HTTP ${res.status}`, { url: att.url, data });
          lastErr = `HTTP ${res.status}: ${JSON.stringify(data).slice(0, 300)}`;
          continue;
        }

        // Outros erros => aborta e reporta
        console.error(`[followup-send] Falha (${att.label})`, { status: res.status, url: att.url, data });
        return { success: false, error: `HTTP ${res.status}: ${JSON.stringify(data).slice(0, 500)}` };
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
        console.warn(`[followup-send] Exceção (${att.label}) -> fallback`, { err: lastErr, url: att.url });
        continue;
      }
    }

    return { success: false, error: lastErr || "No provider endpoint accepted the request" };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}) as any);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Suporta modo "batch": quando sem execution_id, pega a próxima execução vencida
    let execution_id: string | undefined = body.execution_id;
    if (!execution_id) {
      const { data: dueExec, error: dueErr } = await supabase
        .from("followup_executions")
        .select("id")
        .eq("status", "scheduled")
        .lte("scheduled_at", nowIso())
        .order("scheduled_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (dueErr) {
        console.error("[send-followup] erro buscando execução pendente:", dueErr);
      }
      execution_id = dueExec?.id;
    }

    if (!execution_id) return ok({ skipped: true, reason: "no due executions" });

    // 1) Carrega execução
    const { data: execution, error: execErr } = await supabase
      .from("followup_executions")
      .select("*")
      .eq("id", execution_id)
      .maybeSingle();

    if (execErr) {
      console.error("[send-followup] erro ao carregar execução:", execErr);
      return badRequest("Erro ao carregar execução");
    }
    if (!execution) return badRequest("Execução não encontrada");

    if (["cancelled", "completed", "finished"].includes(execution.status)) {
      return ok({ skipped: true, reason: `execution already ${execution.status}` });
    }

    // 2) Carrega conversa
    const { data: conversation, error: convErr } = await supabase
      .from("agent_conversations")
      .select("id, client_id, remote_jid, agent_id")
      .eq("id", execution.conversation_id)
      .maybeSingle();

    if (convErr) {
      console.error("[send-followup] erro ao carregar conversa:", convErr);
      return badRequest("Erro ao carregar conversa");
    }
    if (!conversation) return badRequest("Conversa não encontrada");

    // 3) Carrega step atual (modelo novo baseado em followup_steps)
    const { data: stepRow, error: stepErr } = await supabase
      .from("followup_steps")
      .select("*")
      .eq("id", execution.step_id)
      .maybeSingle();

    if (stepErr) {
      console.error("[send-followup] erro buscando step:", stepErr);
      return badRequest("Erro ao buscar step da execução");
    }

    if (!stepRow) {
      // Se step não existe, finalize a execução
      await supabase
        .from("followup_executions")
        .update({ status: "completed", updated_at: nowIso() })
        .eq("id", execution.id);

      await supabase.from("followup_history").insert({
        client_id: execution.client_id,
        conversation_id: execution.conversation_id,
        execution_id: execution.id,
        config_id: execution.config_id,
        event_type: "completed",
        metadata: { reason: "No step found for this execution", step_id: execution.step_id },
      });

      return ok({ completed: true, reason: "no step found" });
    }

    const stepText: string = String(stepRow.message ?? "").trim();
    if (!stepText) return badRequest("Step sem texto configurado");

    const stepIndex = Number(stepRow.step_order ?? 1);

    // 4) Verificação de estado terminal pós-pivô
    const { data: scheduledHist, error: scheduledErr } = await supabase
      .from("followup_history")
      .select("id, created_at")
      .eq("conversation_id", conversation.id)
      .eq("execution_id", execution.id)
      .eq("event_type", "scheduled_step")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (scheduledErr) console.error("[send-followup] erro buscando scheduled_step:", scheduledErr);

    const pivotTime: string = scheduledHist?.created_at ?? execution.created_at;

    const { data: terminalAfter, error: terminalErr } = await supabase
      .from("followup_history")
      .select("id, event_type, created_at")
      .eq("conversation_id", conversation.id)
      .in("event_type", TERMINAL_EVENTS)
      .gt("created_at", pivotTime)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (terminalErr) console.error("[send-followup] erro buscando terminais pós-pivô:", terminalErr);

    if (terminalAfter) {
      await supabase
        .from("followup_executions")
        .update({
          status: "cancelled",
          cancelled_reason: "Terminal state reached",
          updated_at: nowIso(),
        })
        .eq("id", execution.id);

      await supabase.from("followup_history").insert({
        client_id: execution.client_id,
        conversation_id: conversation.id,
        execution_id: execution.id,
        config_id: execution.config_id,
        event_type: "cancelled",
        metadata: {
          reason: "Terminal state reached",
          terminal_event: terminalAfter.event_type,
          terminal_at: terminalAfter.created_at,
          pivot_at: pivotTime,
          step_index: stepIndex,
        },
      });

      return ok({
        cancelled: true,
        reason: "Terminal state reached (post-pivot)",
        terminal_event: terminalAfter.event_type,
        pivot_at: pivotTime,
      });
    }

    // 5) Opcional: checagens (agente/conversa pausados etc.) — se existir sua lógica, aplique aqui.

    // 6) Marca a execução como "in_progress" e loga "sending"
    await supabase
      .from("followup_executions")
      .update({ status: "in_progress", updated_at: nowIso() })
      .eq("id", execution.id);

    await supabase.from("followup_history").insert({
      client_id: execution.client_id,
      conversation_id: conversation.id,
      execution_id: execution.id,
      config_id: execution.config_id,
      event_type: "sending",
      metadata: { step_index: stepIndex, text_preview: stepText.slice(0, 140) },
    });

    // 7) Envia a mensagem do step
    const remoteJid = (conversation.remote_jid || "").includes("@")
      ? conversation.remote_jid
      : `${conversation.remote_jid}@s.whatsapp.net`;

    const sent = await sendFollowupMessage({
      remoteJid,
      text: stepText,
      clientId: conversation.client_id,
      agentId: conversation.agent_id,
    });

    if (!sent.success) {
      await supabase
        .from("followup_executions")
        .update({
          status: "scheduled", // ou "pending_retry"
          updated_at: nowIso(),
          last_error: sent.error ?? "unknown_error", // <- ajuste se existir a coluna
        })
        .eq("id", execution.id);

      await supabase.from("followup_history").insert({
        client_id: execution.client_id,
        conversation_id: conversation.id,
        execution_id: execution.id,
        config_id: execution.config_id,
        event_type: "send_failed",
        metadata: { step_index: stepIndex, error: sent.error ?? "unknown_error" },
      });

      return ok({ sent: false, retryable: true, error: sent.error ?? "unknown_error" });
    }

    // 8) Envio OK
    await supabase.from("followup_history").insert({
      client_id: execution.client_id,
      conversation_id: conversation.id,
      execution_id: execution.id,
      config_id: execution.config_id,
      event_type: "sent",
      metadata: { step_index: stepIndex, provider_message_id: sent.provider_message_id ?? null },
    });

    // 9) Verifica se existe PRÓXIMO step
    const nextIndex = stepIndex + 1;
    const { data: nextStep, error: nextErr } = await supabase
      .from("followup_steps")
      .select("*")
      .eq("config_id", execution.config_id)
      .eq("step_order", nextIndex)
      .maybeSingle();

    if (nextErr) {
      console.error("[send-followup] erro buscando próximo step:", nextErr);
      // se não dá pra saber o próximo, finalize esta execução
      await supabase
        .from("followup_executions")
        .update({ status: "completed", updated_at: nowIso() })
        .eq("id", execution.id);

      await supabase.from("followup_history").insert({
        client_id: execution.client_id,
        conversation_id: conversation.id,
        execution_id: execution.id,
        config_id: execution.config_id,
        event_type: "completed",
        metadata: { step_index: stepIndex, reason: "next step lookup error" },
      });

      return ok({ sent: true, completed: true, note: "next step lookup error" });
    }

    if (!nextStep) {
      // Não há próximo — finalizar
      await supabase
        .from("followup_executions")
        .update({ status: "completed", updated_at: nowIso() })
        .eq("id", execution.id);

      await supabase.from("followup_history").insert({
        client_id: execution.client_id,
        conversation_id: conversation.id,
        execution_id: execution.id,
        config_id: execution.config_id,
        event_type: "completed",
        metadata: { step_index: stepIndex, reason: "last step delivered" },
      });

      return ok({ sent: true, completed: true, last_step: true });
    }

    // 10) Existe próximo step => agenda próxima execução
    // Calcular horário com base em step_unit/step_value do próximo step
    const nowDate = new Date();
    let nextScheduled = new Date(nowDate);
    const unit = String(nextStep.step_unit || "minutes");
    const value = Number(nextStep.step_value || 0);
    if (isFinite(value) && value > 0) {
      switch (unit) {
        case "minutes":
          nextScheduled.setMinutes(nextScheduled.getMinutes() + value);
          break;
        case "hours":
          nextScheduled.setHours(nextScheduled.getHours() + value);
          break;
        case "days":
          nextScheduled.setDate(nextScheduled.getDate() + value);
          break;
        default:
          nextScheduled.setMinutes(nextScheduled.getMinutes() + value);
      }
    }
    const scheduledAt = nextScheduled.toISOString();

    // Cria nova execução para o próximo step (novo modelo usa step_id)
    const nextExecPayload: any = {
      client_id: execution.client_id,
      conversation_id: conversation.id,
      config_id: execution.config_id,
      step_id: nextStep.id,
      status: "scheduled",
      scheduled_at: scheduledAt,
    };

    const { data: nextExec, error: nextExecErr } = await supabase
      .from("followup_executions")
      .insert(nextExecPayload)
      .select("*")
      .maybeSingle();

    if (nextExecErr) {
      console.error("[send-followup] erro ao criar próxima execução:", nextExecErr);

      // Mesmo com erro na próxima execução, finalizamos a atual
      await supabase
        .from("followup_executions")
        .update({ status: "completed", updated_at: nowIso() })
        .eq("id", execution.id);

      await supabase.from("followup_history").insert({
        client_id: execution.client_id,
        conversation_id: conversation.id,
        execution_id: execution.id,
        config_id: execution.config_id,
        event_type: "completed",
        metadata: { step_index: stepIndex, warn: "failed to schedule next step" },
      });

      return ok({ sent: true, completed: true, warn: "failed to schedule next step" });
    }

    // Carimbo pivot da próxima etapa: scheduled_step
    await supabase.from("followup_history").insert({
      client_id: execution.client_id,
      conversation_id: conversation.id,
      execution_id: nextExec?.id ?? null,
      config_id: execution.config_id,
      event_type: "scheduled_step",
      metadata: {
        step_index: nextIndex,
        step_unit: unit,
        step_value: value,
      },
      created_at: scheduledAt, // pivot no horário em que deve rodar
    });

    // Finaliza a execução atual
    await supabase
      .from("followup_executions")
      .update({ status: "completed", updated_at: nowIso() })
      .eq("id", execution.id);

    return ok({
      sent: true,
      completed_current: true,
      scheduled_next: true,
      next_execution_id: nextExec?.id ?? null,
      runs_at: scheduledAt,
      next_step_index: nextIndex,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[send-followup] erro não tratado:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
