import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { requestId } = await req.json();

    console.log('📨 Enviando fatura para pedido:', requestId);

    // Buscar o pedido de assinatura
    const { data: subscriptionRequest, error: requestError } = await supabase
      .from('subscription_requests')
      .select('*, subscription_plans(*)')
      .eq('id', requestId)
      .single();

    if (requestError || !subscriptionRequest) {
      console.error('❌ Pedido não encontrado:', requestError);
      return new Response(
        JSON.stringify({ success: false, error: 'Pedido não encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Verificar se há dados de pagamento
    if (!subscriptionRequest.payment_data?.payment_url) {
      console.error('❌ Dados de pagamento não encontrados');
      return new Response(
        JSON.stringify({ success: false, error: 'Dados de pagamento não encontrados' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Buscar templates do Asaas (apenas para mensagem)
    const { data: asaasConfig } = await supabase
      .from('asaas_config')
      .select('notification_templates')
      .single();

    console.log('🔍 Buscando instância admin com is_notifications=true...');

    // Buscar instância administrativa com is_notifications=true
    let adminInstance: any = null;

    // 1. Tentar buscar a conexão padrão
    const { data: defaultInstance, error: defaultError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('is_default_notification', true)
      .eq('is_notifications', true)
      .eq('status', 'connected')
      .is('deleted_at', null)
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
      
      const { data: alternativeInstances, error: altError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('is_notifications', true)
        .eq('status', 'connected')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
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
        JSON.stringify({ success: false, error: 'Nenhuma conexão WhatsApp habilitada para notificações' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Formatar mensagem com os dados do pedido
    const template = asaasConfig?.notification_templates?.invoice_created || 
      'Olá {nome}! Nova fatura gerada no valor de R$ {valor}, vencimento em {data_vencimento}. {link_pagamento}';

    const message = template
      .replace('{nome}', subscriptionRequest.full_name)
      .replace('{valor}', Number(subscriptionRequest.payment_data.value || 0).toFixed(2))
      .replace('{data_vencimento}', new Date(subscriptionRequest.payment_data.due_date).toLocaleDateString('pt-BR'))
      .replace('{link_pagamento}', subscriptionRequest.payment_data.payment_url);

    // Enviar via instância admin usando o MESMO endpoint do chat (/send/text)
    const baseUrlCandidate = adminInstance.api_url;
    const API_BASE_URL = (baseUrlCandidate && /^https?:\/\//i.test(baseUrlCandidate))
      ? baseUrlCandidate
      : 'https://atende-julia.uazapi.com';

    const chatId = `${String(subscriptionRequest.whatsapp_phone).replace(/\D/g, '')}@s.whatsapp.net`;
    const payload = { number: chatId, text: message };

    console.log('➡️ Enviando fatura via admin /send/text', { API_BASE_URL, number: chatId });

    let whatsappResponse: Response;
    try {
      whatsappResponse = await fetch(`${API_BASE_URL}/send/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': adminInstance.api_token || '',
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error('❌ Falha na requisição WhatsApp (admin):', e);
      return new Response(
        JSON.stringify({ success: false, error: 'Falha de rede ao enviar WhatsApp' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (!whatsappResponse.ok) {
      const errorText = await whatsappResponse.text();
      console.error('❌ Erro ao enviar WhatsApp (admin):', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao enviar WhatsApp' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('✅ Fatura enviada via WhatsApp com sucesso');

    return new Response(
      JSON.stringify({ success: true, message: 'Fatura enviada com sucesso' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Error in send-invoice-notification:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
