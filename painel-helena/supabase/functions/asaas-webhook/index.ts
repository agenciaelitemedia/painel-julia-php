import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const payload = await req.json();
    console.log('📥 Webhook Asaas recebido:', { event: payload.event, id: payload.id });

    // Salvar webhook recebido
    const { data: webhookRecord, error: webhookError } = await supabaseClient
      .from('asaas_webhooks')
      .insert({
        event_type: payload.event,
        payment_id: payload.payment?.id || null,
        subscription_id: payload.subscription?.id || null,
        payload: payload,
        processed: false,
      })
      .select()
      .single();

    if (webhookError) {
      console.error('❌ Erro ao salvar webhook:', webhookError);
      throw webhookError;
    }

    console.log('✅ Webhook salvo:', webhookRecord.id);

    // Processar evento
    let processed = false;
    let errorMessage = null;

    try {
      switch (payload.event) {
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_CONFIRMED':
          await processPaymentReceived(supabaseClient, payload, webhookRecord.id);
          processed = true;
          console.log('✅ Pagamento processado com sucesso');
          break;

        case 'PAYMENT_OVERDUE':
          await processPaymentOverdue(supabaseClient, payload);
          processed = true;
          console.log('✅ Vencimento processado com sucesso');
          break;

        case 'PAYMENT_DELETED':
        case 'PAYMENT_RESTORED':
          await processPaymentStatusChange(supabaseClient, payload);
          processed = true;
          console.log('✅ Status atualizado com sucesso');
          break;

        default:
          console.log(`ℹ️ Evento ${payload.event} não processado`);
          processed = true;
      }
    } catch (error: any) {
      console.error('❌ Erro ao processar webhook:', error);
      errorMessage = error.message;
    }

    // Atualizar status do webhook
    await supabaseClient
      .from('asaas_webhooks')
      .update({
        processed: processed,
        processed_at: new Date().toISOString(),
        error_message: errorMessage,
      })
      .eq('id', webhookRecord.id);

    return new Response(
      JSON.stringify({ success: true, webhookId: webhookRecord.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Erro no webhook handler:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});

async function processPaymentReceived(supabase: any, payload: any, webhookId?: string) {
  const paymentId = payload?.payment?.id;
  if (!paymentId) {
    console.log('⚠️ Webhook sem payment.id');
    return;
  }

  console.log('💰 Processando pagamento recebido:', paymentId);

  // 1) Tentar localizar pedido pelo campo coluna asaas_payment_id
  let { data: subscriptionRequest, error: reqError } = await supabase
    .from('subscription_requests')
    .select('*, subscription_plans(*)')
    .eq('asaas_payment_id', paymentId)
    .maybeSingle();

  if (reqError) console.error('❌ Erro ao buscar por coluna asaas_payment_id:', reqError);

  // 2) Fallback: pelo externalReference do pagamento (id do pedido)
  if (!subscriptionRequest && payload?.payment?.externalReference) {
    const ext = payload.payment.externalReference;
    const byExt = await supabase
      .from('subscription_requests')
      .select('*, subscription_plans(*)')
      .eq('id', ext)
      .maybeSingle();
    if (byExt.error) console.error('❌ Erro ao buscar por externalReference:', byExt.error);
    subscriptionRequest = byExt.data || subscriptionRequest;
  }

  // 3) Fallback: payment_data.asaas_payment_id (para compatibilidade antiga)
  if (!subscriptionRequest) {
    const byJson = await supabase
      .from('subscription_requests')
      .select('*, subscription_plans(*)')
      .contains('payment_data', { asaas_payment_id: paymentId })
      .maybeSingle();
    if (byJson.error) console.error('❌ Busca por asaas_payment_id no JSON falhou:', byJson.error);
    subscriptionRequest = byJson.data || subscriptionRequest;
  }

  // 3) Fallback: localizar pelo email do cliente vindo do webhook
  if (!subscriptionRequest) {
    const candidateEmail = payload?.payment?.customer?.email || payload?.customer?.email || payload?.payment?.customer_email;
    if (candidateEmail) {
      const byEmail = await supabase
        .from('subscription_requests')
        .select('*, subscription_plans(*)')
        .eq('email', candidateEmail)
        .order('created_at', { ascending: false })
        .limit(1);
      if (byEmail.error) console.error('❌ Erro ao buscar por email:', byEmail.error);
      subscriptionRequest = (byEmail.data && byEmail.data[0]) || null;
    }
  }

  // 4) Fallback: busca textual pelo paymentId dentro de payment_data (caso seja TEXT ou JSON serializado)
  if (!subscriptionRequest) {
    const byText = await supabase
      .from('subscription_requests')
      .select('*, subscription_plans(*)')
      .ilike('payment_data', `%${paymentId}%`)
      .order('created_at', { ascending: false })
      .limit(1);
    if (byText.error) console.error('❌ Erro ao buscar por ILIKE em payment_data:', byText.error);
    subscriptionRequest = (byText.data && byText.data[0]) || null;
  }

  if (!subscriptionRequest) {
    console.error('❌ Pedido não localizado para payment_id:', paymentId);
    console.error('Estratégias tentadas: coluna asaas_payment_id, externalReference, payment_data.asaas_payment_id, email, ILIKE');
    
    // Marcar webhook como processado mas com erro
    await supabase
      .from('asaas_webhooks')
      .update({
        processed: true,
        error_message: `Pedido não localizado para payment_id: ${paymentId}. Use reprocess-asaas-payment para tentar novamente.`,
        processed_at: new Date().toISOString()
      })
      .eq('id', webhookId);

    // Atualizar fatura se existir (não bloqueante)
    await supabase
      .from('asaas_invoices')
      .update({ status: 'received', payment_date: new Date().toISOString() })
      .eq('asaas_payment_id', paymentId);
    
    return;
  }

  console.log('🎯 Pedido encontrado:', subscriptionRequest.id, 'status atual:', subscriptionRequest.status);

  // Confirmar pagamento no pedido e registrar metadados
  const { error: statusErr } = await supabase
    .from('subscription_requests')
    .update({ 
      status: 'payment_confirmed',
      payment_data: {
        ...subscriptionRequest.payment_data,
        asaas_payment_id: paymentId,
        payment_status: 'received',
        paid_at: new Date().toISOString(),
      }
    })
    .eq('id', subscriptionRequest.id);

  if (statusErr) {
    console.error('❌ Erro ao confirmar pagamento:', statusErr);
    return;
  }

  console.log('✅ Pagamento confirmado no pedido');

  // Aprovar automaticamente (cria usuário/cliente e envia credenciais)
  try {
    const approvalResult = await supabase.functions.invoke('approve-subscription-request', {
      body: { request_id: subscriptionRequest.id, is_automatic: true },
    });

    if ((approvalResult as any).error) {
      console.error('❌ Erro ao aprovar pedido:', (approvalResult as any).error);
    } else {
      console.log('✅ Pedido aprovado e conta criada com sucesso');
    }
  } catch (approvalError) {
    console.error('❌ Falha na aprovação automática:', approvalError);
  }

  // Atualizar fatura se existir (não bloqueante)
  await supabase
    .from('asaas_invoices')
    .update({ status: 'received', payment_date: new Date().toISOString() })
    .eq('asaas_payment_id', paymentId);
}

async function processPaymentOverdue(supabase: any, payload: any) {
  const paymentId = payload.payment?.id;
  if (!paymentId) return;

  console.log('⏰ Processando pagamento vencido:', paymentId);

  // Atualizar fatura
  const { data: invoice, error: updateError } = await supabase
    .from('asaas_invoices')
    .update({
      status: 'overdue',
    })
    .eq('asaas_payment_id', paymentId)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Erro ao atualizar fatura:', updateError);
    throw updateError;
  }

  if (!invoice) {
    console.log('⚠️ Fatura não encontrada para payment_id:', paymentId);
    return;
  }

  console.log('✅ Fatura marcada como vencida:', invoice.invoice_number);

  // Enviar notificação de vencimento
  try {
    const notificationResult = await supabase.functions.invoke('send-asaas-notification', {
      body: {
        type: 'payment_overdue',
        invoiceId: invoice.id,
        clientId: invoice.client_id,
      },
    });

    if (notificationResult.error) {
      console.error('⚠️ Erro ao enviar notificação (não bloqueante):', notificationResult.error);
    } else {
      console.log('✅ Notificação de vencimento enviada');
    }
  } catch (notifError) {
    console.error('⚠️ Falha ao enviar notificação (não bloqueante):', notifError);
  }
}

async function processPaymentStatusChange(supabase: any, payload: any) {
  const paymentId = payload.payment?.id;
  if (!paymentId) return;

  const status = payload.event === 'PAYMENT_DELETED' ? 'canceled' : 'pending';
  
  console.log(`🔄 Atualizando status do pagamento ${paymentId} para ${status}`);

  const { error: updateError } = await supabase
    .from('asaas_invoices')
    .update({
      status: status,
    })
    .eq('asaas_payment_id', paymentId);

  if (updateError) {
    console.error('❌ Erro ao atualizar status:', updateError);
    throw updateError;
  }

  console.log('✅ Status atualizado com sucesso');
}
