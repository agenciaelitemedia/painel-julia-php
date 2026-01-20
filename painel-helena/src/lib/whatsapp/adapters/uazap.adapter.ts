/**
 * Adapter para UAZAP API
 * Implementa a interface IWhatsAppAdapter para UAZAP
 */

import type { IWhatsAppAdapter } from './base.adapter';
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

import { supabase } from '@/integrations/supabase/client';

const API_BASE_URL = import.meta.env.VITE_UAZAP_API_URL || 'https://atende-julia.uazapi.com';
const ADMIN_TOKEN = import.meta.env.VITE_UAZAP_ADMIN_TOKEN;

export class UazapAdapter implements IWhatsAppAdapter {
  getProviderName(): WhatsAppProvider {
    return 'uazap';
  }

  private formatPhone(phone: string): string {
    return phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
  }

  async createInstance(name: string, options?: CreateInstanceOptions): Promise<ApiResponse<NormalizedInstance>> {
    if (!ADMIN_TOKEN) {
      throw new Error('ADMIN_TOKEN não configurado');
    }

    const response = await fetch(`${API_BASE_URL}/instance/init`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'admintoken': ADMIN_TOKEN,
      },
      body: JSON.stringify({
        name,
        systemName: 'apilocal',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const error = JSON.parse(errorText);
        throw new Error(error.error || error.message || 'Failed to create instance');
      } catch (e) {
        throw new Error(`Failed to create instance: ${errorText}`);
      }
    }

    const data = await response.json();

    // Configure webhook after instance creation
    if (data.token && options?.webhookUrl) {
      await this.configureWebhook(data.token, options.webhookUrl, ['messages', 'chats', 'connection']);
    }

    return {
      success: true,
      token: data.token, // Adicionar token no nível raiz para compatibilidade
      data: {
        id: data.token,
        name,
        status: 'disconnected',
        apiToken: data.token,
        provider: 'uazap',
      },
    } as any; // Type assertion para permitir o campo extra 'token'
  }

  async deleteInstance(instanceToken: string): Promise<ApiResponse> {
    // Usa Edge Function para lidar com CORS e header admintoken corretamente
    const { data, error } = await supabase.functions.invoke('uazap-api', {
      body: {
        action: 'deleteInstance',
        apiUrl: API_BASE_URL,
        instanceToken,
      },
    });

    if (error) {
      throw new Error(`Failed to delete instance: ${error.message || 'Unknown error'}`);
    }

    return { success: true, data } as any;
  }

