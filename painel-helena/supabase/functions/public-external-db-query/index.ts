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
    // Verifica se é exatamente atendejulia.com.br ou qualquer subdomínio
    return hostname === 'atendejulia.com.br' || hostname.endsWith('.atendejulia.com.br');
  } catch {
    // Fallback para verificação por string
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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-token, x-request-timestamp, x-referer, referer',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
};

const validateRequestOrigin = (req: Request): { valid: boolean; error?: string } => {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  
  // Em desenvolvimento, ser mais permissivo
  if (isDevelopmentOrigin(origin) || isDevelopmentOrigin(referer)) {
    console.log('[Security] Development mode - allowing request');
    return { valid: true };
  }
  
  // Validar se a origem é permitida (domínio principal ou subdomínios)
  if (isAllowedDomain(origin) || isAllowedDomain(referer)) {
    console.log('[Security] Valid atendejulia.com.br domain - allowing request');
    return { valid: true };
  }
  
  console.warn('[Security] Invalid origin/referer:', { origin, referer });
  return { 
    valid: false, 
    error: 'Unauthorized origin. Access only allowed from atendejulia.com.br' 
  };
};

const validateSessionToken = (req: Request): { valid: boolean; error?: string } => {
  const sessionToken = req.headers.get('x-session-token');
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  
  if (!sessionToken) {
    // Permitir sem token em desenvolvimento
    if (isDevelopmentOrigin(origin) || isDevelopmentOrigin(referer)) {
      console.log('[Security] Development mode - allowing without session token');
      return { valid: true };
    }
    // Permitir sem token para domínios atendejulia.com.br (produção)
    if (isAllowedDomain(origin) || isAllowedDomain(referer)) {
      console.log('[Security] Production atendejulia domain - allowing without session token');
      return { valid: true };
    }
    console.warn('[Security] Missing session token for unknown origin:', { origin, referer });
    return { valid: false, error: 'Missing session token' };
  }
  
  try {
    // Decodificar token (formato: base64(timestamp:countId))
    const decoded = atob(sessionToken);
    const [timestampStr] = decoded.split(':');
    const timestamp = parseInt(timestampStr, 10);
    
    if (isNaN(timestamp)) {
      return { valid: false, error: 'Invalid session token format' };
    }
    
    // Verificar se não expirou (30 minutos)
    const currentTime = Date.now();
    const maxAge = 30 * 60 * 1000;
    
    if (currentTime - timestamp > maxAge) {
      console.warn('[Security] Session token expired');
      return { valid: false, error: 'Session token expired' };
    }
    
    return { valid: true };
  } catch (e) {
    console.warn('[Security] Failed to decode session token');
    return { valid: false, error: 'Invalid session token' };
  }
};

interface QueryRequest {
  query: string;
  params?: any[];
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
    console.log('[Public External DB Query] Attempting connection to external database...');
    await client.connect();
    console.log('[Public External DB Query] Successfully connected to external database');
    return client;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
    console.error('[Public External DB Query] Connection failed:', errorMessage);
    throw new Error(`Failed to connect to external database: ${errorMessage}`);
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let client: Client | null = null;

  try {
    // ===== VALIDAÇÃO DE SEGURANÇA =====
    
    // 1. Validar origem
    const originValidation = validateRequestOrigin(req);
    if (!originValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: originValidation.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }
    
    // 2. Validar token de sessão
    const tokenValidation = validateSessionToken(req);
    if (!tokenValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: tokenValidation.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // ===== LÓGICA ORIGINAL =====
    const { query, params = [] }: QueryRequest = await req.json();

    if (!query) {
      throw new Error('Query is required');
    }

    console.log('[Public External DB Query] Executing public query:', query.substring(0, 100));

    client = await getExternalDbClient();

    const result = await client.queryObject(query, params);

    const convertedRows = convertBigIntToNumber(result.rows);

    console.log(`[Public External DB Query] Success. Rows: ${result.rowCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: convertedRows,
        rowCount: result.rowCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[Public External DB Query] Error:', error);
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
  } finally {
    if (client) {
      try {
        await client.end();
        console.log('[Public External DB Query] Database connection closed');
      } catch (closeError) {
        const closeMessage = closeError instanceof Error ? closeError.message : 'Unknown close error';
        console.error('[Public External DB Query] Error closing connection:', closeMessage);
      }
    }
  }
});
