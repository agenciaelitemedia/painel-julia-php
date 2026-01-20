/**
 * Cliente unificado de WhatsApp
 * Ponto único de entrada para todas as operações de WhatsApp
 * Detecta automaticamente o provider e delega para o adapter correto
 */

import { supabase } from '@/integrations/supabase/client';
import { WhatsAppAdapterFactory } from '../factory/adapter-factory';
import type { IWhatsAppAdapter } from '../adapters/base.adapter';
import type {
  NormalizedInstance,
  NormalizedMessage,
  NormalizedContact,
  NormalizedWebhookEvent,
  SendTextParams,
  SendMediaParams,
  SendLocationParams,
  SendContactParams,
  MarkAsReadParams,
  ArchiveChatParams,
  MuteChatParams,
  GetChatsParams,
  GetMessagesParams,
  ApiResponse,
  CreateInstanceOptions,
  WhatsAppProvider,
} from '../types/common';

// Cache do token da instância ativa
let cachedInstanceToken: string | null = null;
let cachedProvider: WhatsAppProvider | null = null;
let cachedAt = 0;
const CACHE_TTL = 30000; // 30 segundos

export class WhatsAppClient {
  /**
   * Obter token e provider da instância conectada
   */
  private async getActiveInstance(): Promise<{ token: string; provider: WhatsAppProvider }> {
    // Retornar cache se válido
    if (cachedInstanceToken && cachedProvider && Date.now() - cachedAt < CACHE_TTL) {
      return { token: cachedInstanceToken, provider: cachedProvider };
    }

    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('api_token, provider, instance_id')
      .eq('status', 'connected')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data?.api_token) {
      throw new Error('Nenhuma instância WhatsApp conectada.');
    }

    cachedInstanceToken = data.api_token as string;
    cachedProvider = (data.provider as WhatsAppProvider) || 'uazap';
    cachedAt = Date.now();

