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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { request_id, rejection_reason } = await req.json();

    // Buscar pedido
    const { data: request, error: requestError } = await supabaseClient
      .from('subscription_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (requestError || !request) {
      return new Response(
        JSON.stringify({ error: 'Pedido não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se houver cobrança no Asaas, tentar cancelar
    if (request.asaas_payment_id) {
      const { data: asaasConfig } = await supabaseClient
        .from('asaas_config')
        .select('*')
        .single();

      if (asaasConfig && asaasConfig.api_token) {
        const asaasBaseUrl = asaasConfig.environment === 'production'
          ? 'https://www.asaas.com/api/v3'
          : 'https://sandbox.asaas.com/api/v3';

        try {
          await fetch(`${asaasBaseUrl}/payments/${request.asaas_payment_id}`, {
            method: 'DELETE',
            headers: {
              'access_token': asaasConfig.api_token
            }
          });
          console.log('Cobrança cancelada no Asaas');
        } catch (error) {
          console.error('Erro ao cancelar cobrança:', error);
        }
      }
    }

    // Atualizar pedido
    const { error: updateError } = await supabaseClient
      .from('subscription_requests')
      .update({
        status: 'rejected',
        rejection_reason: rejection_reason,
        approved_by: user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', request_id);

    if (updateError) {
      console.error('Erro ao atualizar pedido:', updateError);
      throw updateError;
    }

    // Notificar cliente via WhatsApp
    const instanceToken = Deno.env.get('UAZAP_ADMIN_TOKEN');
    if (instanceToken) {
      const message = `❌ *Pedido de Assinatura - Julia IA*

Olá ${request.full_name},

Infelizmente seu pedido de assinatura não pôde ser aprovado.

*Motivo:* ${rejection_reason}

Se tiver dúvidas, entre em contato conosco.`;

      try {
        const uazapUrl = Deno.env.get('VITE_EVOLUTION_API_URL');
        await fetch(`${uazapUrl}/message/sendText/${instanceToken}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            number: request.whatsapp_phone,
            text: message
          })
        });
      } catch (error) {
        console.error('Erro ao enviar notificação:', error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pedido rejeitado com sucesso'
      }),
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