import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HELENA_API_URL = "https://api.helena.run/core/v1";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const partnerToken = Deno.env.get('HELENA_PARTNER_TOKEN');
    if (!partnerToken) {
      console.error('HELENA_PARTNER_TOKEN not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'HELENA_PARTNER_TOKEN not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, searchText, companyId, tokenName } = await req.json();
    console.log('Helena API request:', { action, searchText, companyId, tokenName });

    if (action === 'search') {
      // Search companies
      const searchUrl = `${HELENA_API_URL}/company?SearchableText=${encodeURIComponent(searchText || '')}`;
      console.log('Searching companies:', searchUrl);

      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': partnerToken,
          'accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Helena API error:', response.status, errorText);
        return new Response(
          JSON.stringify({ success: false, error: `Helena API error: ${response.status}` }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      console.log('Search results:', data.totalItems, 'items');

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'create-token') {
      if (!companyId || !tokenName) {
        return new Response(
          JSON.stringify({ success: false, error: 'companyId and tokenName are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenUrl = `${HELENA_API_URL}/company/${companyId}/tokens`;
      console.log('Creating token:', tokenUrl, 'with name:', tokenName);

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': partnerToken,
          'accept': 'application/json',
          'content-type': 'application/*+json',
        },
        body: JSON.stringify({ name: tokenName }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Helena API error:', response.status, errorText);
        return new Response(
          JSON.stringify({ success: false, error: `Helena API error: ${response.status} - ${errorText}` }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      console.log('Token created successfully');

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action. Use "search" or "create-token"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in helena-api function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