  async connectInstance(instanceToken: string): Promise<ApiResponse<{ qrCode?: string; status: string }>> {
    const response = await fetch(`${API_BASE_URL}/instance/connect`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'token': instanceToken,
      },
      body: JSON.stringify({}),
    });

    // Status 409 means connection is already in progress
    if (response.status === 409) {
      const data = await response.json();
      console.log('UAZAP connect 409 response:', data);
      return {
        success: true,
        data: {
          qrCode: data.qrcode || data.qr_code || data.base64,
          status: 'connecting',
        },
      };
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || 'Erro ao conectar instância'}`);
    }

    const data = await response.json();
    console.log('UAZAP connect response:', data);
    
    // Buscar QR code em todos os possíveis formatos da API UAZAP
    const qrCode = data.qrcode || 
                   data.qr_code || 
                   data.base64 || 
                   data.data?.qrcode || 
                   data.data?.qr_code ||
                   data.data?.base64 ||
                   data.instance?.qrcode ||
                   data.instance?.qr_code ||
                   data.instance?.base64;

    return {
      success: true,
      data: {
        qrCode,
        status: data.instance?.status === 'connected' ? 'connected' : 'connecting',
      },
    };
  }

  async disconnectInstance(instanceToken: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/instance/disconnect`, {
      method: 'POST',
      headers: {
        'token': instanceToken,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to disconnect instance');
    }

    return { success: true };
  }

  async getInstanceStatus(instanceToken: string): Promise<ApiResponse<NormalizedInstance>> {
    const response = await fetch(`${API_BASE_URL}/instance/status`, {
      method: 'GET',
      headers: {
        'token': instanceToken,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao verificar status');
    }

    const data = await response.json();
    const instance = data.data?.instance || data.instance || data;

    return {
      success: true,
      data: {
        id: instanceToken,
        name: instance.name || '',
        phoneNumber: instance.owner,
        status: instance.status === 'connected' ? 'connected' : 'disconnected',
        profileName: instance.profileName,
        profilePicture: instance.profilePicUrl,
        apiToken: instanceToken,
        provider: 'uazap',
      },
    };
  }

  async getProfileInfo(instanceToken: string): Promise<ApiResponse<{ name: string; picture?: string; phone: string }>> {
    const statusResponse = await this.getInstanceStatus(instanceToken);
    const instance = statusResponse.data;

    if (!instance) {
      throw new Error('Instance not found');
    }

    return {
      success: true,
      data: {
        name: instance.profileName || '',
        picture: instance.profilePicture,
        phone: instance.phoneNumber || '',
      },
    };
  }

  async sendText(params: SendTextParams): Promise<ApiResponse<NormalizedMessage>> {
    // Get instance token from Supabase (will be handled by WhatsAppClient)
    throw new Error('Use WhatsAppClient.sendText() instead - requires instance token');
  }

  async sendMedia(params: SendMediaParams): Promise<ApiResponse<NormalizedMessage>> {
    throw new Error('Use WhatsAppClient.sendMedia() instead - requires instance token');
  }

  async sendLocation(params: SendLocationParams): Promise<ApiResponse<NormalizedMessage>> {
    throw new Error('Use WhatsAppClient.sendLocation() instead - requires instance token');
  }

  async sendContact(params: SendContactParams): Promise<ApiResponse<NormalizedMessage>> {
    throw new Error('Use WhatsAppClient.sendContact() instead - requires instance token');
  }

  async markAsRead(params: MarkAsReadParams): Promise<ApiResponse> {
    throw new Error('Use WhatsAppClient.markAsRead() instead - requires instance token');
  }

  async archiveChat(params: ArchiveChatParams): Promise<ApiResponse> {
    throw new Error('Use WhatsAppClient.archiveChat() instead - requires instance token');
  }

  async muteChat(params: MuteChatParams): Promise<ApiResponse> {
    throw new Error('Use WhatsAppClient.muteChat() instead - requires instance token');
  }

  async getChats(params: GetChatsParams): Promise<ApiResponse<NormalizedContact[]>> {
    throw new Error('Use WhatsAppClient.getChats() instead - requires instance token');
  }

  async getMessages(params: GetMessagesParams): Promise<ApiResponse<NormalizedMessage[]>> {
    throw new Error('Use WhatsAppClient.getMessages() instead - requires instance token');
  }

  async downloadMedia(messageId: string): Promise<string> {
    throw new Error('Use WhatsAppClient.downloadMedia() instead - requires instance token');
  }

  async configureWebhook(instanceToken: string, webhookUrl: string, events: string[]): Promise<ApiResponse> {
    const excludeMessages = [];

    const response = await fetch(`${API_BASE_URL}/webhook`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'token': instanceToken,
      },
      body: JSON.stringify({
        url: webhookUrl,
        events,
        excludeMessages,
        addUrlEvents: true,
        addUrlTypesMessages: true,
        status: true,
        enabled: true,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to configure webhook');
    }

    return { success: true };
  }

  parseWebhook(rawData: any): NormalizedWebhookEvent | null {
    const event = rawData.EventType || rawData.event;

    // Processar mensagens
    if (event === 'messages' && rawData.message) {
      const msg = rawData.message;
      const isFromMe = Boolean(msg.fromMe || msg.wasSentByApi);
      const isGroup = Boolean(msg.isGroup || msg.chatid?.endsWith('@g.us'));

      let phone = '';
      if (isGroup) {
        phone = (msg.chatid || '').replace('@g.us', '');
      } else if (isFromMe) {
        phone = (msg.chatid || '').replace('@s.whatsapp.net', '').replace('@c.us', '');
      } else {
        phone = (msg.sender_pn || msg.sender || '').replace('@s.whatsapp.net', '').replace('@c.us', '');
      }

      const contactName = isGroup
        ? (msg.groupName || rawData.chat?.wa_name || phone)
        : (rawData.chat?.wa_contactName || rawData.chat?.wa_name || msg.senderName || phone);

      let messageType = 'text';
      if (msg.messageType === 'AudioMessage' || msg.mediaType === 'ptt' || msg.mediaType === 'audio') {
        messageType = 'audio';
      } else if (msg.messageType === 'ImageMessage' || msg.mediaType === 'image') {
        messageType = 'image';
      } else if (msg.messageType === 'VideoMessage' || msg.mediaType === 'video') {
        messageType = 'video';
      } else if (msg.messageType === 'DocumentMessage' || msg.mediaType === 'document') {
        messageType = 'document';
      } else if (msg.messageType === 'LocationMessage') {
        messageType = 'location';
      }

      return {
        type: 'message',
        instanceId: rawData.token || rawData.instanceId,
        provider: 'uazap',
        timestamp: new Date(Number(msg.messageTimestamp) || Date.now()),
        data: {
          phone,
          contactName,
          isGroup,
          isFromMe,
          messageType,
          text: msg.text || '',
          mediaUrl: msg.media_url || msg.mediaUrl || msg.url || msg.content?.URL,
          fileName: msg.fileName || msg.filename,
          caption: msg.caption,
          messageId: msg.messageid || msg.id || msg.key?.id,
        },
      };
    }

    // Processar atualizações de chat
    if (event === 'chats' && rawData.chat) {
      return {
        type: 'chat_update',
        instanceId: rawData.token || rawData.instanceId,
        provider: 'uazap',
        timestamp: new Date(),
        data: rawData.chat,
      };
    }

    // Processar atualizações de conexão
    if (event === 'connection' || event === 'connection.update') {
      return {
        type: 'connection_update',
        instanceId: rawData.token || rawData.instanceId,
        provider: 'uazap',
        timestamp: new Date(),
        data: rawData,
      };
    }

    return null;
  }
}
