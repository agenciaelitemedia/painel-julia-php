/**
 * Adapter para WhatsApp Official API (Meta/Facebook)
 * Implementa a interface IWhatsAppAdapter para WhatsApp Official API
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

const API_BASE_URL = 'https://graph.facebook.com/v18.0';

export class OfficialAdapter implements IWhatsAppAdapter {
  getProviderName(): WhatsAppProvider {
    return 'official';
  }

  private getHeaders(accessToken: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async createInstance(name: string, options?: CreateInstanceOptions): Promise<ApiResponse<NormalizedInstance>> {
    // WhatsApp Official API doesn't have "instances" concept
    // Instead, it uses phone-number-id which must be configured manually
    throw new Error('WhatsApp Official API does not support automatic instance creation. Please configure phone-number-id manually.');
  }

  async deleteInstance(instanceToken: string): Promise<ApiResponse> {
    throw new Error('WhatsApp Official API does not support instance deletion. Manage via Meta Business Manager.');
  }

  async connectInstance(instanceToken: string): Promise<ApiResponse<{ qrCode?: string; status: string }>> {
    // WhatsApp Official API is always "connected" - no QR code needed
    return {
      success: true,
      data: {
        status: 'connected',
      },
    };
  }

  async disconnectInstance(instanceToken: string): Promise<ApiResponse> {
    throw new Error('WhatsApp Official API does not support disconnection. Manage via Meta Business Manager.');
  }

  async getInstanceStatus(instanceToken: string): Promise<ApiResponse<NormalizedInstance>> {
    // Parse instanceToken as "phoneNumberId:accessToken"
    const [phoneNumberId, accessToken] = instanceToken.split(':');

    const response = await fetch(`${API_BASE_URL}/${phoneNumberId}`, {
      method: 'GET',
      headers: this.getHeaders(accessToken),
    });

    if (!response.ok) {
      throw new Error('Failed to get phone number info');
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        id: phoneNumberId,
        name: data.display_phone_number || phoneNumberId,
        phoneNumber: data.display_phone_number,
        status: 'connected',
        apiToken: instanceToken,
        provider: 'official',
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
    // WhatsApp Official API marks messages as read automatically
    return { success: true };
  }

  async archiveChat(params: ArchiveChatParams): Promise<ApiResponse> {
    throw new Error('WhatsApp Official API does not support chat archiving');
  }

  async muteChat(params: MuteChatParams): Promise<ApiResponse> {
    throw new Error('WhatsApp Official API does not support chat muting');
  }

  async getChats(params: GetChatsParams): Promise<ApiResponse<NormalizedContact[]>> {
    throw new Error('WhatsApp Official API does not provide chat listing');
  }

  async getMessages(params: GetMessagesParams): Promise<ApiResponse<NormalizedMessage[]>> {
    throw new Error('WhatsApp Official API does not provide message history retrieval');
  }

  async downloadMedia(messageId: string): Promise<string> {
    throw new Error('Use WhatsAppClient.downloadMedia() instead - requires instance token and media ID');
  }

  async configureWebhook(instanceToken: string, webhookUrl: string, events: string[]): Promise<ApiResponse> {
    // Webhooks are configured via Meta Business Manager, not programmatically
    return { success: true, message: 'Configure webhooks via Meta Business Manager' };
  }

  parseWebhook(rawData: any): NormalizedWebhookEvent | null {
    if (rawData.object !== 'whatsapp_business_account') {
      return null;
    }

    const entry = rawData.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages?.[0];
    const statuses = value?.statuses?.[0];

    // Processar mensagens
    if (messages) {
      const contacts = value?.contacts?.[0];
      
      return {
        type: 'message',
        instanceId: value.metadata?.phone_number_id || '',
        provider: 'official',
        timestamp: new Date(Number(messages.timestamp) * 1000),
        data: {
          phone: messages.from,
          contactName: contacts?.profile?.name || messages.from,
          isGroup: false,
          isFromMe: false,
          messageType: messages.type,
          text: messages.text?.body || '',
          mediaUrl: messages.image?.id || messages.video?.id || messages.audio?.id || messages.document?.id || '',
          fileName: messages.document?.filename || '',
          caption: messages.image?.caption || messages.video?.caption || messages.document?.caption || '',
          messageId: messages.id,
        },
      };
    }

    // Processar atualizações de status
    if (statuses) {
      return {
        type: 'message_status',
        instanceId: value.metadata?.phone_number_id || '',
        provider: 'official',
        timestamp: new Date(statuses.timestamp * 1000),
        data: {
          messageId: statuses.id,
          status: statuses.status,
        },
      };
    }

    return null;
  }
}
