/**
 * Exportações principais do módulo WhatsApp
 */

export { whatsappClient, WhatsAppClient } from './client/whatsapp-client';
export { WhatsAppAdapterFactory } from './factory/adapter-factory';
export type { IWhatsAppAdapter } from './adapters/base.adapter';
export { UazapAdapter } from './adapters/uazap.adapter';
export { EvolutionAdapter } from './adapters/evolution.adapter';
export { OfficialAdapter } from './adapters/official.adapter';

// Tipos
export type {
  WhatsAppProvider,
  MessageType,
  MessageStatus,
  InstanceStatus,
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
} from './types/common';
