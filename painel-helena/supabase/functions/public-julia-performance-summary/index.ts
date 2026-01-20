import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const allowedOrigins = [
  'https://atendejulia.com.br',
  'https://www.atendejulia.com.br',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

const getCorsHeaders = (origin: string | null): Record<string, string> => {
  // Permitir localhost, lovable.app e lovableproject.com em desenvolvimento
  const isDevelopment = origin?.includes('localhost') || 
                        origin?.includes('127.0.0.1') ||
                        origin?.includes('lovable.app') ||
                        origin?.includes('lovableproject.com');
  
  // Verificar se é domínio atendejulia.com.br ou qualquer subdomínio
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

const validateRequestOrigin = (req: Request): { valid: boolean; error?: string } => {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  
  // Em desenvolvimento, ser mais permissivo
  const isDevelopment = origin?.includes('localhost') || 
                        origin?.includes('127.0.0.1') ||
                        origin?.includes('lovable.app') ||
                        origin?.includes('lovableproject.com') ||
                        referer?.includes('localhost') ||
                        referer?.includes('127.0.0.1') ||
                        referer?.includes('lovable.app') ||
                        referer?.includes('lovableproject.com');
  
  if (isDevelopment) {
    console.log('[Security] Development mode - allowing request');
    return { valid: true };
  }
  
  // Validar se a origem é permitida
  const allowedDomain = 'atendejulia.com.br';
  const isValidOrigin = origin?.includes(allowedDomain) || false;
  const isValidReferer = referer?.includes(allowedDomain) || false;
  
  if (!isValidOrigin && !isValidReferer) {
    console.warn('[Security] Invalid origin/referer:', { origin, referer });
    return { 
      valid: false, 
      error: `Unauthorized origin. Access only allowed from ${allowedDomain}` 
    };
  }
  
  return { valid: true };
};

const validateSessionToken = (req: Request): { valid: boolean; error?: string } => {
  const sessionToken = req.headers.get('x-session-token');
  
  if (!sessionToken) {
    // Permitir sem token em desenvolvimento
    const origin = req.headers.get('origin');
    if (origin?.includes('localhost') || origin?.includes('127.0.0.1') || origin?.includes('lovable.app') || origin?.includes('lovableproject.com')) {
      return { valid: true };
    }
    console.warn('[Security] Missing session token');
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
    console.log('[Public Julia Performance Summary] Attempting connection to external database...');
    await client.connect();
    console.log('[Public Julia Performance Summary] Successfully connected to external database');
    return client;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
    console.error('[Public Julia Performance Summary] Connection failed:', errorMessage);
    throw new Error(`Failed to connect to external database: ${errorMessage}`);
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
    const { tipoAgente, agentId, dataInicio, dataFim, codAgents }: SummaryRequest = await req.json();

    console.log(`[Public Julia Performance Summary] Public request for summary`, {
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

      console.log('[Public Julia Performance Summary] Success:', summary);

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
        console.log('[Public Julia Performance Summary] Database connection closed');
      } catch (closeError) {
        const closeMessage = closeError instanceof Error ? closeError.message : 'Unknown close error';
        console.error('[Public Julia Performance Summary] Error closing connection:', closeMessage);
      }
    }

  } catch (error) {
    console.error('[Public Julia Performance Summary] Error:', error);
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
