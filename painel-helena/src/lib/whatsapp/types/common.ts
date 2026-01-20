/**
 * Tipos normalizados compartilhados entre todos os provedores de WhatsApp
 */

export type WhatsAppProvider = 'uazap' | 'evolution' | 'official';

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'ptt' | 'document' | 'location' | 'contact' | 'buttons' | 'button_reply' | 'list' | 'sticker';

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export type InstanceStatus = 'connected' | 'disconnected' | 'connecting';

/**
 * Instância de WhatsApp normalizada
 */
export interface NormalizedInstance {
  id: string;
  name: string;
  phoneNumber?: string;
  status: InstanceStatus;
  qrCode?: string;
  profileName?: string;
  profilePicture?: string;
  apiToken: string;
  provider: WhatsAppProvider;
  webhookUrl?: string;
}

/**
 * Mensagem de WhatsApp normalizada
 */
export interface NormalizedMessage {
  id: string;
  contactId: string;
  text?: string;
  type: MessageType;
  fromMe: boolean;
  timestamp: Date;
  status: MessageStatus;
  mediaUrl?: string;
  fileName?: string;
  caption?: string;
  replyTo?: string;
  quotedMessage?: {
    text?: string;
    type?: string;
    senderName?: string;
  };
  metadata?: {
    buttons?: Array<{ id: string; text: string }>;
    listTitle?: string;
    listDescription?: string;
    listSections?: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
    latitude?: number;
    longitude?: number;
    locationName?: string;
    locationAddress?: string;
  };
}

/**
 * Contato de WhatsApp normalizado
 */
export interface NormalizedContact {
  phone: string;
  name: string;
  isGroup: boolean;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isArchived?: boolean;
  isMuted?: boolean;
  status?: string;
}

/**
 * Evento de webhook normalizado
 */
export interface NormalizedWebhookEvent {
  type: 'message' | 'message_status' | 'chat_update' | 'connection_update';
  instanceId: string;
  provider: WhatsAppProvider;
  data: any;
  timestamp: Date;
}

/**
 * Parâmetros para envio de texto
 */
export interface SendTextParams {
  number: string;
  text: string;
  delay?: number;
  readchat?: boolean;
  readmessages?: boolean;
  replyid?: string;
  mentions?: string;
}

/**
 * Parâmetros para envio de mídia
 */
export interface SendMediaParams {
  number: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'myaudio' | 'ptt' | 'sticker';
  file: string;
  text?: string;
  docName?: string;
  delay?: number;
  readchat?: boolean;
  replyid?: string;
}

/**
 * Parâmetros para envio de localização
 */
export interface SendLocationParams {
  number: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
  delay?: number;
  replyid?: string;
}

/**
 * Parâmetros para envio de contato
 */
export interface SendContactParams {
  number: string;
  fullName: string;
  phoneNumber: string;
  organization?: string;
  email?: string;
  url?: string;
  delay?: number;
  replyid?: string;
}

/**
 * Parâmetros para marcar como lido
 */
export interface MarkAsReadParams {
  number: string;
  read: boolean;
}

/**
 * Parâmetros para arquivar chat
 */
export interface ArchiveChatParams {
  number: string;
  archive: boolean;
}

/**
 * Parâmetros para silenciar chat
 */
export interface MuteChatParams {
  number: string;
  mute: boolean;
  duration?: number;
}

/**
 * Parâmetros para buscar chats
 */
export interface GetChatsParams {
  limit?: number;
  offset?: number;
  archived?: boolean;
}

/**
 * Parâmetros para buscar mensagens
 */
export interface GetMessagesParams {
  number: string;
  limit?: number;
  offset?: number;
}

/**
 * Resposta da API normalizada
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Opções para criação de instância
 */
export interface CreateInstanceOptions {
  receiveGroupMessages?: boolean;
  webhookUrl?: string;
}