    return { token: cachedInstanceToken, provider: cachedProvider };
  }

  /**
   * Obter adapter para um provider específico
   */
  private getAdapter(provider: WhatsAppProvider): IWhatsAppAdapter {
    return WhatsAppAdapterFactory.getAdapter(provider);
  }

  /**
   * Obter adapter da instância ativa
   */
  private async getActiveAdapter(): Promise<IWhatsAppAdapter> {
    const { provider } = await this.getActiveInstance();
    return this.getAdapter(provider);
  }

  /**
   * Criar instância
   */
  async createInstance(
    name: string,
    provider: WhatsAppProvider,
    options?: CreateInstanceOptions
  ): Promise<ApiResponse<NormalizedInstance>> {
    const adapter = this.getAdapter(provider);
    return adapter.createInstance(name, options);
  }

  /**
   * Deletar instância
   */
  async deleteInstance(instanceToken: string, provider: WhatsAppProvider): Promise<ApiResponse> {
    const adapter = this.getAdapter(provider);
    return adapter.deleteInstance(instanceToken);
  }

  /**
   * Conectar instância (gerar QR Code)
   */
  async connectInstance(
    instanceToken: string,
    provider: WhatsAppProvider
  ): Promise<ApiResponse<{ qrCode?: string; status: string }>> {
    const adapter = this.getAdapter(provider);
    return adapter.connectInstance(instanceToken);
  }

  /**
   * Desconectar instância
   */
  async disconnectInstance(instanceToken: string, provider: WhatsAppProvider): Promise<ApiResponse> {
    const adapter = this.getAdapter(provider);
    return adapter.disconnectInstance(instanceToken);
  }

  /**
   * Obter status da instância
   */
  async getInstanceStatus(instanceToken: string, provider: WhatsAppProvider): Promise<ApiResponse> {
    const adapter = this.getAdapter(provider);
    return adapter.getInstanceStatus(instanceToken) as any;
  }

  /**
   * Obter informações do perfil
   */
  async getProfileInfo(
    instanceToken: string,
    provider: WhatsAppProvider
  ): Promise<ApiResponse<{ name: string; picture?: string; phone: string }>> {
    const adapter = this.getAdapter(provider);
    return adapter.getProfileInfo(instanceToken);
  }

  /**
   * Enviar texto usando instância ativa
   */
  async sendText(params: SendTextParams): Promise<ApiResponse> {
    const { token, provider } = await this.getActiveInstance();
    const adapter = this.getAdapter(provider);

    // UAZAP implementation (outros providers implementarão seus próprios métodos)
    if (provider === 'uazap') {
      const API_BASE_URL = import.meta.env.VITE_UAZAP_API_URL || 'https://atende-julia.uazapi.com';
      const chatid = params.number.includes('@') ? params.number : `${params.number}@s.whatsapp.net`;

      const response = await fetch(`${API_BASE_URL}/send/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token,
        },
        body: JSON.stringify({ ...params, number: chatid }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      const result = await response.json();
      
      // Registrar no cache do webhook para identificar como mensagem API
      if (result.data?.messageId || result.messageId) {
        const messageId = result.data?.messageId || result.messageId;
        await this.registerApiMessage(messageId);
      }

      return result;
    }

    throw new Error(`sendText not implemented for provider: ${provider}`);
  }

  /**
   * Enviar mídia usando instância ativa
   */
  async sendMedia(params: SendMediaParams): Promise<ApiResponse> {
    const { token, provider } = await this.getActiveInstance();

    if (provider === 'uazap') {
      const API_BASE_URL = import.meta.env.VITE_UAZAP_API_URL || 'https://atende-julia.uazapi.com';
      const chatid = params.number.includes('@') ? params.number : `${params.number}@s.whatsapp.net`;

      const response = await fetch(`${API_BASE_URL}/send/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token,
        },
        body: JSON.stringify({ ...params, number: chatid }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mídia');
      }

      const result = await response.json();
      
      // Registrar no cache do webhook
      if (result.data?.messageId || result.messageId) {
        const messageId = result.data?.messageId || result.messageId;
        await this.registerApiMessage(messageId);
      }

      return result;
    }

    throw new Error(`sendMedia not implemented for provider: ${provider}`);
  }

  /**
   * Enviar localização usando instância ativa
   */
  async sendLocation(params: SendLocationParams): Promise<ApiResponse> {
    const { token, provider } = await this.getActiveInstance();

    if (provider === 'uazap') {
      const API_BASE_URL = import.meta.env.VITE_UAZAP_API_URL || 'https://atende-julia.uazapi.com';
      const chatid = params.number.includes('@') ? params.number : `${params.number}@s.whatsapp.net`;

      const response = await fetch(`${API_BASE_URL}/send/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token,
        },
        body: JSON.stringify({ ...params, number: chatid }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar localização');
      }

      const result = await response.json();
      
      // Registrar no cache do webhook
      if (result.data?.messageId || result.messageId) {
        const messageId = result.data?.messageId || result.messageId;
        await this.registerApiMessage(messageId);
      }

      return result;
    }

    throw new Error(`sendLocation not implemented for provider: ${provider}`);
  }

  /**
   * Enviar contato usando instância ativa
   */
  async sendContact(params: SendContactParams): Promise<ApiResponse> {
    const { token, provider } = await this.getActiveInstance();

    if (provider === 'uazap') {
      const API_BASE_URL = import.meta.env.VITE_UAZAP_API_URL || 'https://atende-julia.uazapi.com';
      const API_TOKEN = import.meta.env.VITE_UAZAP_API_TOKEN || 'b4d225bb-0d69-4ee1-a996-630e51e9e6f1';

      const response = await fetch(`${API_BASE_URL}/send/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar contato');
      }

      return response.json();
    }

    throw new Error(`sendContact not implemented for provider: ${provider}`);
  }

  /**
   * Marcar como lido usando instância ativa
   */
  async markAsRead(params: MarkAsReadParams): Promise<ApiResponse> {
    try {
      // Limpar cache e buscar token atualizado diretamente do banco
      cachedInstanceToken = null;
      cachedProvider = null;
      
      const { token, provider } = await this.getActiveInstance();

      // Validar que o token é válido
      if (!token || token.length < 10) {
        console.error('[markAsRead] Token inválido:', token);
        return { success: true, data: { warning: 'Token inválido, operação ignorada' } };
      }

      if (provider === 'uazap') {
        const API_BASE_URL = import.meta.env.VITE_UAZAP_API_URL || 'https://atende-julia.uazapi.com';
        const chatid = params.number.includes('@') ? params.number : `${params.number}@s.whatsapp.net`;

        console.log('[markAsRead] Usando token:', token.substring(0, 8) + '...', 'para', chatid);

        const response = await fetch(`${API_BASE_URL}/chat/read`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': token,
          },
          body: JSON.stringify({ number: chatid, read: params.read }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          
          // Erro 409/500 com "conflict" é comum quando há múltiplas tentativas de marcar como lido
          // Isso acontece naturalmente na API UAZAP e não afeta a funcionalidade
          if (response.status === 500 && errorText.includes('conflict')) {
            console.log('[markAsRead] ⚠️ Conflito ao marcar como lido (esperado quando há múltiplas tentativas simultâneas)');
            return { success: true, data: { warning: 'Conflito ao marcar como lido' } };
          }
          
          console.error('[markAsRead] Erro da API:', response.status, errorText);
          // Retornar sucesso mesmo com erro, pois é um problema da API externa
          return { success: true, data: { warning: 'Não foi possível marcar como lido no WhatsApp' } };
        }

        return response.json();
      }

      throw new Error(`markAsRead not implemented for provider: ${provider}`);
    } catch (error) {
      console.error('[markAsRead] Erro ao marcar como lido:', error);
      // Retornar sucesso para não quebrar o fluxo
      return { success: true, data: { warning: 'Erro ao marcar como lido' } };
    }
  }

  /**
   * Arquivar chat usando instância ativa
   */
  async archiveChat(params: ArchiveChatParams): Promise<ApiResponse> {
    const { provider } = await this.getActiveInstance();
    const adapter = this.getAdapter(provider);
    return adapter.archiveChat(params);
  }

  /**
   * Silenciar chat usando instância ativa
   */
  async muteChat(params: MuteChatParams): Promise<ApiResponse> {
    const { provider } = await this.getActiveInstance();
    const adapter = this.getAdapter(provider);
    return adapter.muteChat(params);
  }

  /**
   * Buscar chats usando instância ativa
   */
  async getChats(params: GetChatsParams = {}): Promise<ApiResponse> {
    const { token, provider } = await this.getActiveInstance();

    if (provider === 'uazap') {
      const API_BASE_URL = import.meta.env.VITE_UAZAP_API_URL || 'https://atende-julia.uazapi.com';
      
      const body: any = {};
      if (params.limit) body.limit = params.limit;
      if (params.offset) body.offset = params.offset;
      if (params.archived !== undefined) body.wa_archived = params.archived;
      body.sort = '-wa_lastMsgTimestamp';

      const response = await fetch(`${API_BASE_URL}/chat/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar conversas');
      }

      return response.json();
    }

    throw new Error(`getChats not implemented for provider: ${provider}`);
  }

  /**
   * Buscar mensagens usando instância ativa
   */
  async getMessages(params: GetMessagesParams): Promise<ApiResponse> {
    const { token, provider } = await this.getActiveInstance();

    if (provider === 'uazap') {
      const API_BASE_URL = import.meta.env.VITE_UAZAP_API_URL || 'https://atende-julia.uazapi.com';
      const chatid = params.number.includes('@') ? params.number : `${params.number}@s.whatsapp.net`;

      const body: any = {
        chatid,
        sort: '-timestamp',
      };
      if (params.limit) body.limit = params.limit;
      if (params.offset) body.offset = params.offset;

      const response = await fetch(`${API_BASE_URL}/message/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar mensagens');
      }

      return response.json();
    }

    throw new Error(`getMessages not implemented for provider: ${provider}`);
  }

  /**
   * Download de mídia usando instância ativa
   * CORRIGIDO: usa mesmo formato que código antigo que funcionava
   */
  async downloadMedia(messageId: string): Promise<string> {
    const { token, provider } = await this.getActiveInstance();

    if (provider === 'uazap') {
      const API_BASE_URL = import.meta.env.VITE_UAZAP_API_URL || 'https://atende-julia.uazapi.com';

      // Função de tentativa (igual código antigo)
      const attempt = async () => {
        const response = await fetch(`${API_BASE_URL}/message/download`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': token,
          },
          body: JSON.stringify({
            id: messageId,           // USA 'id' ao invés de 'messageid'
            generate_mp3: true,      // retorna MP3 reproduzível no navegador
            return_link: true,       // preferir URL pública
            return_base64: false     // não retorna base64 (prefere link)
          }),
        });
        return response;
      };

      let lastErrorText = '';
      // Retry logic: 5 tentativas como código antigo
      for (let i = 0; i < 5; i++) {
        const res = await attempt();
        
        if (res.ok) {
          const data = await res.json();
          
          // Priorizar fileURL (link público)
          if (data.fileURL) return data.fileURL as string;
          
          // Fallback para base64 se retornar
          if (data.base64Data) {
            const mime = (data.mimetype as string) || 'audio/mpeg';
            return `data:${mime};base64,${data.base64Data}`;
          }
          
          throw new Error('Resposta inválida do download de mídia');
        }

        // Captura texto do erro para logs
        lastErrorText = await res.text().catch(() => '');
        console.warn(`downloadMedia tentativa ${i + 1}/5 falhou:`, lastErrorText);

        // Se for 404 (mensagem ainda não indexada), aguarda e tenta de novo
        if (res.status === 404 || /Message not found/i.test(lastErrorText)) {
          await new Promise(r => setTimeout(r, 900 + i * 300));
          continue;
        }

        // Outros erros: não adianta tentar novamente
        break;
      }

      // Se todas tentativas falharam, buscar no banco como fallback
      console.error('Erro ao baixar mídia via /message/download após 5 tentativas:', lastErrorText);
      
      try {
        const { data: dbMsg } = await supabase
          .from('messages')
          .select('media_url, text, metadata')
          .eq('message_id', String(messageId))
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (dbMsg?.media_url && !/\.enc(?:$|[?&#])/i.test(String(dbMsg.media_url))) {
          console.log('Usando media_url do banco como fallback');
          return dbMsg.media_url as string;
        }

        // Tentar extrair URL de dentro do metadata
        const meta = dbMsg?.metadata as any;
        const metaUrl = meta?.url || meta?.URL || meta?.content?.URL || meta?.content?.url;
        if (typeof metaUrl === 'string' && metaUrl.startsWith('http') && !/\.enc(?:$|[?&#])/i.test(metaUrl)) {
          console.log('Usando URL do metadata como fallback');
          return metaUrl;
        }

        // Usar thumbnail como último recurso
        const thumb = meta?.JPEGThumbnail || meta?.jpegThumbnail || meta?.thumbnail;
        if (typeof thumb === 'string' && thumb.length > 100) {
          console.log('Usando thumbnail como fallback');
          return thumb.startsWith('data:') ? thumb : `data:image/jpeg;base64,${thumb}`;
        }

        // URL no campo texto
        const textUrl = typeof dbMsg?.text === 'string' && dbMsg.text.match(/^https?:\/\//) ? dbMsg.text : null;
        if (textUrl && !/\.enc(?:$|[?&#])/i.test(textUrl)) {
          console.log('Usando URL do texto como fallback');
          return textUrl;
        }
      } catch (e) {
        console.warn('Fallback do banco também falhou:', e);
      }

      throw new Error('Erro ao baixar mídia');
    }

    throw new Error(`downloadMedia not implemented for provider: ${provider}`);
  }

  /**
   * Configurar webhook
   */
  async configureWebhook(
    instanceToken: string,
    provider: WhatsAppProvider,
    webhookUrl: string,
    events: string[]
  ): Promise<ApiResponse> {
    const adapter = this.getAdapter(provider);
    return adapter.configureWebhook(instanceToken, webhookUrl, events);
  }

  /**
   * Parser de webhook - detecta provider automaticamente e normaliza
   */
  parseWebhook(rawData: any): NormalizedWebhookEvent | null {
    // Tentar detectar provider pelo formato dos dados
    if (rawData.EventType || rawData.token) {
      // UAZAP format
      const adapter = this.getAdapter('uazap');
      return adapter.parseWebhook(rawData);
    } else if (rawData.event && rawData.instance) {
      // Evolution format
      const adapter = this.getAdapter('evolution');
      return adapter.parseWebhook(rawData);
    } else if (rawData.object === 'whatsapp_business_account') {
      // WhatsApp Official format
      const adapter = this.getAdapter('official');
      return adapter.parseWebhook(rawData);
    }

    console.warn('Unknown webhook format:', rawData);
    return null;
  }

  /**
   * Obter status de conexão usando instância ativa
   */
  async getConnectionStatus(): Promise<ApiResponse> {
    const { token, provider } = await this.getActiveInstance();

    if (provider === 'uazap') {
      const API_BASE_URL = import.meta.env.VITE_UAZAP_API_URL || 'https://atende-julia.uazapi.com';

      const response = await fetch(`${API_BASE_URL}/instance/status`, {
        method: 'GET',
        headers: {
          'token': token,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao verificar status');
      }

      return response.json();
    }

    throw new Error(`getConnectionStatus not implemented for provider: ${provider}`);
  }

  /**
   * Obter QR Code
   */
  /**
   * Obter QR Code
   */
  async getQRCode(instanceToken: string, provider: WhatsAppProvider): Promise<any> {
    const adapter = this.getAdapter(provider);
    const response = await adapter.connectInstance(instanceToken);
    
    // Se já está conectado, retornar status sem QR Code
    if (response.data?.status === 'connected') {
      return {
        success: true,
        response: 'Already connected',
        data: {
          instance: {
            status: 'connected'
          }
        }
      };
    }
    
    // Se tem QR Code, retornar no formato esperado
    if (response.data?.qrCode) {
      return {
        success: true,
        qrcode: response.data.qrCode,
        data: {
          qrcode: response.data.qrCode
        }
      };
    }
    
    return response;
  }

  /**
   * Registrar mensagem enviada pela API no webhook
   */
  private async registerApiMessage(messageId: string): Promise<void> {
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('[registerApiMessage] Supabase não configurado');
        return;
      }
      
      const webhookUrl = `${SUPABASE_URL}/functions/v1/whatsapp-webhook/register-api-message`;
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ messageId }),
      });
      
      if (!response.ok) {
        console.error('[registerApiMessage] Erro ao registrar:', await response.text());
      } else {
        console.log('[registerApiMessage] Mensagem registrada:', messageId);
      }
    } catch (error) {
      console.error('[registerApiMessage] Erro:', error);
    }
  }

  /**
   * Limpar cache
   */
  clearCache(): void {
    cachedInstanceToken = null;
    cachedProvider = null;
    cachedAt = 0;
  }
}

// Exportar instância singleton
export const whatsappClient = new WhatsAppClient();
