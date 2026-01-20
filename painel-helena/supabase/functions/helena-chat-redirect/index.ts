import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const allowedOrigins = [
  'https://atendejulia.com.br',
  'https://www.atendejulia.com.br',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

const FALLBACK_URL = 'https://app.atendejulia.com.br/redirect?type=SESSION&id=';

const getCorsHeaders = (origin: string | null): Record<string, string> => {
  const isDevelopment = origin?.includes('localhost') || 
                        origin?.includes('127.0.0.1') ||
                        origin?.includes('lovable.app') ||
                        origin?.includes('lovableproject.com');
  
  const isAtendejuliaDomain = origin ? 
    (origin.endsWith('atendejulia.com.br') || 
     origin.includes('.atendejulia.com.br') ||
     origin.includes('://atendejulia.com.br')) : false;
  
  const allowedOrigin = (isDevelopment || isAtendejuliaDomain) ? origin : allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin || allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-token, referer',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
};

async function getExternalDbClient() {
  const rawCaCert = Deno.env.get('EXTERNAL_DB_CA_CERT');

  if (!rawCaCert) {
    throw new Error('Missing EXTERNAL_DB_CA_CERT secret.');
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

async function getHelenaToken(client: Client, helenaCountId: string): Promise<string | null> {
  const query = `SELECT helena_token FROM public.agents_helena 
     WHERE helena_count_id = $1 AND status = true
     ORDER BY updated_at DESC
     LIMIT 1`;

  const result = await client.queryObject<{ helena_token: string }>(query, [helenaCountId]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].helena_token;
}

interface ContactData {
  id?: string;
}

interface SessionItem {
  previewUrl?: string;
}

interface SessionData {
  items?: SessionItem[];
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let client: Client | null = null;

  try {
    const { cod_agent, helena_count_id, whatsapp_number, session_id } = await req.json();

    // Se tiver session_id, buscar diretamente pela API de sessão
    if (session_id && helena_count_id) {
      client = await getExternalDbClient();
      const helenaToken = await getHelenaToken(client, helena_count_id);

      if (helenaToken) {
        try {
          const sessionResponse = await fetch(
            `https://api.wts.chat/chat/v2/session/${session_id}`,
            {
              method: 'GET',
              headers: { 'Authorization': helenaToken, 'accept': 'application/json' }
            }
          );

          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            if (sessionData?.previewUrl) {
              return new Response(
                JSON.stringify({ success: true, redirectUrl: sessionData.previewUrl }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
              );
            }
          }
        } catch {
          // Se falhar, continua para o fluxo normal
        }
      }
    }

    // Fluxo normal: precisa de helena_count_id e whatsapp_number
    if (!helena_count_id || !whatsapp_number) {
      return new Response(
        JSON.stringify({ success: true, redirectUrl: FALLBACK_URL }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (!client) {
      client = await getExternalDbClient();
    }
    const helenaToken = await getHelenaToken(client, helena_count_id);

    if (!helenaToken) {
      return new Response(
        JSON.stringify({ success: true, redirectUrl: FALLBACK_URL }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Endpoint 1: Buscar contato por telefone
    const cleanNumber = whatsapp_number.replace(/\D/g, '');
    const contactResponse = await fetch(
      `https://api.helena.run/core/v1/contact/phonenumber/${cleanNumber}?IncludeDetails=Portfolios`,
      {
        method: 'GET',
        headers: { 'Authorization': helenaToken, 'accept': 'application/json' }
      }
    );

    if (!contactResponse.ok) {
      return new Response(
        JSON.stringify({ success: true, redirectUrl: FALLBACK_URL }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const contactData: ContactData = await contactResponse.json();
    const contactId = contactData?.id;

    if (!contactId) {
      return new Response(
        JSON.stringify({ success: true, redirectUrl: FALLBACK_URL }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Endpoint 2: Buscar sessão mais recente
    const sessionResponse = await fetch(
      `https://api.helena.run/chat/v2/session?ContactId=${contactId}&PageSize=1&OrderBy=createdAt&OrderDirection=DESCENDING`,
      {
        method: 'GET',
        headers: { 'Authorization': helenaToken, 'accept': 'application/json' }
      }
    );

    if (!sessionResponse.ok) {
      return new Response(
        JSON.stringify({ success: true, redirectUrl: FALLBACK_URL }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const sessionData: SessionData = await sessionResponse.json();
    const previewUrl = sessionData?.items?.[0]?.previewUrl;

    if (!previewUrl) {
      return new Response(
        JSON.stringify({ success: true, redirectUrl: FALLBACK_URL }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, redirectUrl: previewUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: true, redirectUrl: FALLBACK_URL }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } finally {
    if (client) {
      try {
        await client.end();
      } catch {
        // Silently ignore close errors
      }
    }
  }
});
