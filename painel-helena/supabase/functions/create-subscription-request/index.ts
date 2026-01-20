import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  plan_id: string;
  full_name: string;
  cpf_cnpj: string;
  email: string;
  whatsapp_phone: string;
  payment_provider?: string;
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
    
    // Validações
    if (!body.plan_id || !body.full_name || !body.cpf_cnpj || !body.email || !body.whatsapp_phone) {
      return new Response(
        JSON.stringify({ error: 'Todos os campos são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar formato de telefone (formato brasileiro)
    const phoneRegex = /^55\d{10,11}$/;
    if (!phoneRegex.test(body.whatsapp_phone.replace(/\D/g, ''))) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp deve estar no formato: 55DDNNNNNNNNN' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se plano existe e está ativo
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', body.plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: 'Plano não encontrado ou inativo' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se email já existe em pedidos pendentes
    const { data: existingRequest } = await supabaseClient
      .from('subscription_requests')
      .select('id, verification_code')
      .eq('email', body.email)
      .in('status', ['pending_verification', 'pending_payment', 'payment_confirmed'])
      .single();

    if (existingRequest) {
      // Buscar tracking token do pedido existente
      const { data: trackingData } = await supabaseClient
        .from('subscription_request_tracking')
        .select('tracking_token')
        .eq('request_id', existingRequest.id)
        .single();

      const trackingToken = trackingData?.tracking_token || '';
      const trackingUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '') || ''}/track/${trackingToken}`;

      return new Response(
        JSON.stringify({
          success: true,
          request_id: existingRequest.id,
          tracking_token: trackingToken,
          tracking_url: trackingUrl,
          existing: true,
          message: 'Pedido já existe. Código de verificação anterior ainda é válido.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar código de verificação
    const { data: codeData } = await supabaseClient.rpc('generate_verification_code');
    const verificationCode = codeData as string;

    // Gerar tracking token
    const { data: tokenData } = await supabaseClient.rpc('generate_tracking_token');
    const trackingToken = tokenData as string;

    // Criar pedido de assinatura
    const { data: request, error: requestError } = await supabaseClient
      .from('subscription_requests')
      .insert({
        plan_id: body.plan_id,
        full_name: body.full_name,
        cpf_cnpj: body.cpf_cnpj.replace(/\D/g, ''),
        email: body.email.toLowerCase(),
        whatsapp_phone: body.whatsapp_phone.replace(/\D/g, ''),
        verification_code: verificationCode,
        verification_sent_at: new Date().toISOString(),
        verification_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutos
        payment_provider: body.payment_provider || 'asaas',
        status: 'pending_verification'
      })
      .select()
      .single();

    if (requestError) {
      console.error('Erro ao criar pedido:', requestError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar pedido' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar tracking token
    const { error: trackingError } = await supabaseClient
      .from('subscription_request_tracking')
      .insert({
        request_id: request.id,
        tracking_token: trackingToken
      });

    if (trackingError) {
      console.error('Erro ao criar tracking:', trackingError);
    }

    // Enviar código de verificação via WhatsApp (não bloquear a resposta)
    try {
      const sendPromise = supabaseClient.functions.invoke(
        'send-verification-code',
        {
          body: {
            request_id: request.id,
            verification_code: verificationCode,
            tracking_token: trackingToken
          }
        }
      );

      // Timeout de 8s para evitar travar o front
      const result: any = await Promise.race([
        sendPromise,
        new Promise((resolve) => setTimeout(() => resolve('timeout'), 8000))
      ]);

      if (result !== 'timeout' && result?.error) {
        console.error('Erro ao enviar código:', result.error);
      }
    } catch (err) {
      console.warn('Envio do código em background falhou ou expirou:', err);
    }

    const trackingUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '') || ''}/track/${trackingToken}`;

    return new Response(
      JSON.stringify({
        success: true,
        request_id: request.id,
        tracking_token: trackingToken,
        tracking_url: trackingUrl,
        message: 'Código de verificação enviado via WhatsApp'
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