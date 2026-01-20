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

    const { clientId, planName, value, cycle, billingType, description } = await req.json();

    if (!clientId || !planName || !value || !cycle || !billingType) {
      return new Response(
        JSON.stringify({ success: false, error: 'Campos obrigatórios ausentes' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Creating Asaas subscription for client:', clientId);

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
    console.log('Ensuring Asaas customer CPF/CNPJ (subscription):', { customerId: integration.asaas_customer_id, doc });
    if (!doc || (doc.length !== 11 && doc.length !== 14)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cliente sem CPF/CNPJ válido no cadastro' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Atualizar o customer no Asaas com CPF/CNPJ antes de criar a assinatura
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
      console.log('Asaas customer after update (subscription):', customerBody);
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

    // Preparar dados da assinatura (sem setup_fee - só na primeira fatura)
    const subscriptionData: any = {
      customer: integration.asaas_customer_id,
      billingType: billingType,
      value: parseFloat(value), // Apenas o valor do plano
      cycle: cycle,
      description: description || planName,
    };

    console.log('Creating subscription in Asaas (recurring value without setup_fee):', { baseUrl, subscriptionData });

    // Criar assinatura no Asaas
    const asaasResponse = await fetch(`${baseUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'access_token': asaasConfig.api_token,
        'Content-Type': 'application/json',
        'User-Agent': 'Lovable-Integration/1.0',
      },
      body: JSON.stringify(subscriptionData),
    });

    if (!asaasResponse.ok) {
      const errorData = await asaasResponse.text();
      console.error('Asaas API error:', { status: asaasResponse.status, error: errorData });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro ao criar assinatura no Asaas (Status: ${asaasResponse.status})`,
          details: errorData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const asaasSubscription = await asaasResponse.json();
    console.log('Asaas subscription created:', asaasSubscription);

    // Mapear status do Asaas para status local
    const mapSubStatus = (s: string) => {
      switch ((s || '').toUpperCase()) {
        case 'ACTIVE': return 'active';
        case 'INACTIVE': return 'canceled';
        case 'CANCELLED': return 'canceled';
        case 'SUSPENDED': return 'canceled';
        default: return 'active';
      }
    };

    // Salvar na tabela de assinaturas
    const { data: subscription, error: insertError } = await supabaseClient
      .from('asaas_subscriptions')
      .insert({
        client_id: clientId,
        plan_name: planName,
        value: parseFloat(value),
        cycle: cycle,
        billing_type: billingType,
        description: description,
        status: mapSubStatus(asaasSubscription.status),
        asaas_subscription_id: asaasSubscription.id,
        next_due_date: asaasSubscription.nextDueDate,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving subscription:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao salvar assinatura no banco', details: insertError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Enviar notificação WhatsApp se habilitada
    try {
      const notificationResponse = await supabaseClient.functions.invoke('send-asaas-notification', {
        body: {
          type: 'subscription_created',
          subscriptionId: subscription.id,
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
        subscription: subscription,
        asaasSubscription: asaasSubscription,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in create-asaas-subscription:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Erro desconhecido ao criar assinatura' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
