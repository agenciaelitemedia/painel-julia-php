import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { apiToken, environment } = await req.json();

    if (!apiToken || !environment) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token e ambiente são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const baseUrl = environment === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';

    console.log('Testing Asaas connection:', { environment, baseUrl });

    const response = await fetch(`${baseUrl}/customers?limit=1`, {
      method: 'GET',
      headers: {
        'access_token': apiToken,
        'Content-Type': 'application/json',
        'User-Agent': 'Lovable-Integration/1.0',
      },
    });

    console.log('Asaas response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Asaas API error:', { status: response.status, error: errorData });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Token inválido ou sem permissões (Status: ${response.status})`,
          details: errorData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const data = await response.json();
    console.log('Asaas connection successful:', data);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
