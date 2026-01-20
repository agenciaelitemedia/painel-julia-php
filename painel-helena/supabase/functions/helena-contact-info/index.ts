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

interface ContactInfoRequest {
  helena_count_id: string;
  contact_id: string;
}

interface TagInfo {
  id: string;
  name: string;
  bgColor?: string;
  textColor?: string;
}

interface PortfolioInfo {
  id: string;
  name: string;
}

interface HelenaContactResponse {
  id: string;
  name: string;
  nameWhatsapp?: string;
  phoneNumber: string;
  phoneNumberFormatted?: string;
  email?: string;
  instagram?: string;
  annotation?: string;
  tags: TagInfo[];
  portfolios: PortfolioInfo[];
  createdAt?: string;
  updatedAt?: string;
  status?: string;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let client: Client | null = null;

  try {
    const { helena_count_id, contact_id }: ContactInfoRequest = await req.json();

    if (!helena_count_id || !contact_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing helena_count_id or contact_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('[Helena Contact Info] Fetching contact:', { helena_count_id, contact_id });

    // 1. Get helena_token from external database
    client = await getExternalDbClient();
    
    // Find token by helena_count_id (without wp_number constraint)
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
      console.error('[Helena Contact Info] Token not found for count_id:', helena_count_id);
      // Return empty data instead of error (graceful fallback)
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: null,
          fallback: true,
          message: 'Contact info not available'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const helenaToken = tokenResult.rows[0].helena_token;
    console.log('[Helena Contact Info] Token found, calling Helena API');

    // 2. Call Helena API to get contact details (correct URL: api.wts.chat)
    const helenaApiUrl = `https://api.wts.chat/core/v1/contact/${contact_id}`;
    
    const helenaResponse = await fetch(helenaApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': helenaToken,
        'accept': 'application/json',
      },
    });

    if (!helenaResponse.ok) {
      console.error('[Helena Contact Info] Helena API error:', helenaResponse.status, await helenaResponse.text());
      return new Response(
        JSON.stringify({ success: false, error: `Helena API error: ${helenaResponse.status}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: helenaResponse.status }
      );
    }

    const contactData = await helenaResponse.json();
    console.log('[Helena Contact Info] Contact data received:', contactData?.name || 'unknown');

    // 3. Fetch tags with colors if there are tagIds
    let tagsWithColors: TagInfo[] = [];
    
    if (contactData.tagIds && contactData.tagIds.length > 0) {
      try {
        const tagsApiUrl = `https://api.wts.chat/core/v1/tag`;
        const tagsResponse = await fetch(tagsApiUrl, {
          method: 'GET',
          headers: {
            'Authorization': helenaToken,
            'accept': 'application/json',
          },
        });

        if (tagsResponse.ok) {
          const allTags: Array<{ id: string; name: string; bgColor?: string; textColor?: string }> = await tagsResponse.json();
          
          // Map tagIds to full tag info with colors
          const tagIdSet = new Set(contactData.tagIds);
          tagsWithColors = allTags
            .filter(tag => tagIdSet.has(tag.id))
            .map(tag => ({
              id: tag.id,
              name: tag.name,
              bgColor: tag.bgColor,
              textColor: tag.textColor,
            }));
        }
      } catch (tagError) {
        console.error('[Helena Contact Info] Error fetching tags:', tagError);
        // Fallback to tagNames without colors
        tagsWithColors = (contactData.tagNames || []).map((name: string, index: number) => ({
          id: contactData.tagIds?.[index] || `tag-${index}`,
          name,
        }));
      }
    } else if (contactData.tagNames && contactData.tagNames.length > 0) {
      // Use tagNames as fallback
      tagsWithColors = contactData.tagNames.map((name: string, index: number) => ({
        id: `tag-${index}`,
        name,
      }));
    }

    // 4. Map portfolios
    const portfolios: PortfolioInfo[] = [];
    if (contactData.portfolioIds && contactData.portfolioNames) {
      for (let i = 0; i < contactData.portfolioIds.length; i++) {
        portfolios.push({
          id: contactData.portfolioIds[i],
          name: contactData.portfolioNames[i] || `Portfolio ${i + 1}`,
        });
      }
    } else if (contactData.portfolioNames) {
      contactData.portfolioNames.forEach((name: string, index: number) => {
        portfolios.push({
          id: `portfolio-${index}`,
          name,
        });
      });
    }

    // 5. Format response according to API structure
    const formattedContact: HelenaContactResponse = {
      id: contactData.id,
      name: contactData.name || contactData.nameWhatsapp || 'Sem nome',
      nameWhatsapp: contactData.nameWhatsapp,
      phoneNumber: contactData.phoneNumber || '',
      phoneNumberFormatted: contactData.phoneNumberFormatted,
      email: contactData.email || undefined,
      instagram: contactData.instagram || undefined,
      annotation: contactData.annotation || undefined,
      tags: tagsWithColors,
      portfolios: portfolios,
      createdAt: contactData.createdAt || undefined,
      updatedAt: contactData.updatedAt || undefined,
      status: contactData.status || undefined,
    };

    return new Response(
      JSON.stringify({ success: true, data: formattedContact }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('[Helena Contact Info] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (e) {
        console.error('[Helena Contact Info] Error closing connection:', e);
      }
    }
  }
});