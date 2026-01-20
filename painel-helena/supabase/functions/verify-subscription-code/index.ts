import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  request_id: string;
  verification_code: string;
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

    // Buscar pedido
    const { data: request, error: requestError } = await supabaseClient
      .from('subscription_requests')
      .select('*, subscription_plans(*)')
      .eq('id', body.request_id)
      .single();

    if (requestError || !request) {
      return new Response(
        JSON.stringify({ error: 'Pedido não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já foi verificado
    if (request.is_verified) {
      return new Response(
        JSON.stringify({ error: 'Código já foi verificado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se código expirou
    if (new Date(request.verification_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Código expirado. Solicite um novo código.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar código
    if (request.verification_code !== body.verification_code) {
      return new Response(
        JSON.stringify({ error: 'Código inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar configuração do Asaas
    const { data: asaasConfig } = await supabaseClient
      .from('asaas_config')
      .select('*')
      .single();

    if (!asaasConfig || !asaasConfig.api_token) {
      return new Response(
        JSON.stringify({ error: 'Sistema de pagamento não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar customer no Asaas
    const asaasBaseUrl = asaasConfig.environment === 'production'
      ? 'https://www.asaas.com/api/v3'
      : 'https://sandbox.asaas.com/api/v3';

    const customerData = {
      name: request.full_name,
      cpfCnpj: request.cpf_cnpj,
      email: request.email,
      phone: request.whatsapp_phone,
      mobilePhone: request.whatsapp_phone,
      notificationDisabled: false
    };

    const customerResponse = await fetch(`${asaasBaseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasConfig.api_token
      },
      body: JSON.stringify(customerData)
    });

    if (!customerResponse.ok) {
      const errorText = await customerResponse.text();
      console.error('Erro ao criar customer:', errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar cliente no sistema de pagamento' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const customer = await customerResponse.json();

    // Criar cobrança
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3); // 3 dias para pagamento

    const chargeData = {
      customer: customer.id,
      billingType: 'PIX',
      value: request.subscription_plans.price,
      dueDate: dueDate.toISOString().split('T')[0],
      description: `Assinatura - ${request.subscription_plans.name}`,
      externalReference: request.id,
      postalService: false
    };

    const chargeResponse = await fetch(`${asaasBaseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasConfig.api_token
      },
      body: JSON.stringify(chargeData)
    });

    if (!chargeResponse.ok) {
      const errorText = await chargeResponse.text();
      console.error('Erro ao criar cobrança:', errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar cobrança' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payment = await chargeResponse.json();

    // Atualizar pedido
    const { error: updateError } = await supabaseClient
      .from('subscription_requests')
      .update({
        is_verified: true,
        status: 'pending_payment',
        asaas_customer_id: customer.id,
        asaas_payment_id: payment.id,
        payment_data: {
          payment_url: payment.invoiceUrl,
          invoice_url: payment.invoiceUrl,
          pix_code: payment.pixCopyAndPaste,
          pix_qrcode: payment.pixQrCodeUrl,
          due_date: payment.dueDate,
          value: payment.value
        }
      })
      .eq('id', request.id);

    if (updateError) {
      console.error('Erro ao atualizar pedido:', updateError);
    }

    // Enviar WhatsApp com link de pagamento
    try {
      const { data: adminInstance } = await supabaseClient
        .from('whatsapp_instances')
        .select('*')
        .is('deleted_at', null)
        .eq('status', 'connected')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (adminInstance?.api_url) {
        const paymentMessage = `✅ *Código Verificado - Julia IA*

Olá ${request.full_name}!

Seu código foi validado com sucesso! 🎉

💰 *Detalhes do Pagamento:*
Plano: ${request.subscription_plans.name}
Valor: R$ ${payment.value.toFixed(2)}
Vencimento: ${new Date(payment.dueDate).toLocaleDateString('pt-BR')}

🔗 *Link para Pagamento:*
${payment.invoiceUrl}

📱 *Código PIX Copia e Cola:*
\`\`\`${payment.pixCopyAndPaste}\`\`\`

⚡ *Importante:* Após a confirmação do pagamento, seus dados de acesso serão enviados automaticamente neste WhatsApp!

Pagamento via PIX é aprovado em até 2 minutos! 🚀`;

        const chatId = `${String(request.whatsapp_phone).replace(/\D/g, '')}@s.whatsapp.net`;
        
        await fetch(`${adminInstance.api_url}/send/text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': adminInstance.api_token || '',
          },
          body: JSON.stringify({
            number: chatId,
            text: paymentMessage
          })
        });

        console.log('WhatsApp de pagamento enviado para:', request.whatsapp_phone);
      }
    } catch (whatsappError) {
      console.error('Erro ao enviar WhatsApp de pagamento:', whatsappError);
      // Não retorna erro, apenas loga
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_data: {
          payment_url: payment.invoiceUrl,
          invoice_url: payment.invoiceUrl,
          pix_code: payment.pixCopyAndPaste,
          pix_qrcode: payment.pixQrCodeUrl,
          boleto_url: payment.bankSlipUrl,
          due_date: payment.dueDate,
          value: payment.value
        }
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