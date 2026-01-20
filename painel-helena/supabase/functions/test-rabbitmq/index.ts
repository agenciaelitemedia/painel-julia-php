import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get('WEBHOOK_MQ_PAINEL');

    if (!webhookUrl) {
      console.error('❌ WEBHOOK_MQ_PAINEL não configurado');
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'WEBHOOK_MQ_PAINEL não configurado'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Criar payload de teste no formato correto
    const testPayload = {
      MessageText: "Teste de integração Webhook - Mensagem de exemplo",
      MessageType: "text",
      MessageFromMe: false,
      MessageId: "TEST_" + Date.now(),
      MessageUrl: null,
      meta: {
        phoneNumber: "553488860163"
      },
      app: {
        evo: {
          apikey: "v2MhiuoDIEeHAkHfBzKFWenEWiSHbUsZgC7zpQGHLWijJmUCkF",
          instance: "20250000",
          server: "https://atende-julia.uazapi.com",
          type_sender: "uazapi"
        },
        debouncerTime: 3
      },
      queueId: 0,
      remoteJid: "558198480349",
      cod_agent: "20250000",
      chatId: "558198480349@s.whatsapp.net"
    };
    
    console.log('🔗 Testando webhook:', webhookUrl);
    console.log('📤 JSON que será enviado:', JSON.stringify(testPayload, null, 2));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao enviar para webhook:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao enviar para webhook',
          details: {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log('✅ Mensagem de teste enviada para webhook');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Mensagem de teste enviada com sucesso!',
        details: {
          url: webhookUrl
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro ao testar webhook',
        details: String(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
