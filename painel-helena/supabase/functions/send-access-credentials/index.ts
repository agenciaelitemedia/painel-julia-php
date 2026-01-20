import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  request_id: string;
  email: string;
  temp_password: string;
  full_name: string;
  whatsapp_phone: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();

    // Buscar conexão de notificação padrão com fallback
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
    const supabase = createClient(supabaseUrl, supabaseKey);

    let whatsappInstance: any = null;
    
    // 1. Tentar buscar a conexão padrão
    const { data: defaultInstance, error: defaultError } = await supabase
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
      whatsappInstance = defaultInstance;
      console.log('✅ Usando conexão padrão de notificação:', defaultInstance.instance_name);
    } else {
      // 2. Fallback: buscar qualquer conexão habilitada para notificações
      console.log('⚠️ Conexão padrão não encontrada, tentando alternativas...');
      
      const { data: alternativeInstances, error: altError } = await supabase
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
        whatsappInstance = alternativeInstances[0];
        console.log('✅ Usando conexão alternativa:', whatsappInstance.instance_name);
      }
    }

    if (!whatsappInstance) {
      console.error('❌ Nenhuma conexão de notificação disponível');
      return new Response(
        JSON.stringify({ error: 'Nenhuma conexão WhatsApp habilitada para notificações' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar mensagem com credenciais
    const appUrl = (Deno.env.get('SUPABASE_URL') || '').replace('/rest/v1', '') || 'https://app.masterchat.com.br';
    const message = `🎉 *Bem-vindo à Julia IA!*\n\nOlá ${body.full_name}!\n\nSua conta foi ativada com sucesso! 🚀\n\n📧 *Email:* ${body.email}\n🔑 *Senha Temporária:* ${body.temp_password}\n\n🔗 *Acesse agora:* ${appUrl}\n\n⚠️ *IMPORTANTE:*\nPor segurança, altere sua senha no primeiro acesso!\n\nEstamos felizes em tê-lo conosco! 😊`;

    // Enviar mensagem baseado no provedor
    const phoneNumber = (body.whatsapp_phone || '').replace(/\D/g, '');
    const provider = whatsappInstance.provider || (whatsappInstance.api_url?.includes('uazapi') ? 'uazap' : 'evolution');

    let response: Response;
    if (provider === 'uazap') {
      const url = `${whatsappInstance.api_url}/send/text`;
      const token = whatsappInstance.api_token || whatsappInstance.instance_token;
      const chatId = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`;
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': token || '' },
        body: JSON.stringify({ number: chatId, text: message }),
      });
    } else {
      const instanceId = whatsappInstance.instance_id || whatsappInstance.instance_name || whatsappInstance.instance_token;
      const url = `${whatsappInstance.api_url}/message/sendText/${instanceId}`;
      const apiKey = whatsappInstance.api_token || whatsappInstance.api_key || '';
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
        body: JSON.stringify({ number: phoneNumber, text: message }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro ao enviar WhatsApp:', errorText);
      
      // Registrar log de falha
      await supabase
        .from('system_notification_logs')
        .insert({
          notification_type: 'access_credentials',
          recipient_phone: body.whatsapp_phone,
          message_content: message,
          status: 'failed',
          whatsapp_instance_id: whatsappInstance.id,
          error_message: errorText,
          metadata: { request_id: body.request_id },
        });
      
      throw new Error('Falha ao enviar WhatsApp');
    }

    console.log('Credenciais enviadas com sucesso para:', body.whatsapp_phone);

    // Registrar log de sucesso
    await supabase
      .from('system_notification_logs')
      .insert({
        notification_type: 'access_credentials',
        recipient_phone: body.whatsapp_phone,
        message_content: message,
        status: 'sent',
        whatsapp_instance_id: whatsappInstance.id,
        metadata: { request_id: body.request_id },
        sent_at: new Date().toISOString(),
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Credenciais enviadas' }),
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