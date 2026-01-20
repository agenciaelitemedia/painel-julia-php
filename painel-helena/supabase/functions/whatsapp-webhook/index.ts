import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ===== CACHE DE MENSAGENS ENVIADAS PELA API =====
const apiSentMessagesCache = new Map<string, { timestamp: number; timeoutId: number }>();
const CACHE_TTL_MS = 10000;

function addToApiCache(messageId: string) {
  if (!messageId) return;
  const timeoutId = setTimeout(() => {
    apiSentMessagesCache.delete(messageId);
    console.log(`[Cache] Message ${messageId} expirou`);
  }, CACHE_TTL_MS);
  apiSentMessagesCache.set(messageId, {
    timestamp: Date.now(),
    timeoutId: timeoutId as unknown as number,
  });
  console.log(`[Cache] Message ${messageId} adicionada (total: ${apiSentMessagesCache.size})`);
}

/**
 * Verifica se mensagem foi enviada pela API
 * Agora considera também track_source === "julia-n8n" como API externa.
 */
function checkIfSentViaAPI(
  messageId: string | undefined,
  source: string | undefined,
  trackSource?: string | undefined,
): boolean {
  // Hard stop por track_source
  if (trackSource === "julia-n8n") {
    console.log(`[checkIfSentViaAPI] track_source="julia-n8n" -> API externa (n8n) - NÃO processar Julia`);
    return true;
  }

  // Prioridade 1: Verificar campo 'source'
  if (source) {
    const manualChatSources = ["android", "ios", "web"];
    const isManualChat = manualChatSources.includes(source.toLowerCase());
    if (isManualChat) {
      console.log(`[checkIfSentViaAPI] source="${source}" -> Chat manual - PODE processar Julia`);
      return false;
    }
    console.log(`[checkIfSentViaAPI] source="${source}" -> API externa (n8n) - NÃO processar Julia`);
    return true;
  }

  // Prioridade 2: Cache (mensagens do sistema/frontend)
  if (messageId && apiSentMessagesCache.has(messageId)) {
    const cached = apiSentMessagesCache.get(messageId)!;
    const age = Date.now() - cached.timestamp;
    console.log(
      `[checkIfSentViaAPI] messageId="${messageId}" no cache (${age}ms) -> Mensagem do sistema - NÃO processar Julia`,
    );
    clearTimeout(cached.timeoutId);
    apiSentMessagesCache.delete(messageId);
    return true;
  }

  // Prioridade 3: source vazio e sem cache -> tratar como API externa
  if (!source || source === "") {
    console.log(`[checkIfSentViaAPI] source vazio sem cache -> API externa (n8n) - NÃO processar Julia`);
    return true;
  }

  console.log(`[checkIfSentViaAPI] fallback -> Chat manual`);
  return false;
}

// Função para buscar agentes Julia elegíveis
async function getEligibleJuliaAgents(supabase: any, instanceId: string | null) {
  if (!instanceId) return [];
  const { data: agents, error } = await supabase
    .from("julia_agents")
    .select(
      `
      id,
      name,
      agent_code,
      selected_julia_code,
      agent_type,
      client_id,
      instance_id,
      is_paused_globally,
      start_conversation_phrases,
      whatsapp_instances!inner (
        id,
        instance_id,
        phone_number,
        api_token,
        api_url,
        provider,
        status
      ),
      clients!inner (
        client_code,
        name
      ),
      ai_models_config (
        model_name
      )
    `,
    )
    .eq("is_active", true)
    .eq("instance_id", instanceId)
    .eq("whatsapp_instances.status", "connected");

  if (error) {
    console.error("❌ Erro ao buscar agentes:", error);
    return [];
  }
  return agents || [];
}

function buildJuliaJSON(message: any, agent: any, remoteJid: string) {
  return {
    MessageText: message.text || "",
    MessageType: message.type || "text",
    MessageFromMe: message.from_me || false,
    MessageId: message.message_id,
    MessageUrl: message.media_url || null,
    meta: {
      phoneNumber: agent.whatsapp_instances.phone_number,
    },
    app: {
      evo: {
        apikey: agent.whatsapp_instances.api_token,
        instance: agent.instance_id,
        server: agent.whatsapp_instances.api_url,
        type_sender: agent.whatsapp_instances.provider,
      },
      debouncerTime: 3,
    },
    queueId: 0,
    remoteJid: remoteJid.replace(/@(s\.whatsapp\.net|c\.us|lid)$/g, ""),
    cod_agent: agent.selected_julia_code,
    chatId: remoteJid,
  };
}

/**
 * Enviar dados para Webhook com retry, timeout e logs detalhados
 */
async function sendToWebhook(jsonData: any, maxRetries = 3): Promise<boolean> {
  const webhookUrl = Deno.env.get("WEBHOOK_MQ_PAINEL");
  if (!webhookUrl) {
    console.error("WEBHOOK_MQ_PAINEL não configurado");
    return false;
  }

  const messageId = jsonData?.MessageId || jsonData?.messageId || "unknown";

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      console.log(`Webhook POST tentativa ${attempt}/${maxRetries}`, { messageId });

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Source": "whatsapp-webhook",
          "X-Message-Id": String(messageId),
        },
        body: JSON.stringify(jsonData),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const text = await response.text();

      console.log("Webhook resposta:", {
        status: response.status,
        ok: response.ok,
        body: text?.slice(0, 200),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${text?.slice(0, 100)}`);
      }
      console.log("Mensagem enviada para webhook");
      return true;
    } catch (err) {
      clearTimeout(timeout);
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Erro webhook tentativa ${attempt}:`, msg);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
        continue;
      }
      return false;
    }
  }
  return false;
}

async function saveJuliaQueueLog(
  supabase: any,
  agent: any,
  jsonData: any,
  success: boolean,
  errorMessage?: string | null,
) {
  try {
    const logData = {
      cod_agente: agent.selected_julia_code,
      agent_id: agent.id,
      message_id: jsonData.MessageId,
      contact_id: null,
      message_text: jsonData.MessageText,
      message_type: jsonData.MessageType,
      message_from_me: jsonData.MessageFromMe,
      message_url: jsonData.MessageUrl,
      remote_jid: jsonData.remoteJid,
      chat_id: jsonData.chatId,
      phone_number: jsonData.meta.phoneNumber,
      instance_code: jsonData.app.evo.instance,
      json_payload: jsonData,
      sent_to_rabbitmq: success,
      rabbitmq_queue_name: Deno.env.get("RABBITMQ_QUEUE_NAME"),
      error_message: errorMessage || null,
      client_id: agent.client_id,
      sent_at: success ? new Date().toISOString() : null,
    };

    const { error } = await supabase.from("julia_queue_logs").insert(logData);
    if (error) console.error("❌ Erro ao salvar log:", error);
    else console.log("✅ Log salvo com sucesso");
  } catch (error) {
    console.error("❌ Exceção ao salvar log:", error);
  }
}

