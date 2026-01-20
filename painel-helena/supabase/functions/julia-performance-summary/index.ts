import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SummaryRequest {
  tipoAgente: string;
  agentId: string | null;
  dataInicio: string;
  dataFim: string;
  codAgents: string[] | null;
}

function convertBigIntToNumber(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntToNumber(item));
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertBigIntToNumber(obj[key]);
    }
    return converted;
  }
  
  return obj;
}

async function getExternalDbClient() {
  const rawCaCert = Deno.env.get('EXTERNAL_DB_CA_CERT');

  if (!rawCaCert) {
    throw new Error('Missing EXTERNAL_DB_CA_CERT secret. Please configure the DigitalOcean CA certificate.');
  }

  const normalizeCaCertificates = (input: string): string[] => {
    const cleaned = input
      .replace(/\\n/g, '\n')
      .replace(/\r/g, '\n');

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

  try {
    console.log('[Julia Performance Summary] Attempting connection to external database...');
    await client.connect();
    console.log('[Julia Performance Summary] Successfully connected to external database');
    return client;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
    console.error('[Julia Performance Summary] Connection failed:', errorMessage);
    throw new Error(`Failed to connect to external database: ${errorMessage}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { tipoAgente, agentId, dataInicio, dataFim, codAgents }: SummaryRequest = await req.json();

    console.log(`[Julia Performance Summary] User ${user.id} requesting summary`, {
      tipoAgente,
      agentId,
      dataInicio,
      dataFim,
      hasCodAgents: codAgents !== null
    });

    const client = await getExternalDbClient();

    try {
      const query = `
        SELECT 
          COUNT(DISTINCT session_id) as total_leads,
          COUNT(DISTINCT CASE 
            WHEN LOWER(TRIM(status_document)) LIKE '%signed%' 
              OR LOWER(TRIM(status_document)) LIKE '%created%'
            THEN session_id 
          END) as total_contratos,
          COUNT(DISTINCT CASE 
            WHEN LOWER(TRIM(status_document)) LIKE '%signed%' 
            THEN session_id 
          END) as total_assinados,
          COUNT(DISTINCT CASE 
            WHEN LOWER(TRIM(status_document)) LIKE '%created%' 
            THEN session_id 
          END) as total_em_curso
        FROM public.vw_desempenho_julia
        WHERE 1=1
          AND ($1 = 'TODOS' OR perfil_agent = $1)
          AND (COALESCE($2, '') = '' OR agent_id::text = $2)
          AND created_at >= $3::timestamp
          AND created_at <= $4::timestamp
          AND ($5::text[] IS NULL OR cod_agent::text = ANY($5::text[]))
      `;

      const result = await client.queryObject(query, [
        tipoAgente,
        agentId || '',
        dataInicio,
        dataFim,
        codAgents
      ]);

      const summaryRow = (result.rows && result.rows[0]) || null;

      const summary = convertBigIntToNumber(summaryRow || {
        total_leads: 0,
        total_contratos: 0,
        total_assinados: 0,
        total_em_curso: 0
      });

      console.log('[Julia Performance Summary] Success:', summary);

      return new Response(
        JSON.stringify({
          success: true,
          data: summary
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } finally {
      try {
        await client.end();
        console.log('[Julia Performance Summary] Database connection closed');
      } catch (closeError) {
        const closeMessage = closeError instanceof Error ? closeError.message : 'Unknown close error';
        console.error('[Julia Performance Summary] Error closing connection:', closeMessage);
      }
    }

  } catch (error) {
    console.error('[Julia Performance Summary] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
