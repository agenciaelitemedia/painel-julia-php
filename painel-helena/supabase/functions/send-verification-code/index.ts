import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  request_id: string;
  verification_code: string;
  tracking_token: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: RequestBody = await req.json();

    // Buscar dados do pedido
    const { data: request, error: requestError } = await supabaseClient
      .from('subscription_requests')
      .select('*, subscription_plans(*)')
      .eq('id', body.request_id)
      .single();

    if (requestError || !request) {
      console.error('Pedido não encontrado:', requestError);
      return new Response(
        JSON.stringify({ error: 'Pedido não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar conexão de notificação padrão com fallback
    let adminInstance: any = null;
    
    // 1. Tentar buscar a conexão padrão
    const { data: defaultInstance, error: defaultError } = await supabaseClient
      .from('whatsapp_instances')
      .select('*')
      .eq('is_default_notification', true)
      .eq('is_notifications', true)
      .eq('status', 'connected')
      .maybeSingle();

    if (defaultError) {
      console.error('Erro ao buscar conexão padrão:', defaultError);
    }

    if (defaultInstance) {
      adminInstance = defaultInstance;
      console.log('✅ Usando conexão padrão de notificação:', defaultInstance.instance_name);
    } else {
      // 2. Fallback: buscar qualquer conexão habilitada para notificações
      console.log('⚠️ Conexão padrão não encontrada, tentando alternativas...');
      
      const { data: alternativeInstances, error: altError } = await supabaseClient
        .from('whatsapp_instances')
        .select('*')
        .eq('is_notifications', true)
        .eq('status', 'connected')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (altError) {
        console.error('Erro ao buscar conexões alternativas:', altError);
      }

      if (alternativeInstances && alternativeInstances.length > 0) {
        adminInstance = alternativeInstances[0];
        console.log('✅ Usando conexão alternativa:', adminInstance.instance_name);
      }
    }

    if (!adminInstance) {
      console.error('❌ Nenhuma conexão de notificação disponível');
      return new Response(
        JSON.stringify({ error: 'Nenhuma conexão WhatsApp habilitada para notificações' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminToken = adminInstance.api_token;
    const adminApiUrl = adminInstance.api_url;

    console.log('Usando instância admin:', adminInstance.instance_name, '- API URL:', adminApiUrl);

    // Definir/atualizar código a ser enviado
    const codeToSend = (body.verification_code && body.verification_code.trim()) ? body.verification_code.trim() : (request.verification_code || '');
    if (body.verification_code && body.verification_code.trim() && body.verification_code !== request.verification_code) {
      await supabaseClient
        .from('subscription_requests')
        .update({
          verification_code: codeToSend,
          verification_sent_at: new Date().toISOString(),
          verification_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        })
        .eq('id', body.request_id);
    }

    // Preparar mensagem SEM a URL de rastreamento
    const message = `🔐 Código de Verificação - Julia IA

Olá ${request.full_name}!

Seu código de verificação é: *${codeToSend}*

⏰ Válido por 10 minutos.`;

    // Enviar via instância admin usando o MESMO endpoint do chat (/send/text)
    // Base URL: usar prioritariamente a URL da instância admin e validar que é HTTP(s)
    const candidates = [
      adminApiUrl,
      Deno.env.get('VITE_UAZAP_API_URL') || undefined,
      Deno.env.get('VITE_EVOLUTION_API_URL') || undefined, // manter somente variáveis de URL
    ].filter((u): u is string => !!u && /^https?:\/\//i.test(u));

    const API_BASE_URL = candidates[0] || 'https://atende-julia.uazapi.com';

    const chatId = `${String(request.whatsapp_phone).replace(/\D/g, '')}@s.whatsapp.net`;
    const payload = { number: chatId, text: message };

    console.log('QUEUE POST', `${API_BASE_URL}/send/text`, '\nHeaders: token=<hidden>', '\nBody:', payload);

    // Executa envio em background para não travar o front
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort('timeout'), 10000);

    async function backgroundSend() {
      try {
        const resp = await fetch(`${API_BASE_URL}/send/text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': adminToken || adminInstance.api_token || '',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!resp.ok) {
          const errorText = await resp.text();
          console.error('Erro envio /send/text:', resp.status, errorText);
          return;
        }

        const data = await resp.json();
        console.log('Resposta envio /send/text:', data);
        
        // Registrar log de notificação
        await supabaseClient
          .from('system_notification_logs')
          .insert({
            notification_type: 'verification_code',
            recipient_phone: request.whatsapp_phone,
            message_content: message,
            status: 'sent',
            whatsapp_instance_id: adminInstance.id,
            metadata: { request_id: body.request_id },
            sent_at: new Date().toISOString(),
          });
      } catch (e) {
        console.error('Falha no envio em background:', e);
        
        // Registrar log de falha
        await supabaseClient
          .from('system_notification_logs')
          .insert({
            notification_type: 'verification_code',
            recipient_phone: request.whatsapp_phone,
            message_content: message,
            status: 'failed',
            whatsapp_instance_id: adminInstance.id,
            error_message: String(e),
            metadata: { request_id: body.request_id },
          });
      } finally {
        clearTimeout(timer);
      }
    }

    // Marca para executar após responder
    // @ts-ignore
    EdgeRuntime.waitUntil(backgroundSend());

    return new Response(
      JSON.stringify({ success: true, queued: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});