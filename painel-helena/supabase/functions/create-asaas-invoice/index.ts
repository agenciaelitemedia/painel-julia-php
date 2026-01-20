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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { clientId, planId, value, dueDate, billingType, description } = await req.json();

    if (!clientId || !planId || !value || !dueDate || !billingType) {
      return new Response(
        JSON.stringify({ success: false, error: 'Campos obrigatórios ausentes' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Creating Asaas invoice for client:', clientId);

    // Buscar dados do plano
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ success: false, error: 'Plano não encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Buscar integração do cliente
    const { data: integration, error: integrationError } = await supabaseClient
      .from('client_asaas_integration')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();

    if (integrationError || !integration || !integration.asaas_customer_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cliente não possui integração ativa com Asaas' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Buscar configuração global do Asaas
    const { data: asaasConfig, error: configError } = await supabaseClient
      .from('asaas_config')
      .select('*')
      .single();

    if (configError || !asaasConfig) {
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração do Asaas não encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const baseUrl = asaasConfig.environment === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';

    // Garantir que o customer no Asaas tenha CPF/CNPJ do cliente
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('name,email,cpf_cnpj')
      .eq('id', clientId)
      .maybeSingle();

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cliente não encontrado para validar CPF/CNPJ' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const doc = (client.cpf_cnpj || '').replace(/\D/g, '');
    console.log('Ensuring Asaas customer CPF/CNPJ:', { customerId: integration.asaas_customer_id, doc });
    if (!doc || (doc.length !== 11 && doc.length !== 14)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cliente sem CPF/CNPJ válido no cadastro' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Atualizar o customer no Asaas com CPF/CNPJ antes de criar a cobrança
    try {
      const updatePayload: any = { cpfCnpj: doc };
      if (client.name) updatePayload.name = client.name;
      if (client.email) updatePayload.email = client.email;

      const ensureCustomerResp = await fetch(`${baseUrl}/customers/${integration.asaas_customer_id}`, {
        method: 'PUT',
        headers: {
          'access_token': asaasConfig.api_token,
          'Content-Type': 'application/json',
          'User-Agent': 'Lovable-Integration/1.0',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!ensureCustomerResp.ok) {
        const errorData = await ensureCustomerResp.text();
        console.error('Asaas customer update error:', { status: ensureCustomerResp.status, error: errorData });
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Falha ao atualizar CPF/CNPJ no Asaas (Status: ${ensureCustomerResp.status})`,
            details: errorData
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Confirmar atualização buscando o customer
      const getCustomerResp = await fetch(`${baseUrl}/customers/${integration.asaas_customer_id}`, {
        method: 'GET',
        headers: {
          'access_token': asaasConfig.api_token,
          'Content-Type': 'application/json',
          'User-Agent': 'Lovable-Integration/1.0',
        },
      });
      const customerBody = await getCustomerResp.text();
      console.log('Asaas customer after update:', customerBody);
      try {
        const parsed = JSON.parse(customerBody);
        if (!parsed.cpfCnpj) {
          return new Response(
            JSON.stringify({ success: false, error: 'CPF/CNPJ ainda ausente no Asaas após atualização.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
      } catch (_) {
        // ignore parse errors, proceed
      }
    } catch (e) {
      console.error('Erro ao garantir CPF/CNPJ no Asaas:', e);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao garantir CPF/CNPJ no Asaas' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Verificar se é a primeira fatura do cliente (considerar setup_fee)
    const { count: invoiceCount } = await supabaseClient
      .from('asaas_invoices')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId);

    const isFirstInvoice = invoiceCount === 0;
    const setupFee = plan.setup_fee || 0;
    
    // Calcular valor da fatura
    const invoiceValue = isFirstInvoice 
      ? parseFloat(value) + parseFloat(setupFee.toString())
      : parseFloat(value);

    // Montar descrição
    let finalDescription = description || `${plan.name}`;
    if (isFirstInvoice && setupFee > 0) {
      finalDescription += ` (inclui taxa de implantação de R$ ${setupFee.toFixed(2)})`;
    } else if (isFirstInvoice && setupFee === 0) {
      finalDescription += ' (implantação grátis)';
    }

    // Preparar dados da cobrança
    const paymentData: any = {
      customer: integration.asaas_customer_id,
      billingType: billingType,
      value: invoiceValue,
      dueDate: dueDate,
      description: finalDescription,
    };

    console.log('Creating payment in Asaas:', { baseUrl, paymentData });

    // Criar cobrança no Asaas
    const asaasResponse = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'access_token': asaasConfig.api_token,
        'Content-Type': 'application/json',
        'User-Agent': 'Lovable-Integration/1.0',
      },
      body: JSON.stringify(paymentData),
    });

    if (!asaasResponse.ok) {
      const errorData = await asaasResponse.text();
      console.error('Asaas API error:', { status: asaasResponse.status, error: errorData });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro ao criar cobrança no Asaas (Status: ${asaasResponse.status})`,
          details: errorData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const asaasPayment = await asaasResponse.json();
    console.log('Asaas payment created:', asaasPayment);

    // Mapear status do Asaas para status local
    const mapStatus = (s: string) => {
      switch ((s || '').toUpperCase()) {
        case 'PENDING': return 'pending';
        case 'RECEIVED': return 'received';
        case 'RECEIVED_IN_CASH': return 'received';
        case 'CONFIRMED': return 'confirmed';
        case 'OVERDUE': return 'overdue';
        case 'CANCELLED': return 'canceled';
        default: return 'pending';
      }
    };

    // Salvar na tabela de faturas
    const invoiceNumber = `INV-${Date.now()}`;
    const { data: invoice, error: insertError } = await supabaseClient
      .from('asaas_invoices')
      .insert({
        client_id: clientId,
        invoice_number: invoiceNumber,
        value: invoiceValue,
        due_date: dueDate,
        billing_type: billingType,
        description: finalDescription,
        status: mapStatus(asaasPayment.status),
        asaas_payment_id: asaasPayment.id,
        invoice_url: asaasPayment.invoiceUrl,
        pix_code: asaasPayment.pixQrCodeId ? asaasPayment.pixCopyAndPaste : null,
        pix_qrcode: asaasPayment.pixQrCodeId,
        metadata: {
          is_first_invoice: isFirstInvoice,
          setup_fee: setupFee,
          plan_price: value,
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving invoice:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao salvar fatura no banco', details: insertError, invoiceUrl: asaasPayment.invoiceUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Enviar notificação WhatsApp se habilitada
    try {
      const notificationResponse = await supabaseClient.functions.invoke('send-asaas-notification', {
        body: {
          type: 'invoice_created',
          invoiceId: invoice.id,
          clientId: clientId,
        },
      });

      if (notificationResponse.error) {
        console.error('⚠️ Notification error (non-blocking):', notificationResponse.error);
      } else {
        console.log('✅ Notification sent:', notificationResponse.data);
      }
    } catch (notifError) {
      console.error('⚠️ Notification send failed (non-blocking):', notifError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        invoice: invoice,
        asaasPayment: asaasPayment,
        invoiceUrl: asaasPayment.invoiceUrl,
        pixCode: asaasPayment.pixQrCodeId ? asaasPayment.pixCopyAndPaste : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in create-asaas-invoice:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Erro desconhecido ao criar fatura' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
