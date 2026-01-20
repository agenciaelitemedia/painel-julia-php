import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const allowedOrigins = [
  'https://atendejulia.com.br',
  'https://www.atendejulia.com.br',
  'https://app.atendejulia.com.br',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

const isAllowedDomain = (url: string | null): boolean => {
  if (!url) return false;
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    return hostname === 'atendejulia.com.br' || hostname.endsWith('.atendejulia.com.br');
  } catch {
    return url.includes('atendejulia.com.br');
  }
};

const isDevelopmentOrigin = (url: string | null): boolean => {
  if (!url) return false;
  return url.includes('localhost') || 
         url.includes('127.0.0.1') ||
         url.includes('lovable.app') ||
         url.includes('lovableproject.com');
};

const getCorsHeaders = (origin: string | null): Record<string, string> => {
  const isDevelopment = isDevelopmentOrigin(origin);
  const isAtendejuliaDomain = isAllowedDomain(origin);
  const allowedOrigin = (isDevelopment || isAtendejuliaDomain) ? origin : allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin || allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
};

async function getExternalDbClient() {
  const rawCaCert = Deno.env.get('EXTERNAL_DB_CA_CERT');

  if (!rawCaCert) {
    throw new Error('Missing EXTERNAL_DB_CA_CERT secret');
  }

  const normalizeCaCertificates = (input: string): string[] => {
    const cleaned = input.replace(/\\n/g, '\n').replace(/\r/g, '\n');
    const blocks: string[] = [];
    const regex = /-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(cleaned)) !== null) {
      const body = match[1].replace(/[^A-Za-z0-9+/=]/g, '');
      const wrapped = (body.match(/.{1,64}/g) || [body]).join('\n');
      blocks.push(`-----BEGIN CERTIFICATE-----\n${wrapped}\n-----END CERTIFICATE-----\n`);
    }

    if (blocks.length === 0) {
      blocks.push(cleaned.trim());
    }

    return blocks;
  };

  const caCertificates = normalizeCaCertificates(rawCaCert);

  const client = new Client({
    hostname: Deno.env.get('EXTERNAL_DB_HOST'),
    port: parseInt(Deno.env.get('EXTERNAL_DB_PORT') || '25060'),
    database: Deno.env.get('EXTERNAL_DB_NAME'),
    user: Deno.env.get('EXTERNAL_DB_USER'),
    password: Deno.env.get('EXTERNAL_DB_PASSWORD'),
    tls: {
      enabled: true,
      enforce: true,
      caCertificates,
    },
    connection: {
      attempts: 1,
    },
  });

  await client.connect();
  return client;
}

interface SearchRequest {
  action: 'search' | 'create';
  helena_count_id: string;
  name?: string;
  phoneNumber?: string;
}

interface HelenaContact {
  id: string;
  name: string;
  nameWhatsapp?: string;
  phoneNumber: string;
  phoneNumberFormatted?: string;
  email?: string;
  tagNames?: string[];
  portfolioNames?: string[];
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let client: Client | null = null;

  try {
    const { action, helena_count_id, name, phoneNumber }: SearchRequest = await req.json();

    if (!helena_count_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing helena_count_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('[Helena Contact Search] Action:', action, { helena_count_id, name, phoneNumber });

    // 1. Get helena_token from external database
    client = await getExternalDbClient();
    
    const tokenResult = await client.queryObject<{ helena_token: string }>(
      `SELECT helena_token FROM public.agents_helena 
       WHERE helena_count_id = $1 
       AND status = true 
       AND helena_token IS NOT NULL 
       AND helena_token <> ''
       ORDER BY updated_at DESC
       LIMIT 1`,
      [helena_count_id]
    );

    if (!tokenResult.rows.length || !tokenResult.rows[0].helena_token) {
      console.error('[Helena Contact Search] Token not found for count_id:', helena_count_id);
      return new Response(
        JSON.stringify({ success: false, error: 'Token not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const helenaToken = tokenResult.rows[0].helena_token;
    console.log('[Helena Contact Search] Token found');

    if (action === 'search') {
      // Search contacts
      if (!name && !phoneNumber) {
        return new Response(
          JSON.stringify({ success: false, error: 'Provide name or phoneNumber for search' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const searchBody: Record<string, string> = {};
      if (name) searchBody.name = name;
      if (phoneNumber) searchBody.phoneNumber = phoneNumber.replace(/\D/g, '');

      console.log('[Helena Contact Search] Search body:', searchBody);

      const searchResponse = await fetch('https://api.wts.chat/core/v1/contact/filter', {
        method: 'POST',
        headers: {
          'Authorization': helenaToken,
          'accept': 'application/json',
          'content-type': 'application/*+json',
        },
        body: JSON.stringify(searchBody),
      });

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('[Helena Contact Search] Search error:', searchResponse.status, errorText);
        return new Response(
          JSON.stringify({ success: false, error: `Helena API error: ${searchResponse.status}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: searchResponse.status }
        );
      }

      const searchData = await searchResponse.json();
      console.log('[Helena Contact Search] Found', searchData.totalItems || 0, 'contacts');

      // Map response to simplified format
      const contacts: HelenaContact[] = (searchData.items || []).map((item: any) => ({
        id: item.id,
        name: item.name || item.nameWhatsapp || 'Sem nome',
        nameWhatsapp: item.nameWhatsapp,
        phoneNumber: item.phoneNumber || '',
        phoneNumberFormatted: item.phoneNumberFormatted,
        email: item.email,
        tagNames: item.tagNames || [],
        portfolioNames: item.portfolioNames || [],
      }));

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: contacts,
          totalItems: searchData.totalItems || 0,
          hasMorePages: searchData.hasMorePages || false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );

    } else if (action === 'create') {
      // Create contact
      if (!name || !phoneNumber) {
        return new Response(
          JSON.stringify({ success: false, error: 'Name and phoneNumber are required for create' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const cleanPhone = phoneNumber.replace(/\D/g, '');
      console.log('[Helena Contact Search] Creating contact:', { name, phoneNumber: cleanPhone });

      const createResponse = await fetch('https://api.wts.chat/core/v1/contact', {
        method: 'POST',
        headers: {
          'Authorization': helenaToken,
          'accept': 'application/json',
          'content-type': 'application/*+json',
        },
        body: JSON.stringify({
          name,
          phoneNumber: cleanPhone,
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('[Helena Contact Search] Create error:', createResponse.status, errorText);
        return new Response(
          JSON.stringify({ success: false, error: `Helena API error: ${createResponse.status}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: createResponse.status }
        );
      }

      const createdContact = await createResponse.json();
      console.log('[Helena Contact Search] Contact created:', createdContact.id);

      const contact: HelenaContact = {
        id: createdContact.id,
        name: createdContact.name || createdContact.nameWhatsapp || name,
        nameWhatsapp: createdContact.nameWhatsapp,
        phoneNumber: createdContact.phoneNumber || cleanPhone,
        phoneNumberFormatted: createdContact.phoneNumberFormatted,
        email: createdContact.email,
        tagNames: createdContact.tagNames || [],
        portfolioNames: createdContact.portfolioNames || [],
      };

      return new Response(
        JSON.stringify({ success: true, data: contact }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
      );

    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action. Use "search" or "create"' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

  } catch (error) {
    console.error('[Helena Contact Search] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (e) {
        console.error('[Helena Contact Search] Error closing connection:', e);
      }
    }
  }
});
