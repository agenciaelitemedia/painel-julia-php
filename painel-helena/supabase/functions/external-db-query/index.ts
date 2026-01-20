import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueryRequest {
  query: string;
  params?: any[];
}

// Função para converter BigInt para Number em objetos e normalizar datas
function convertBigIntToNumber(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  // Garante que campos de data cheguem como string ISO no frontend
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

  // Normaliza o conteúdo do certificado para o formato PEM esperado pelo driver
  const normalizeCaCertificates = (input: string): string[] => {
    // Converte quebras de linha possíveis (\n literais, \r\n, espaços)
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

    // Se o regex não encontrou nenhum bloco, usa o valor bruto como fallback
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
    console.log('[External DB Query] Attempting connection to external database...');
    await client.connect();
    console.log('[External DB Query] Successfully connected to external database');
    return client;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
    console.error('[External DB Query] Connection failed:', errorMessage);
    throw new Error(`Failed to connect to external database: ${errorMessage}`);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`[External DB Query] User ${user.id} executing query`);

    // Parse request
    const { query, params = [] }: QueryRequest = await req.json();

    if (!query) {
      throw new Error('Query is required');
    }

    // Connect to external database
    const client = await getExternalDbClient();

    try {
      // Execute query
      console.log('[External DB Query] Executing query:', query.substring(0, 100));
      const result = await client.queryObject(query, params);
      
      console.log(`[External DB Query] Query executed successfully. Rows: ${result.rows.length}`);

      // Converter BigInt para Number antes de serializar
      const convertedData = convertBigIntToNumber(result.rows);

      return new Response(
        JSON.stringify({
          success: true,
          data: convertedData,
          rowCount: result.rows.length
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    } catch (queryError) {
      const errorMessage = queryError instanceof Error ? queryError.message : 'Unknown query error';
      console.error('[External DB Query] Query execution failed:', errorMessage);
      throw queryError;
    } finally {
      try {
        await client.end();
        console.log('[External DB Query] Database connection closed');
      } catch (closeError) {
        const closeErrorMessage = closeError instanceof Error ? closeError.message : 'Unknown close error';
        console.error('[External DB Query] Error closing connection:', closeErrorMessage);
      }
    }

  } catch (error) {
    console.error('[External DB Query] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
