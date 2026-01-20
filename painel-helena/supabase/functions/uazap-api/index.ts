import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ADMIN_TOKEN = Deno.env.get('UAZAP_ADMIN_TOKEN');
    if (!ADMIN_TOKEN) {
      throw new Error('UAZAP_ADMIN_TOKEN não configurado');
    }

    const { action, apiUrl, instanceToken, body, params } = await req.json();

    console.log('UAZAP API Request:', { action, apiUrl, instanceToken });
    console.log('ADMIN_TOKEN length:', ADMIN_TOKEN?.length);
    console.log('API URL:', apiUrl);

    let response;
    let endpoint = '';
    let method = 'GET';
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    let requestBody = null;

    // Determinar endpoint, método e headers baseado na ação
    switch (action) {
      case 'createInstance':
        endpoint = `${apiUrl}/instance/init`;
        method = 'POST';
        headers['admintoken'] = ADMIN_TOKEN;
        const payload = { ...(body || {}) };
        if (payload.instanceName && !payload.name) payload.name = payload.instanceName;
        if (payload.name && !payload.instanceName) payload.instanceName = payload.name;
        console.log('createInstance payload keys:', Object.keys(payload));
        requestBody = payload;
        break;

      case 'deleteInstance':
        endpoint = `${apiUrl}/instance`;
        method = 'DELETE';
        headers['token'] = instanceToken;
        break;

      case 'getInstanceStatus':
        endpoint = `${apiUrl}/instance/connectionState`;
        headers['token'] = instanceToken;
        break;

      case 'getQRCode':
        endpoint = `${apiUrl}/instance/connect`;
        headers['token'] = instanceToken;
        break;

      case 'logoutInstance':
        endpoint = `${apiUrl}/instance/logout/${instanceToken}`;
        method = 'DELETE';
        headers['token'] = instanceToken;
        break;

      case 'sendText':
        endpoint = `${apiUrl}/message/sendText/${instanceToken}`;
        method = 'POST';
        headers['token'] = instanceToken;
        requestBody = body;
        break;

      case 'sendMedia':
        const mediaEndpoint = body.mediaType === 'sticker' 
          ? 'sendSticker' 
          : body.mediaType === 'audio' 
          ? 'sendWhatsAppAudio' 
          : 'sendMedia';
        endpoint = `${apiUrl}/message/${mediaEndpoint}/${instanceToken}`;
        method = 'POST';
        headers['token'] = instanceToken;
        requestBody = body;
        break;

      case 'sendContact':
        endpoint = `${apiUrl}/message/sendContact/${instanceToken}`;
        method = 'POST';
        headers['token'] = instanceToken;
        requestBody = body;
        break;

      case 'sendLocation':
        endpoint = `${apiUrl}/message/sendLocation/${instanceToken}`;
        method = 'POST';
        headers['token'] = instanceToken;
        requestBody = body;
        break;

      case 'markAsRead':
        endpoint = `${apiUrl}/chat/markChatUnread/${instanceToken}`;
        method = 'POST';
        headers['token'] = instanceToken;
        requestBody = body;
        break;

      case 'archiveChat':
        endpoint = `${apiUrl}/chat/archiveChat/${instanceToken}`;
        method = 'POST';
        headers['token'] = instanceToken;
        requestBody = body;
        break;

      case 'getChats':
        endpoint = `${apiUrl}/chat/findChats/${instanceToken}`;
        headers['token'] = instanceToken;
        break;

      case 'getMessages':
        endpoint = `${apiUrl}/chat/findMessages/${instanceToken}?chatId=${params.chatId}&limit=${params.limit || 50}`;
        headers['token'] = instanceToken;
        break;

      case 'configureWebhook':
        endpoint = `${apiUrl}/webhook/set`;
        method = 'POST';
        headers['token'] = instanceToken;
        requestBody = body;
        break;

      case 'downloadMedia':
        endpoint = `${apiUrl}/message/downloadMedia/${instanceToken}`;
        method = 'POST';
        headers['token'] = instanceToken;
        requestBody = body;
        break;

      default:
        throw new Error(`Ação não suportada: ${action}`);
    }
    if (action === 'deleteInstance') {
      const attempts: Array<{ method: string; url: string; headers: Record<string, string>; body?: any }> = [
        { method: 'DELETE', url: `${apiUrl}/instance`, headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'token': instanceToken } },
        { method: 'POST', url: `${apiUrl}/instance/delete`, headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'token': instanceToken }, body: {} },
        { method: 'DELETE', url: `${apiUrl}/instance/delete/${instanceToken}`, headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'admintoken': ADMIN_TOKEN } },
        { method: 'POST', url: `${apiUrl}/instance/delete`, headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'admintoken': ADMIN_TOKEN }, body: { token: instanceToken } },
      ];
      let lastErrorText = '';
      for (const a of attempts) {
        try {
          console.log('Trying delete endpoint:', a);
          const res = await fetch(a.url, { method: a.method, headers: a.headers, body: a.body ? JSON.stringify(a.body) : null });
          if (res.ok) {
            const data = await res.json().catch(() => ({ success: true }));
            return new Response(JSON.stringify(data), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } else {
            lastErrorText = await res.text();
            console.error('Delete attempt failed:', res.status, lastErrorText);
          }
        } catch (e) {
          console.error('Delete attempt error:', e);
        }
      }
      throw new Error(`Erro na API UAZAP (delete): ${lastErrorText || 'todas as tentativas falharam'}`);
    }

    console.log('Calling UAZAP API:', { method, endpoint });

    // Fazer a requisição para a API UAZAP
    response = await fetch(endpoint, {
      method,
      headers,
      body: requestBody ? JSON.stringify(requestBody) : null,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('UAZAP API Error:', error);
      throw new Error(`Erro na API UAZAP: ${error}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in uazap-api function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
