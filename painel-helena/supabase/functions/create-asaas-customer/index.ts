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

    const { clientId } = await req.json();

    if (!clientId) {
      return new Response(
        JSON.stringify({ success: false, error: 'clientId é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Creating Asaas customer for client:', clientId);

    // Buscar dados do cliente
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      console.error('Client not found:', clientError);
      return new Response(
        JSON.stringify({ success: false, error: 'Cliente não encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Buscar configuração global do Asaas
    const { data: asaasConfig, error: configError } = await supabaseClient
      .from('asaas_config')
      .select('*')
      .single();

    if (configError || !asaasConfig) {
      console.error('Asaas config not found:', configError);
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração do Asaas não encontrada. Configure em Config Asaas primeiro.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const baseUrl = asaasConfig.environment === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';

    // Preparar dados do customer
    const customerData: any = {
      name: client.name,
      email: client.email,
      notificationDisabled: true,
    };

    if (client.cpf_cnpj) {
      // Detectar se é CPF ou CNPJ pelo tamanho
      const cleanDoc = client.cpf_cnpj.replace(/\D/g, '');
      if (cleanDoc.length === 11) {
        customerData.cpfCnpj = cleanDoc;
      } else if (cleanDoc.length === 14) {
        customerData.cpfCnpj = cleanDoc;
      }
    }

    console.log('Creating customer in Asaas:', { baseUrl, customerData });

    // Criar customer no Asaas
    const asaasResponse = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'access_token': asaasConfig.api_token,
        'Content-Type': 'application/json',
        'User-Agent': 'Lovable-Integration/1.0',
      },
      body: JSON.stringify(customerData),
    });

    if (!asaasResponse.ok) {
      const errorData = await asaasResponse.text();
      console.error('Asaas API error:', { status: asaasResponse.status, error: errorData });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro ao criar customer no Asaas (Status: ${asaasResponse.status})`,
          details: errorData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const asaasCustomer = await asaasResponse.json();
    console.log('Asaas customer created:', asaasCustomer);

    // Verificar se já existe integração
    const { data: existingIntegration } = await supabaseClient
      .from('client_asaas_integration')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();

    if (existingIntegration) {
      // Atualizar integração existente
      const { error: updateError } = await supabaseClient
        .from('client_asaas_integration')
        .update({
          asaas_customer_id: asaasCustomer.id,
          is_active: true,
          metadata: {
            created_at: new Date().toISOString(),
            asaas_data: asaasCustomer,
          }
        })
        .eq('id', existingIntegration.id);

      if (updateError) {
        console.error('Error updating integration:', updateError);
        throw updateError;
      }
    } else {
      // Criar nova integração
      const { error: insertError } = await supabaseClient
        .from('client_asaas_integration')
        .insert({
          client_id: clientId,
          asaas_customer_id: asaasCustomer.id,
          is_active: true,
          metadata: {
            created_at: new Date().toISOString(),
            asaas_data: asaasCustomer,
          }
        });

      if (insertError) {
        console.error('Error creating integration:', insertError);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        customerId: asaasCustomer.id,
        customer: asaasCustomer
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in create-asaas-customer:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