/**
 * 🔔 Enfileira um PRE-FOLLOWUP para a conversa (status = 'pending')
 * É chamado APÓS o envio bem-sucedido da mensagem do agente (Julia ou Custom).
 */
async function queuePreFollowup(
  supabase: any,
  params: {
    clientId: string;
    agentId: string;
    remoteJid: string;
    messageId: string;
    messageText?: string | null;
  },
) {
  try {
    const remote = params.remoteJid.includes("@") ? params.remoteJid : `${params.remoteJid}@s.whatsapp.net`;

    // Ensure there is an agent_conversations record and get its id
    let { data: conv } = await supabase
      .from('agent_conversations')
      .select('id')
      .eq('agent_id', params.agentId)
      .eq('remote_jid', remote)
      .maybeSingle();

    if (!conv) {
      const { data: newConv, error: convErr } = await supabase
        .from('agent_conversations')
        .insert({
          agent_id: params.agentId,
          client_id: params.clientId,
          remote_jid: remote,
          messages: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
      if (convErr) {
        console.error('❌ [queuePreFollowup] Falha ao criar conversa:', convErr);
      } else {
        conv = newConv;
        console.log('✅ [queuePreFollowup] Conversa criada para', remote);
      }
    }

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const payload: any = {
      client_id: params.clientId,
      agent_id: params.agentId,
      remote_jid: remote,
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: expiresAt
    };

    if (conv?.id) payload.conversation_id = conv.id;

    const { data, error } = await supabase.from('pre_followup').insert(payload).select('id').single();

    if (error) {
      console.error('❌ [pre_followup] Falha ao inserir registro:', error);
    } else {
      console.log('✅ [pre_followup] Registro criado:', data?.id);
    }
  } catch (err) {
    console.error('❌ [pre_followup] Exceção ao inserir registro:', err);
  }
}

serve(async (req) => {
  const startTime = Date.now();

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const timestamp = new Date().toISOString();

    // ===== ENDPOINT ESPECIAL: REGISTRAR MENSAGEM API =====
    if (url.pathname.endsWith("/register-api-message")) {
      const { messageId } = await req.json();
      if (messageId) {
        addToApiCache(messageId);
        console.log(`[register-api-message] Message ${messageId} registrada`);
        return new Response(JSON.stringify({ success: true, message: "Message registered" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: false, error: "messageId required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // ===== PROCESSAMENTO NORMAL DO WEBHOOK =====
    console.log(`\n\n=== [${timestamp}] WEBHOOK CHAMADO ===`);
    console.log("Method:", req.method);
    console.log("URL:", req.url);
    console.log("Headers:", Object.fromEntries(req.headers.entries()));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const webhookData = await req.json();
    const requestHeaders = Object.fromEntries(req.headers.entries());

    console.log("\n=== DADOS RECEBIDOS ===");
    console.log(JSON.stringify(webhookData, null, 2));

    // ===== RESOLUÇÃO MELHORADA DE INSTÂNCIA E CLIENT_ID =====
    const authHeader = req.headers.get("authorization") || "";
    const bearerToken = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : null;
    const headerToken =
      req.headers.get("token") || req.headers.get("x-instance-token") || req.headers.get("x-token") || bearerToken;

    const instanceToken = webhookData.token || webhookData.instanceId || webhookData.instance_id || headerToken;
    console.log("🔍 Instance token recebido (body/header):", instanceToken);

    let clientId: string | null = null;
    let apiProvider = "uazap"; // default
    let instanceId: string | null = null;
    let resolutionMethod = "none";

    if (instanceToken) {
      console.log("🔍 Tentando resolver por api_token...");
      const { data: instance, error: instErr } = await supabase
        .from("whatsapp_instances")
        .select("client_id, id, instance_id")
        .eq("api_token", instanceToken)
        .maybeSingle();

      if (instErr) console.error("⚠️ Erro buscando instancia por api_token:", instErr);

      if (instance) {
        clientId = instance.client_id;
        instanceId = instance.id;
        resolutionMethod = "api_token";
        console.log("✅ Instância resolvida por api_token:", {
          instanceId: instance.instance_id,
          clientId: instance.client_id,
        });
      } else {
        console.log("🔍 api_token não encontrado, tentando por instance_id...");
        const { data: instanceById, error: instByIdErr } = await supabase
          .from("whatsapp_instances")
          .select("client_id, id, instance_id")
          .eq("instance_id", instanceToken)
          .maybeSingle();

        if (instByIdErr) console.error("⚠️ Erro buscando instancia por instance_id:", instByIdErr);

        if (instanceById) {
          clientId = instanceById.client_id;
          instanceId = instanceById.id;
          resolutionMethod = "instance_id";
          console.log("✅ Instância resolvida por instance_id:", {
            instanceId: instanceById.instance_id,
            clientId: instanceById.client_id,
          });
        } else {
          console.warn("⚠️ Instância não encontrada para token:", instanceToken);
        }
      }
    } else {
      console.warn("⚠️ Nenhum instance token encontrado no webhook");
    }

    console.log("📊 Resolução de instância:", {
      method: resolutionMethod,
      clientId: clientId,
      instanceId: instanceId,
      apiProvider: apiProvider,
    });

    // Detectar provedor e normalizar dados do webhook
    const event = webhookData.event || webhookData.type || webhookData.EventType;
    console.log("Evento detectado:", event);

    // Normalização por provedores (se aplicável)
    let normalizedData: any = null;

    if (apiProvider === "official") {
      const entry = webhookData.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages?.[0];
      const statuses = value?.statuses?.[0];

      if (statuses) {
        normalizedData = {
          type: "status_update",
          messageId: statuses.id,
          status: statuses.status,
          timestamp: new Date(statuses.timestamp * 1000),
        };
      } else if (messages) {
        const contacts = value?.contacts?.[0];
        normalizedData = {
          type: "message",
          phone: messages.from,
          contactName: contacts?.profile?.name || messages.from,
          isGroup: false,
          isFromMe: false,
          messageType: messages.type,
          text: messages.text?.body || "",
          mediaUrl: messages.image?.id || messages.video?.id || messages.audio?.id || messages.document?.id || "",
          fileName: messages.document?.filename || "",
          caption: messages.image?.caption || messages.video?.caption || messages.document?.caption || "",
          messageId: messages.id,
          timestamp: new Date(Number(messages.timestamp) * 1000),
        };
      }
    } else if (apiProvider === "evolution") {
      if (event === "messages.upsert" || event === "MESSAGES_UPSERT") {
        const data = webhookData.data;
        const message = data?.message;
        const key = message?.key;

        normalizedData = {
          type: "message",
          phone: key?.remoteJid,
          contactName: message?.pushName || key?.remoteJid,
          isGroup: key?.remoteJid?.includes("@g.us"),
          isFromMe: key?.fromMe,
          messageType: Object.keys(message?.message || {})[0] || "text",
          text: message?.message?.conversation || message?.message?.extendedTextMessage?.text || "",
          messageId: key?.id,
          timestamp: message?.messageTimestamp ? new Date(Number(message.messageTimestamp) * 1000) : new Date(),
        };
      } else if (event === "messages.update" || event === "MESSAGES_UPDATE") {
        const data = webhookData.data;
        normalizedData = {
          type: "status_update",
          messageId: data?.key?.id,
          status: data?.update?.status,
          timestamp: new Date(),
        };
      }
    }

    // Processar dados normalizados (se houver)
    if (normalizedData) {
      if (normalizedData.type === "message") {
        if (!clientId) {
          console.error("Client ID não encontrado, não é possível processar mensagem");
          return new Response(JSON.stringify({ success: false, error: "Client ID not found" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }

        const phone = String(normalizedData.phone || "").replace(/@(s\.whatsapp\.net|c\.us|g\.us)$/, "");

        // Criar/atualizar contato
        const { data: existingContact } = await supabase
          .from("contacts")
          .select("id")
          .eq("client_id", clientId)
          .eq("phone", phone)
          .maybeSingle();

        if (!existingContact) {
          const { error: contactError } = await supabase.from("contacts").insert({
            client_id: clientId,
            phone: phone,
            name: normalizedData.contactName,
            is_group: normalizedData.isGroup,
            instance_id: instanceId,
          });
          if (contactError) console.error("Erro ao criar contato:", contactError);
        }

        const { data: contact } = await supabase
          .from("contacts")
          .select("id")
          .eq("client_id", clientId)
          .eq("phone", phone)
          .single();

        if (contact) {
          const { error: messageError } = await supabase.from("messages").insert({
            client_id: clientId,
            contact_id: contact.id,
            text: normalizedData.text,
            from_me: normalizedData.isFromMe,
            type: normalizedData.messageType,
            media_url: normalizedData.mediaUrl,
            file_name: normalizedData.fileName,
            caption: normalizedData.caption,
            message_id: normalizedData.messageId,
            timestamp: normalizedData.timestamp,
            status: "sent",
          });

          if (messageError) console.error("Erro ao salvar mensagem:", messageError);
          else console.log(`Mensagem (${apiProvider}) salva com sucesso`);

          // Cancelar pre_followup quando lead responde
          if (!normalizedData.isFromMe && contact) {
            try {
              const { data: pendingPreFollowups } = await supabase
                .from("pre_followup")
                .select("id, agent_id, created_at")
                .eq("remote_jid", phone + "@s.whatsapp.net")
                .eq("client_id", clientId)
                .eq("status", "pending")
                .limit(5);

              if (pendingPreFollowups && pendingPreFollowups.length > 0) {
                const now = new Date().toISOString();
                const { error: deleteError } = await supabase
                  .from("pre_followup")
                  .delete()
                  .eq("remote_jid", phone + "@s.whatsapp.net")
                  .eq("client_id", clientId)
                  .eq("status", "pending");

                if (deleteError) console.error("[PreFollowup] ⚠️ Erro ao deletar:", deleteError);
                else {
                  console.log(
                    `[PreFollowup] ✅ ${pendingPreFollowups.length} registro(s) DELETADO(S) - Lead respondeu`,
                  );
                  for (const pf of pendingPreFollowups) {
                    const { data: conv } = await supabase
                      .from("agent_conversations")
                      .select("id")
                      .eq("agent_id", pf.agent_id)
                      .eq("remote_jid", phone + "@s.whatsapp.net")
                      .maybeSingle();
                    if (conv) {
                      await supabase.from("followup_history").insert({
                        conversation_id: conv.id,
                        client_id: clientId,
                        event_type: "user_responded",
                        metadata: {
                          pre_followup_id: pf.id,
                          response_time_seconds: Math.floor(
                            (new Date(now).getTime() - new Date(pf.created_at).getTime()) / 1000,
                          ),
                        },
                      });
                    }
                  }
                }
              }
            } catch (error) {
              console.error("[PreFollowup] ⚠️ Exceção ao cancelar:", error);
            }
          }
        }
      } else if (normalizedData.type === "status_update") {
        const { error: updateError } = await supabase
          .from("messages")
          .update({ status: normalizedData.status })
          .eq("message_id", normalizedData.messageId);
        if (updateError) console.error("Erro ao atualizar status:", updateError);
        else console.log(`Status atualizado (${apiProvider}): ${normalizedData.messageId} ${normalizedData.status}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== Formato UAZAP =====
    if (event === "messages" && webhookData.message) {
      const raw = webhookData.message;

      const wasSentViaAPI = checkIfSentViaAPI(raw.messageid, raw.source, raw.track_source);
      const isFromMe = Boolean(raw.fromMe);

      if (isFromMe) {
        console.log(
          `ℹ️ fromMe=true detectado no UAZAP -> não enviaremos para o webhook/AI, mas vamos registrar no banco.`,
        );
        // segue para persistência apenas
      }

      const messageTrackSource = raw.track_source || "";
      const isJuliaN8nResponse = messageTrackSource === "julia-n8n";
      if (isJuliaN8nResponse) {
        console.log(
          `⚠️ Mensagem ignorada: track_source="${messageTrackSource}" -> Resposta do Julia via n8n (NÃO reenviar)`,
        );
      }

      // BLOQUEIO: não processa se foi via API, se é fromMe, ou se veio do julia-n8n
      let shouldProcessForAgents = !wasSentViaAPI && !isFromMe;
      if (isJuliaN8nResponse) shouldProcessForAgents = false;

      console.log(
        `[Webhook] fromMe=${isFromMe}, wasSentViaAPI=${wasSentViaAPI}, track_source="${messageTrackSource}", shouldProcessForAgents=${shouldProcessForAgents}`,
      );

      const isGroup = Boolean(raw.isGroup || raw.chatid?.endsWith("@g.us"));

      // Determinar phone
      let phone = "";
      if (isGroup) {
        phone = String(raw.chatid || "").replace(/@g\.us$/, "");
      } else if (isFromMe) {
        phone = String(raw.chatid || "").replace(/@(s\.whatsapp\.net|c\.us)$/, "");
      } else {
        phone = String(raw.sender_pn || raw.sender || "").replace(/@(s\.whatsapp\.net|c\.us)$/, "");
      }

      const contactName = isGroup
        ? raw.groupName || webhookData.chat?.wa_name || phone
        : webhookData.chat?.wa_contactName || webhookData.chat?.wa_name || raw.senderName || phone;

      // CTWA tracking (logs)
      const ctwaData = raw.extendedTextMessage?.contextInfo || {};
      const entryPoint = ctwaData.entryPointConversionApp;
      const ctwaPayload = ctwaData.ctwaPayload;
      const trackId = raw.track_id;
      if (entryPoint && !isGroup && !isFromMe) {
        console.log(`📊 CTWA detectado: entryPoint=${entryPoint}, payload=${ctwaPayload ? "presente" : "ausente"}`);
      }

      // Tipo da mensagem
      let messageType = "text";
      let locationData: any = null;

      const msgId = raw.messageid || raw.id || raw.key?.id;
      const mediaUrl = raw.media_url || raw.mediaUrl || raw.url || raw.content?.URL || null;
      const fileName = raw.fileName || raw.filename || null;
      const caption = raw.caption || null;

      if (raw.messageType === "AudioMessage" || raw.mediaType === "ptt" || raw.mediaType === "audio") {
        messageType = "audio";
      } else if (raw.messageType === "ImageMessage" || raw.mediaType === "image") {
        messageType = "image";
      } else if (raw.messageType === "VideoMessage" || raw.mediaType === "video") {
        messageType = "video";
      } else if (raw.messageType === "DocumentMessage" || raw.mediaType === "document") {
        messageType = "document";
      } else if (
        raw.messageType === "LocationMessage" ||
        raw.content?.locationMessage ||
        raw.latitude ||
        raw.longitude
      ) {
        messageType = "location";
        const locMsg = raw.content?.locationMessage || raw;
        locationData = {
          latitude: locMsg.latitude || locMsg.degreesLatitude,
          longitude: locMsg.longitude || locMsg.degreesLongitude,
          name: locMsg.name || "Localização compartilhada",
          address: locMsg.address || "",
        };
      } else if (raw.messageType === "ButtonsMessage" || raw.content?.buttonsMessage) {
        messageType = "buttons";
      } else if (raw.messageType === "ListMessage" || raw.content?.listMessage) {
        messageType = "list";
      } else if (raw.messageType === "TemplateButtonReplyMessage" || raw.content?.templateButtonReplyMessage) {
        messageType = "button_reply";
      } else if (raw.type && raw.type !== "media") {
        messageType = String(raw.type).toLowerCase();
      }

      // Texto da mensagem
      let messageText = raw.text || raw.content?.text || "";
      if (messageType === "location") {
        messageText = locationData?.name || "Localização compartilhada";
      } else if (raw.content?.buttonsMessage) {
        messageText = raw.content.buttonsMessage.contentText || messageText;
      } else if (raw.content?.listMessage) {
        messageText = raw.content.listMessage.description || messageText;
      } else if (raw.content?.templateButtonReplyMessage) {
        messageText = raw.content.templateButtonReplyMessage.selectedDisplayText || messageText;
      } else if (raw.content?.extendedTextMessage) {
        messageText = raw.content.extendedTextMessage.text || messageText;
      }

      // Info de reply
      let quotedMessage: any = null;
      const quotedId =
        raw.quoted || raw.content?.extendedTextMessage?.contextInfo?.stanzaId || raw.content?.contextInfo?.stanzaId;
      if (quotedId || raw.content?.extendedTextMessage?.contextInfo) {
        const contextInfo = raw.content?.extendedTextMessage?.contextInfo || raw.content?.contextInfo;
        quotedMessage = {
          text:
            contextInfo?.quotedMessage?.conversation ||
            contextInfo?.quotedMessage?.extendedTextMessage?.text ||
            contextInfo?.quotedMessage?.imageMessage?.caption ||
            "",
          type: contextInfo?.quotedMessage ? Object.keys(contextInfo.quotedMessage)[0] : undefined,
          senderName: contextInfo?.participant ? "Participante" : undefined,
        };
      }

      // Dados de botões
      let buttonsData: any = null;
      if (raw.content?.buttonsMessage) {
        buttonsData = {
          buttons: raw.content.buttonsMessage.buttons?.map((btn: any) => ({
            id: btn.buttonId || btn.id,
            text: btn.buttonText?.displayText || btn.text,
          })),
        };
      } else if (raw.content?.listMessage) {
        buttonsData = {
          listTitle: raw.content.listMessage.title,
          listDescription: raw.content.listMessage.description,
          listSections: raw.content.listMessage.sections?.map((section: any) => ({
            title: section.title,
            rows: section.rows?.map((row: any) => ({
              id: row.rowId,
              title: row.title,
              description: row.description,
            })),
          })),
        };
      } else if (raw.content?.templateButtonReplyMessage) {
        buttonsData = {
          buttons: [
            {
              id: raw.content.templateButtonReplyMessage.selectedId,
              text: raw.content.templateButtonReplyMessage.selectedDisplayText,
            },
          ],
        };
      }

      console.log("📋 Processando (uazap):", {
        phone,
        contactName,
        isGroup,
        isFromMe,
        messageType,
        hasText: Boolean(messageText),
        hasMedia: Boolean(mediaUrl),
        hasButtons: Boolean(buttonsData),
      });

      // ===== FALLBACK POR TELEFONE SE CLIENT_ID NÃO RESOLVIDO =====
      if (!clientId) {
        console.warn("⚠️ clientId não resolvido por instância, tentando fallback por telefone...");
        const { data: phoneContacts, error: phoneErr } = await supabase
          .from("contacts")
          .select("id, client_id, phone")
          .eq("phone", phone)
          .limit(2);
        if (phoneErr) console.error("❌ Erro ao buscar contato por telefone:", phoneErr);
        else if (phoneContacts && phoneContacts.length === 1) {
          clientId = phoneContacts[0].client_id;
          resolutionMethod = "phone_fallback";
          console.log(`✅ clientId resolvido por telefone: ${clientId}`);
        } else if (phoneContacts && phoneContacts.length > 1) {
          console.error(
            `❌ Múltiplos contatos (${phoneContacts.length}) com telefone ${phone}, impossível resolver client_id`,
          );
        } else {
          console.error(`❌ Nenhum contato encontrado com telefone ${phone}`);
        }
      }

      if (!clientId) {
        console.error("❌ CRÍTICO: clientId não resolvido após todas tentativas. Abortando inserção.");
        console.error("📊 Debug info:", {
          phone,
          instanceToken,
          resolutionMethod,
          webhookDataKeys: Object.keys(webhookData),
        });
        try {
          await supabase.from("webhook_logs").insert({
            event_type: webhookData.EventType || webhookData.event || "unknown",
            provider: apiProvider,
            instance_token: instanceToken,
            resolved_client_id: null,
            resolved_instance_id: instanceId,
            resolution_method: resolutionMethod,
            phone,
            remote_jid: phone ? `${phone}@s.whatsapp.net` : null,
            contact_name: contactName,
            message_type: messageType,
            is_from_me: isFromMe,
            is_group: isGroup,
            request_headers: requestHeaders,
            request_body: webhookData,
            processing_status: "failed",
            error_message: "clientId não resolvido após todas tentativas",
            processing_time_ms: Date.now() - startTime,
          });
        } catch (logError) {
          console.error("Erro ao inserir log:", logError);
        }
        return new Response(
          JSON.stringify({
            success: false,
            error: "client_id_unresolved",
            message: "Não foi possível resolver o client_id para esta mensagem",
            debug: { phone, resolutionMethod, instanceToken },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        );
      }

      // Contato
      const { data: existingContact2 } = await supabase
        .from("contacts")
        .select("id")
        .eq("phone", phone)
        .eq("client_id", clientId)
        .maybeSingle();

      let contactId = existingContact2?.id;
      if (!contactId) {
        const { data: newContact, error: contactError } = await supabase
          .from("contacts")
          .insert({
            phone,
            name: contactName,
            status: isGroup ? "Grupo" : "Contato",
            client_id: clientId,
            is_group: isGroup,
            instance_id: instanceId,
          })
          .select("id")
          .single();
        if (contactError) {
          console.error("❌ Erro ao criar contato (uazap):", contactError);
        } else {
          contactId = newContact?.id;
          console.log("✅ Contato (uazap) criado:", contactId);
        }
      } else {
        await supabase.from("contacts").update({ name: contactName, instance_id: instanceId }).eq("id", contactId);
      }

      if (contactId) {
        const tsMs = Number(raw.messageTimestamp);
        const ts = Number.isFinite(tsMs) ? new Date(tsMs) : new Date();

        // Metadata completo
        let metadata: any = {};
        if (raw.content) {
          metadata = {
            ...metadata,
            ...raw.content,
            URL: raw.content.URL && !raw.content.URL.includes(".enc") ? raw.content.URL : undefined,
          };
        }
        if (buttonsData) metadata = { ...metadata, ...buttonsData };

        if (quotedMessage) metadata.quotedMessage = quotedMessage;

        if (messageType === "location" && raw.content?.locationMessage) {
          metadata = { ...metadata, ...locationData };
        }

        const messageStatus = isFromMe ? "sent" : "delivered";

        const messageData: any = {
          contact_id: contactId,
          message_id: msgId,
          text: messageText,
          type: messageType || "text",
          from_me: isFromMe,
          status: messageStatus,
          timestamp: ts,
          client_id: clientId,
          media_url: mediaUrl,
          file_name: fileName,
          caption: caption,
          reply_to: quotedId,
          metadata: Object.keys(metadata).length > 0 ? metadata : null,
        };

        console.log("💾 Inserindo mensagem com status:", messageStatus);
        const { error: messageError } = await supabase.from("messages").insert(messageData);
        if (messageError) console.error("❌ Erro ao salvar msg (uazap):", messageError);
        else console.log("✅ Mensagem (uazap) salva com sucesso");

        // === PRE-FOLLOWUP: quando a mensagem é ENVIADA pelo agente (fromMe=true) ===
        // Critério: não é grupo, é fromMe, e a origem sugere que foi um agente/automação (ex: julia-n8n ou source != android/ios/web)
        if (!isGroup && isFromMe) {
          try {
            const src = (raw.source || "").toLowerCase();
            const manualSources = ["android", "ios", "web"];
            const byAgentOrAutomation = raw.track_source === "julia-n8n" || !manualSources.includes(src);

            if (byAgentOrAutomation) {
              const remoteJidNormalized = (raw.chatid || phone).includes("@")
                ? (raw.chatid as string)
                : `${phone}@s.whatsapp.net`;

              // Pega a conversa ativa para descobrir qual agente está vinculado a esse lead
              const { data: conv } = await supabase
                .from("agent_conversations")
                .select("id, agent_id")
                .eq("client_id", clientId)
                .eq("remote_jid", remoteJidNormalized)
                .maybeSingle();

              // Se não achar conversa, ainda assim tentamos criar a conversa para vincular o pre_followup
              let convId = conv?.id;
              if (!convId && conv?.agent_id) {
                const { data: newConv, error: newConvErr } = await supabase
                  .from('agent_conversations')
                  .insert({
                    agent_id: conv.agent_id,
                    client_id: clientId,
                    remote_jid: remoteJidNormalized,
                    messages: [],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .select('id')
                  .single();
                if (!newConvErr) convId = newConv.id;
              }

              const preFollowupPayload: any = {
                client_id: clientId,
                agent_id: conv?.agent_id,
                remote_jid: remoteJidNormalized,
                status: 'pending',
                agent_message_sent_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
              };

              if (convId) preFollowupPayload.conversation_id = convId;
              if (messageText) preFollowupPayload.agent_message_content = messageText.substring(0, 500);

              const { error: pfErr } = await supabase.from('pre_followup').insert(preFollowupPayload);
              if (pfErr) {
                console.error('[PreFollowup] erro ao inserir registro:', pfErr, preFollowupPayload);
              } else {
                console.log('[PreFollowup] registro criado (aguardando follow-up):', {
                  remoteJid: remoteJidNormalized,
                  agent_id: conv?.agent_id || null,
                  conversation_id: convId || null
                });
              }
            } else {
              console.log("[PreFollowup] mensagem fromMe foi manual (app/whatsapp); não cria pre_followup.");
            }
          } catch (e) {
            console.error("[PreFollowup] exceção ao inserir:", e);
          }
        }

        // Cancelar pre_followup quando lead responde
        if (!isFromMe && contactId && !isGroup) {
          try {
            const remoteJidNormalized = (raw.chatid || phone).includes("@")
              ? raw.chatid || phone
              : phone + "@s.whatsapp.net";

            const { data: pendingPreFollowups } = await supabase
              .from("pre_followup")
              .select("id, agent_id, created_at")
              .eq("remote_jid", remoteJidNormalized)
              .eq("client_id", clientId)
              .eq("status", "pending")
              .limit(5);

            if (pendingPreFollowups && pendingPreFollowups.length > 0) {
              const now = new Date().toISOString();
              const { error: deleteError } = await supabase
                .from("pre_followup")
                .delete()
                .eq("remote_jid", remoteJidNormalized)
                .eq("client_id", clientId)
                .eq("status", "pending");
              if (deleteError) console.error("[PreFollowup] ⚠️ Erro ao deletar (UAZAP):", deleteError);
              else {
                console.log(
                  `[PreFollowup] ✅ ${pendingPreFollowups.length} registro(s) DELETADO(S) - Lead respondeu (UAZAP)`,
                );
                for (const pf of pendingPreFollowups) {
                  const { data: conv } = await supabase
                    .from("agent_conversations")
                    .select("id")
                    .eq("agent_id", pf.agent_id)
                    .eq("remote_jid", remoteJidNormalized)
                    .maybeSingle();
                  if (conv) {
                    await supabase.from("followup_history").insert({
                      conversation_id: conv.id,
                      client_id: clientId,
                      event_type: "user_responded",
                      metadata: {
                        pre_followup_id: pf.id,
                        response_time_seconds: Math.floor(
                          (new Date(now).getTime() - new Date(pf.created_at).getTime()) / 1000,
                        ),
                      },
                    });
                  }
                }
              }
            }
          } catch (error) {
            console.error("[PreFollowup] ⚠️ Exceção ao cancelar (UAZAP):", error);
          }
        }

        // 🔄 COMANDO DE RESET
        if (!isGroup && !isFromMe && messageText?.trim().toLowerCase() === "#recomecar") {
          console.log("\n🔄 === COMANDO #RECOMECAR DETECTADO ===");
          const { data: conversations, error: convError } = await supabase
            .from("agent_conversations")
            .select("id, agent_id")
            .eq("client_id", clientId)
            .eq("remote_jid", raw.chatid || phone);
          if (convError) console.error("❌ Erro ao buscar conversas:", convError);
          else if (conversations && conversations.length > 0) {
            console.log(`📋 Encontradas ${conversations.length} conversa(s) para resetar`);
            for (const conv of conversations) {
              await supabase.from("agent_conversation_messages").delete().eq("conversation_id", conv.id);
              const { error: resetError } = await supabase
                .from("agent_conversations")
                .update({
                  messages: [],
                  metadata: {},
                  last_message_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq("id", conv.id);
              if (resetError) console.error(`❌ Erro ao resetar conversa ${conv.id}:`, resetError);
              else console.log(`✅ Conversa ${conv.id} resetada`);
            }
            console.log("✅ Histórico de conversa(s) resetado com sucesso!");
            await supabase.from("messages").insert({
              contact_id: contactId,
              text: "Conversa reiniciada com sucesso! 🔄",
              type: "system_notification",
              from_me: false,
              status: "read",
              timestamp: new Date().toISOString(),
              client_id: clientId,
              metadata: { notificationType: "conversation_reset" },
            });
          } else {
            console.log("ℹ️ Nenhuma conversa ativa encontrada para este contato");
          }
          return new Response(JSON.stringify({ success: true, message: "Reset processed" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // 📩 LEAD RESPONDE -> mover para "RESPONDERAM"
        if (!isGroup && !isFromMe && contactId) {
          console.log("\n📩 === VERIFICANDO FOLLOW-UP ATIVO ===");
          const { data: activeConversation } = await supabase
            .from("agent_conversations")
            .select("id")
            .eq("client_id", clientId)
            .eq("remote_jid", raw.chatid || phone)
            .maybeSingle();

          if (activeConversation) {
            const { data: anyFollowupHistory } = await supabase
              .from("followup_history")
              .select("id")
              .eq("conversation_id", activeConversation.id)
              .limit(1);

            if (anyFollowupHistory && anyFollowupHistory.length > 0) {
              await supabase.from("followup_history").insert({
                conversation_id: activeConversation.id,
                client_id: clientId,
                event_type: "user_responded",
                metadata: { message_text: messageText, responded_at: new Date().toISOString() },
              });
              console.log(`🟢 Lead respondeu - registrado no histórico (move para RESPONDERAM)`);
            }

            const { data: pendingExecutions } = await supabase
              .from("followup_executions")
              .select("id, config_id")
              .eq("conversation_id", activeConversation.id)
              .in("status", ["scheduled", "pending"]);
            if (pendingExecutions && pendingExecutions.length > 0) {
              console.log(`✅ Cancelando ${pendingExecutions.length} follow-up(s) pendente(s)`);
              await supabase
                .from("followup_executions")
                .update({ status: "cancelled" })
                .eq("conversation_id", activeConversation.id)
                .in("status", ["scheduled", "pending"]);
            }
          }
        }

        // ✅ PROCESSAMENTO DE AGENTES
        console.log(`\n🔍 === VERIFICAÇÃO DE PROCESSAMENTO ===`);
        console.log(`isGroup: ${isGroup}`);
        console.log(`contactId: ${contactId}`);
        console.log(`shouldProcessForAgents: ${shouldProcessForAgents}`);
        console.log(
          `Condição: !isGroup=${!isGroup} && contactId=${!!contactId} && shouldProcessForAgents=${shouldProcessForAgents}`,
        );

        if (!isGroup && contactId && shouldProcessForAgents) {
          console.log("\n🤖 === PROCESSANDO AGENTES ===");
          console.log("Tipo de mensagem:", isFromMe ? "ENVIADA MANUALMENTE (chat)" : "RECEBIDA");
          console.log("wasSentViaAPI:", wasSentViaAPI, "-> processamento:", shouldProcessForAgents ? "SIM" : "NÃO");

          const eligibleAgents = await getEligibleJuliaAgents(supabase, instanceId);
          console.log(`📋 Agentes elegíveis encontrados: ${eligibleAgents.length}`);

          let sentCount = 0;
          let failureCount = 0;

          for (const agent of eligibleAgents) {
            console.log(`\n🎯 Processando agente: ${agent.name} (tipo: ${agent.agent_type})`);

            const { data: conversation } = await supabase
              .from("agent_conversations")
              .select("id, is_paused")
              .eq("agent_id", agent.id)
              .eq("remote_jid", raw.chatid || phone)
              .eq("client_id", agent.client_id)
              .single();

            const isPausedGlobally = agent.is_paused_globally;
            const isPausedIndividually = conversation?.is_paused || false;
            if (isPausedGlobally) {
              console.log(`⏸️ AGENTE PAUSADO GLOBALMENTE - Não enviará para webhook/AI`);
              continue;
            }
            if (isPausedIndividually) {
              console.log(`⏸️ CONVERSA PAUSADA - Não enviará para webhook/AI`);
              continue;
            }

            // Frases de início (opcional)
            const startConfig = agent.start_conversation_phrases as {
              enabled?: boolean;
              match_type?: "contains" | "equals";
              phrases?: string[];
            } | null;

            if (startConfig?.enabled && startConfig.phrases && startConfig.phrases.length > 0) {
              const { data: messageHistory } = await supabase
                .from("agent_conversation_messages")
                .select("id")
                .eq("conversation_id", conversation?.id || "")
                .eq("role", "user")
                .limit(1);
              const isFirstUserMessage = !messageHistory || messageHistory.length === 0;

              if (isFirstUserMessage && !isFromMe) {
                const messageToCheck = (messageText || "").toLowerCase().trim();
                let matchFound = false;
                for (const phrase of startConfig.phrases) {
                  const phraseNormalized = phrase.toLowerCase().trim();
                  if (startConfig.match_type === "equals") {
                    if (messageToCheck === phraseNormalized) {
                      matchFound = true;
                      break;
                    }
                  } else {
                    if (messageToCheck.includes(phraseNormalized)) {
                      matchFound = true;
                      break;
                    }
                  }
                }
                if (!matchFound) {
                  console.log(
                    `⚠️ PRIMEIRA MENSAGEM NÃO CORRESPONDE - Frases exigidas: ${startConfig.phrases.join(", ")}`,
                  );
                  console.log(`   Tipo: ${startConfig.match_type}, Mensagem recebida: "${messageToCheck}"`);
                  continue;
                } else {
                  console.log(`✅ Primeira mensagem corresponde à frase de início!`);
                }
              }
            }

            try {
              if (agent.agent_type === "julia") {
                if (isJuliaN8nResponse) {
                  console.log('⛔ track_source="julia-n8n" -> não enviar para webhook (skip)');
                  continue;
                }

                console.log(`📤 Enviando para Julia: ${agent.selected_julia_code}`);
                const juliaJSON = buildJuliaJSON(
                  { text: messageText, type: messageType, from_me: isFromMe, message_id: msgId, media_url: mediaUrl },
                  agent,
                  phone,
                );
                console.log("📤 JSON gerado:", JSON.stringify(juliaJSON, null, 2));

                const success = await sendToWebhook(juliaJSON);
                await saveJuliaQueueLog(supabase, agent, juliaJSON, success, null);

                if (success) {
                  // 🔔 Inserir pre_followup após envio bem-sucedido
                  await queuePreFollowup(supabase, {
                    clientId: agent.client_id,
                    agentId: agent.id,
                    remoteJid: raw.chatid || phone,
                    messageId: msgId,
                    messageText,
                  });

                  console.log(`✅ Agente Julia ${agent.name} processado com sucesso`);
                  sentCount++;
                } else {
                  console.log(`❌ Falha ao enviar para agente Julia ${agent.name}`);
                  failureCount++;
                }
              } else if (agent.agent_type === "custom") {
                console.log(`🤖 Enviando para AI Agent Handler: ${agent.name}`);
                const { error: aiError } = await supabase.functions.invoke("ai-agent-handler", {
                  body: {
                    agent_id: agent.id,
                    contact_phone: phone,
                    message_text: messageText,
                    message_type: messageType,
                    remote_jid: raw.chatid || phone,
                    instance_data: agent.whatsapp_instances,
                  },
                });
                if (aiError) throw aiError;

                // 🔔 Inserir pre_followup após envio bem-sucedido
                await queuePreFollowup(supabase, {
                  clientId: agent.client_id,
                  agentId: agent.id,
                  remoteJid: raw.chatid || phone,
                  messageId: msgId,
                  messageText,
                });

                console.log(`✅ Agente Custom ${agent.name} processado com sucesso`);
                sentCount++;
              }
            } catch (error) {
              console.error(`❌ Erro ao processar agente ${agent.name}:`, error);
              const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
              if (agent.agent_type === "julia") {
                const juliaJSON = buildJuliaJSON(
                  { text: messageText, type: messageType, from_me: isFromMe, message_id: msgId, media_url: mediaUrl },
                  agent,
                  phone,
                );
                await saveJuliaQueueLog(supabase, agent, juliaJSON, false, errorMsg);
              }
              failureCount++;
            }
          }

          console.log("\n📊 === ESTATÍSTICAS ===");
          console.log("Instância:", instanceId);
          console.log("Mensagem de grupo?", isGroup);
          console.log("Enviada por mim?", isFromMe);
          console.log("Agentes elegíveis:", eligibleAgents.length);
          console.log("JSONs enviados:", sentCount);
          console.log("Falhas:", failureCount);

          if (contactId && msgId) {
            await supabase
              .from("julia_queue_logs")
              .update({ contact_id: contactId })
              .eq("message_id", msgId)
              .is("contact_id", null);
          }
        }
      }
    }

    // ===== Outras formas (baileys etc) =====
    if (event === "messages.upsert" || webhookData.messages) {
      const messages = webhookData.messages || [webhookData.message];
      for (const msg of messages) {
        if (!msg) continue;
        const from = msg.key?.remoteJid || msg.from || msg.participant;
        const phone = String(from || "").replace(/@(s\.whatsapp\.net|g\.us)$/, "");
        const isFromMe = msg.key?.fromMe || msg.fromMe || false;

        const messageType = msg.message?.conversation
          ? "text"
          : msg.message?.imageMessage
            ? "image"
            : msg.message?.videoMessage
              ? "video"
              : msg.message?.documentMessage
                ? "document"
                : msg.message?.audioMessage
                  ? "audio"
                  : msg.message?.ptt
                    ? "audio"
                    : "text";

        let messageText = "";
        if (msg.message?.conversation) messageText = msg.message.conversation;
        else if (msg.message?.extendedTextMessage?.text) messageText = msg.message.extendedTextMessage.text;
        else if (msg.message?.imageMessage?.caption) messageText = msg.message.imageMessage.caption;
        else if (msg.message?.videoMessage?.caption) messageText = msg.message.videoMessage.caption;
        else if (msg.text) messageText = msg.text;

        let mediaUrl: string | null = null;
        let fileName: string | null = null;
        if (msg.message?.imageMessage?.url) mediaUrl = msg.message.imageMessage.url;
        else if (msg.message?.videoMessage?.url) mediaUrl = msg.message.videoMessage.url;
        else if (msg.message?.audioMessage?.url) mediaUrl = msg.message.audioMessage.url;
        else if (msg.message?.documentMessage?.url) {
          mediaUrl = msg.message.documentMessage.url;
          fileName = msg.message.documentMessage.fileName;
        }

        const contactName = msg.pushName || msg.notifyName || phone;
        console.log("Processando mensagem:", { phone, contactName, messageText, isFromMe, messageType });

        const { data: existingContact } = await supabase.from("contacts").select("id").eq("phone", phone).single();
        let contactId = existingContact?.id;

        const isGroup = String(from || "").endsWith("@g.us");

        if (!contactId) {
          const { data: newContact, error: contactError } = await supabase
            .from("contacts")
            .insert({
              phone,
              name: contactName,
              status: "Novo contato",
              client_id: clientId,
              is_group: isGroup,
            })
            .select("id")
            .single();
          if (contactError) {
            console.error("Erro ao criar contato:", contactError);
            continue;
          }
          contactId = newContact.id;
          console.log("Contato criado:", contactId);
        } else {
          await supabase.from("contacts").update({ name: contactName }).eq("id", contactId);
        }

        const { error: messageError } = await supabase.from("messages").insert({
          contact_id: contactId,
          message_id: msg.key?.id || msg.id,
          text: messageText,
          type: messageType,
          from_me: isFromMe,
          status: "delivered",
          timestamp: new Date(msg.messageTimestamp ? msg.messageTimestamp * 1000 : Date.now()),
          client_id: clientId,
          media_url: mediaUrl,
          file_name: fileName,
        });
        if (messageError) console.error("Erro ao salvar mensagem:", messageError);
        else console.log("Mensagem salva com sucesso");
      }
    }

    // Status updates
    if (event === "messages.update" || webhookData.update) {
      const updates = webhookData.update || [webhookData];
      for (const update of updates) {
        const messageId = update.key?.id;
        const status = update.status || update.update?.status;
        if (messageId && status) {
          await supabase.from("messages").update({ status }).eq("message_id", messageId);
          console.log("Status atualizado (baileys):", messageId, status);
        }
      }
    }

    // Uazap ReadReceipt/Receipt
    if (
      webhookData.EventType === "messages_update" &&
      (webhookData.type === "ReadReceipt" || webhookData.type === "Receipt")
    ) {
      const ids = webhookData.event?.MessageIDs || webhookData.MessageIDs || [];
      const state = webhookData.state || webhookData.event?.state || "";
      let newStatus = "";
      switch ((state || "").toLowerCase()) {
        case "sent":
          newStatus = "sent";
          break;
        case "delivered":
          newStatus = "delivered";
          break;
        case "read":
        case "viewed":
          newStatus = "read";
          break;
        default:
          newStatus = "";
      }

      if (newStatus && Array.isArray(ids) && ids.length > 0) {
        for (const id of ids) {
          await supabase.from("messages").update({ status: newStatus }).eq("message_id", id);
          console.log("Status atualizado (uazap):", id, newStatus);
        }
      }
    }

    // Log success
    try {
      const logData: any = {
        event_type: webhookData.EventType || webhookData.event || "unknown",
        provider: apiProvider,
        instance_token: instanceToken,
        resolved_client_id: clientId,
        resolved_instance_id: instanceId,
        resolution_method: resolutionMethod,
        phone: webhookData.message?.sender || webhookData.message?.sender_pn || null,
        remote_jid: webhookData.message?.chatid || null,
        contact_name: webhookData.chat?.name || webhookData.chat?.wa_name || null,
        message_type: webhookData.message?.messageType || webhookData.message?.type || null,
        is_from_me: webhookData.message?.fromMe || false,
        is_group: webhookData.chat?.wa_isGroup || webhookData.message?.isGroup || false,
        request_headers: requestHeaders,
        request_body: webhookData,
        processing_status: "success",
        processing_time_ms: Date.now() - startTime,
      };
      await supabase.from("webhook_logs").insert(logData);
    } catch (logError) {
      console.error("Erro ao inserir log de sucesso:", logError);
    }

    return new Response(JSON.stringify({ success: true, message: "Webhook processado com sucesso" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Erro no webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    const errorDetails = error instanceof Error ? error.toString() : String(error);

    return new Response(JSON.stringify({ success: false, error: errorMessage, details: errorDetails }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
