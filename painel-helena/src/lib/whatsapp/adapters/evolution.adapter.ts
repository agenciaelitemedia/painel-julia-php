/**
 * Adapter para Evolution API
 * Implementa a interface IWhatsAppAdapter para Evolution API
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

const API_BASE_URL = import.meta.env.VITE_EVOLUTION_API_URL || 'https://evo001.atendejulia.com.br';
const API_TOKEN = import.meta.env.VITE_EVOLUTION_API_TOKEN;

export class EvolutionAdapter implements IWhatsAppAdapter {
  getProviderName(): WhatsAppProvider {
    return 'evolution';
  }

  private getHeaders(instanceToken?: string): Record<string, string> {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'apikey': instanceToken || API_TOKEN || '',
    };
  }

  async createInstance(name: string, options?: CreateInstanceOptions): Promise<ApiResponse<NormalizedInstance>> {
    const response = await fetch(`${API_BASE_URL}/instance/create`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        instanceName: name,
        qrcode: true,
        webhook: options?.webhookUrl,
        webhookEvents: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create instance: ${errorText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        id: data.instance.instanceName,
        name: data.instance.instanceName,
        status: 'disconnected',
        apiToken: data.hash?.apikey || '',
        provider: 'evolution',
      },
    };
  }

  async deleteInstance(instanceToken: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/instance/delete/${instanceToken}`, {
      method: 'DELETE',
      headers: this.getHeaders(instanceToken),
    });

    if (!response.ok) {
      throw new Error('Failed to delete instance');
    }

    return { success: true };
  }

  async connectInstance(instanceToken: string): Promise<ApiResponse<{ qrCode?: string; status: string }>> {
    const response = await fetch(`${API_BASE_URL}/instance/connect/${instanceToken}`, {
      method: 'GET',
      headers: this.getHeaders(instanceToken),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to connect instance: ${errorText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        qrCode: data.qrcode?.base64,
        status: data.instance?.state === 'open' ? 'connected' : 'connecting',
      },
    };
  }

  async disconnectInstance(instanceToken: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/instance/logout/${instanceToken}`, {
      method: 'DELETE',
      headers: this.getHeaders(instanceToken),
    });

    if (!response.ok) {
      throw new Error('Failed to disconnect instance');
    }

    return { success: true };
  }

  async getInstanceStatus(instanceToken: string): Promise<ApiResponse<NormalizedInstance>> {
    const response = await fetch(`${API_BASE_URL}/instance/connectionState/${instanceToken}`, {
      method: 'GET',
      headers: this.getHeaders(instanceToken),
    });

    if (!response.ok) {
      throw new Error('Failed to get instance status');
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        id: instanceToken,
        name: instanceToken,
        status: data.state === 'open' ? 'connected' : 'disconnected',
        phoneNumber: data.instance?.owner,
        apiToken: instanceToken,
        provider: 'evolution',
      },
    };
  }

  async getProfileInfo(instanceToken: string): Promise<ApiResponse<{ name: string; picture?: string; phone: string }>> {
    const statusResponse = await this.getInstanceStatus(instanceToken);
    const instance = statusResponse.data;

    return {
      success: true,
      data: {
        name: instance?.name || '',
        picture: undefined,
        phone: instance?.phoneNumber || '',
      },
    };
  }

  async sendText(params: SendTextParams): Promise<ApiResponse<NormalizedMessage>> {
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
    const response = await fetch(`${API_BASE_URL}/webhook/set/${instanceToken}`, {
      method: 'POST',
      headers: this.getHeaders(instanceToken),
      body: JSON.stringify({
        url: webhookUrl,
        events: events.map(e => e.toUpperCase().replace('.', '_')),
        webhookByEvents: true,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to configure webhook');
    }

    return { success: true };
  }

  parseWebhook(rawData: any): NormalizedWebhookEvent | null {
    const event = rawData.event;

    // Processar mensagens
    if (event === 'messages.upsert' || event === 'MESSAGES_UPSERT') {
      const data = rawData.data;
      const message = data?.message;
      const key = message?.key;

      return {
        type: 'message',
        instanceId: rawData.instance,
        provider: 'evolution',
        timestamp: message?.messageTimestamp ? new Date(Number(message.messageTimestamp) * 1000) : new Date(),
        data: {
          phone: key?.remoteJid,
          contactName: message?.pushName || key?.remoteJid,
          isGroup: key?.remoteJid?.includes('@g.us'),
          isFromMe: key?.fromMe,
          messageType: Object.keys(message?.message || {})[0] || 'text',
          text: message?.message?.conversation || message?.message?.extendedTextMessage?.text || '',
          messageId: key?.id,
        },
      };
    }

    // Processar atualizações de status de mensagem
    if (event === 'messages.update' || event === 'MESSAGES_UPDATE') {
      return {
        type: 'message_status',
        instanceId: rawData.instance,
        provider: 'evolution',
        timestamp: new Date(),
        data: rawData.data,
      };
    }

    // Processar atualizações de conexão
    if (event === 'connection.update' || event === 'CONNECTION_UPDATE') {
      return {
        type: 'connection_update',
        instanceId: rawData.instance,
        provider: 'evolution',
        timestamp: new Date(),
        data: rawData.data,
      };
    }

    return null;
  }
}
