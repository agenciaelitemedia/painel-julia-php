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
    const url = new URL(req.url);
    const tracking_token = url.searchParams.get('tracking_token');

    if (!tracking_token) {
      return new Response(
        JSON.stringify({ error: 'Token de rastreamento não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Buscar tracking
    const { data: tracking, error: trackingError } = await supabaseClient
      .from('subscription_request_tracking')
      .select('*, subscription_requests(*, subscription_plans(*))')
      .eq('tracking_token', tracking_token)
      .single();

    if (trackingError || !tracking) {
      return new Response(
        JSON.stringify({ error: 'Token de rastreamento inválido ou expirado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar expiração
    if (new Date(tracking.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Token de rastreamento expirado' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const request = tracking.subscription_requests;

    // Montar timeline
    const timeline = [
      {
        step: 1,
        title: 'Solicitação Recebida',
        description: 'Seu pedido foi registrado com sucesso',
        completed: true,
        date: request.created_at
      },
      {
        step: 2,
        title: 'Verificação WhatsApp',
        description: 'Código de verificação confirmado',
        completed: request.is_verified,
        date: request.is_verified ? request.verification_sent_at : null
      },
      {
        step: 3,
        title: 'Aguardando Pagamento',
        description: request.status === 'payment_confirmed' 
          ? 'Pagamento confirmado'
          : 'Aguardando confirmação do pagamento',
        completed: request.status === 'payment_confirmed' || request.status === 'completed',
        date: request.status === 'payment_confirmed' ? request.updated_at : null
      },
      {
        step: 4,
        title: 'Análise',
        description: request.status === 'completed'
          ? 'Pedido aprovado'
          : request.status === 'rejected'
          ? 'Pedido rejeitado'
          : 'Em análise pela equipe',
        completed: request.status === 'completed',
        date: request.approved_at
      },
      {
        step: 5,
        title: 'Conta Criada',
        description: 'Credenciais enviadas via WhatsApp',
        completed: request.status === 'completed',
        date: request.status === 'completed' ? request.approved_at : null
      }
    ];

    // Dados do plano (sem informações sensíveis)
    const plan_info = {
      name: request.subscription_plans.name,
      description: request.subscription_plans.description,
      price: request.subscription_plans.price,
      billing_cycle: request.subscription_plans.billing_cycle
    };

    // Dados de pagamento (se disponível e não sensível)
    let payment_info = null;
    if (request.payment_data && request.status === 'pending_payment') {
      payment_info = {
        payment_url: request.payment_data.payment_url,
        pix_qrcode: request.payment_data.pix_qrcode,
        due_date: request.payment_data.due_date,
        value: request.payment_data.value
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: request.status,
        timeline: timeline,
        plan: plan_info,
        payment_info: payment_info,
        rejection_reason: request.rejection_reason
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