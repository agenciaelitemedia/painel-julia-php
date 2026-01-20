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

    const { payment_id, webhook_id } = await req.json();

    if (!payment_id && !webhook_id) {
      return new Response(
        JSON.stringify({ error: 'payment_id ou webhook_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔄 Reprocessando pagamento:', { payment_id, webhook_id });

    let paymentId = payment_id;
    let webhookPayload: any = null;

    // Se fornecido webhook_id, buscar o webhook
    if (webhook_id && !payment_id) {
      const { data: webhook, error: webhookError } = await supabaseClient
        .from('asaas_webhooks')
        .select('*')
        .eq('id', webhook_id)
        .single();

      if (webhookError || !webhook) {
        return new Response(
          JSON.stringify({ error: 'Webhook não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      paymentId = webhook.payment_id || webhook.payload?.payment?.id;
      webhookPayload = webhook.payload;
    }

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: 'payment_id não pode ser determinado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar subscription_request usando a mesma lógica do webhook
    let subscriptionRequest: any = null;

    // 1) Buscar por coluna asaas_payment_id
    const { data: byColumn, error: columnError } = await supabaseClient
      .from('subscription_requests')
      .select('*, subscription_plans(*)')
      .eq('asaas_payment_id', paymentId)
      .maybeSingle();

    if (columnError) {
      console.error('❌ Erro ao buscar por coluna asaas_payment_id:', columnError);
    }
    subscriptionRequest = byColumn;

    // 2) Fallback: externalReference
    if (!subscriptionRequest && webhookPayload?.payment?.externalReference) {
      const ext = webhookPayload.payment.externalReference;
      const { data: byExt, error: extError } = await supabaseClient
        .from('subscription_requests')
        .select('*, subscription_plans(*)')
        .eq('id', ext)
        .maybeSingle();

      if (extError) {
        console.error('❌ Erro ao buscar por externalReference:', extError);
      }
      subscriptionRequest = byExt;
    }

    // 3) Fallback: payment_data.asaas_payment_id
    if (!subscriptionRequest) {
      const { data: byJson, error: jsonError } = await supabaseClient
        .from('subscription_requests')
        .select('*, subscription_plans(*)')
        .contains('payment_data', { asaas_payment_id: paymentId })
        .maybeSingle();

      if (jsonError) {
        console.error('❌ Erro ao buscar por payment_data:', jsonError);
      }
      subscriptionRequest = byJson;
    }

    if (!subscriptionRequest) {
      console.error('❌ Pedido não localizado para payment_id:', paymentId);
      return new Response(
        JSON.stringify({ 
          error: 'Pedido não localizado',
          payment_id: paymentId,
          message: 'Nenhum subscription_request encontrado com este payment_id'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Pedido localizado:', subscriptionRequest.id);

    // Atualizar status para payment_confirmed
    const { error: updateError } = await supabaseClient
      .from('subscription_requests')
      .update({
        status: 'payment_confirmed',
        payment_data: {
          ...subscriptionRequest.payment_data,
          asaas_payment_id: paymentId,
          reprocessed_at: new Date().toISOString()
        }
      })
      .eq('id', subscriptionRequest.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar pedido:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar pedido', details: updateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Pedido atualizado para payment_confirmed');

    // Invocar approve-subscription-request
    const { data: approvalData, error: approvalError } = await supabaseClient.functions.invoke(
      'approve-subscription-request',
      {
        body: {
          request_id: subscriptionRequest.id,
          is_automatic: true
        }
      }
    );

    if (approvalError) {
      console.error('❌ Erro ao aprovar pedido:', approvalError);
      return new Response(
        JSON.stringify({ 
          error: 'Pedido atualizado mas falha na aprovação',
          approval_error: approvalError 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Pedido aprovado com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pagamento reprocessado e pedido aprovado com sucesso',
        request_id: subscriptionRequest.id,
        payment_id: paymentId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Erro no reprocessamento:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
