/**
 * UAZAP API Client (Wrapper de compatibilidade)
 * Este arquivo mantém a API antiga funcionando enquanto usa o novo sistema de abstração multi-API
 * @deprecated Use whatsappClient do módulo whatsapp/client/whatsapp-client.ts
 */

import { whatsappClient } from '@/lib/whatsapp/client/whatsapp-client';

// Interfaces (mantidas para compatibilidade)
interface SendTextParams {
  number: string;
  text: string;
  delay?: number;
  readchat?: boolean;
  readmessages?: boolean;
  replyid?: string;
  mentions?: string;
  forward?: boolean;
  track_source?: string;
  track_id?: string;
  linkPreview?: boolean;
  linkPreviewTitle?: string;
  linkPreviewDescription?: string;
  linkPreviewImage?: string;
  linkPreviewLarge?: boolean;
}

interface SendMediaParams {
  number: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'myaudio' | 'ptt' | 'sticker';
  file: string;
  text?: string;
  docName?: string;
  delay?: number;
  readchat?: boolean;
  readmessages?: boolean;
  replyid?: string;
  mentions?: string;
  forward?: boolean;
  track_source?: string;
  track_id?: string;
}

interface SendContactParams {
  number: string;
  fullName: string;
  phoneNumber: string;
  organization?: string;
  email?: string;
  url?: string;
  delay?: number;
  readchat?: boolean;
  readmessages?: boolean;
  replyid?: string;
  mentions?: string;
}

interface SendLocationParams {
  number: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
  delay?: number;
  readchat?: boolean;
  replyid?: string;
}

interface MarkAsReadParams {
  number: string;
  read: boolean;
}

interface ArchiveChatParams {
  number: string;
  archive: boolean;
}

interface MuteChatParams {
  number: string;
  mute: boolean;
  duration?: number;
}

interface GetChatsParams {
  limit?: number;
  offset?: number;
  archived?: boolean;
}

interface GetMessagesParams {
  number: string;
  limit?: number;
  offset?: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * API wrapper - mantém compatibilidade com código existente
 * Todos os métodos delegam para o novo WhatsAppClient
 */
export const uazapApi = {
  sendText: (params: SendTextParams) => whatsappClient.sendText(params),
  sendMedia: (params: SendMediaParams) => whatsappClient.sendMedia(params),
  sendContact: (params: SendContactParams) => whatsappClient.sendContact(params),
  sendLocation: (params: SendLocationParams) => whatsappClient.sendLocation(params),
  markAsRead: (params: MarkAsReadParams) => whatsappClient.markAsRead(params),
  archiveChat: (params: ArchiveChatParams) => whatsappClient.archiveChat(params),
  muteChat: (params: MuteChatParams) => whatsappClient.muteChat(params),
  getChats: (params: GetChatsParams = {}) => whatsappClient.getChats(params),
  getMessages: (params: GetMessagesParams) => whatsappClient.getMessages(params),
  getConnectionStatus: () => whatsappClient.getConnectionStatus(),
  getQRCode: (instanceToken: string) => whatsappClient.getQRCode(instanceToken, 'uazap'),
  connectWithPhone: (instanceToken: string, phone: string) => whatsappClient.getQRCode(instanceToken, 'uazap'),
  createInstance: (instanceName: string, receiveGroupMessages = true) => 
    whatsappClient.createInstance(instanceName, 'uazap', { receiveGroupMessages }),
  configureWebhook: (instanceToken: string, receiveGroupMessages: boolean) => 
    whatsappClient.configureWebhook(instanceToken, 'uazap', `https://qoifgfawfkdukjakhssv.supabase.co/functions/v1/whatsapp-webhook`, ['messages', 'chats', 'connection']),
  getWebhookStatus: (instanceToken: string) => Promise.resolve({ success: true }),
  deleteInstance: (instanceToken: string) => whatsappClient.deleteInstance(instanceToken, 'uazap'),
  getInstanceStatus: (instanceToken: string) => whatsappClient.getInstanceStatus(instanceToken, 'uazap'),
  downloadMedia: (messageId: string) => whatsappClient.downloadMedia(messageId),
  logoutInstance: (instanceToken: string) => whatsappClient.disconnectInstance(instanceToken, 'uazap'),
};
