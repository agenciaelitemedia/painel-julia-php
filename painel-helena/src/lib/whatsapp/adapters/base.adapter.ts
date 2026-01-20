/**
 * Interface base para todos os adaptadores de WhatsApp API
 * Define o contrato que todos os provedores devem implementar
 */

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

export interface IWhatsAppAdapter {
  /**
   * Nome do provider
   */
  getProviderName(): WhatsAppProvider;

  /**
   * Criar uma nova instância de WhatsApp
   */
  createInstance(name: string, options?: CreateInstanceOptions): Promise<ApiResponse<NormalizedInstance>>;

  /**
   * Deletar instância
   */
  deleteInstance(instanceToken: string): Promise<ApiResponse>;

  /**
   * Conectar instância (gerar QR Code)
   */
  connectInstance(instanceToken: string): Promise<ApiResponse<{ qrCode?: string; status: string }>>;

  /**
   * Desconectar instância
   */
  disconnectInstance(instanceToken: string): Promise<ApiResponse>;

  /**
   * Obter status da instância
   */
  getInstanceStatus(instanceToken: string): Promise<ApiResponse<NormalizedInstance>>;

  /**
   * Obter informações do perfil
   */
  getProfileInfo(instanceToken: string): Promise<ApiResponse<{ name: string; picture?: string; phone: string }>>;

  /**
   * Enviar mensagem de texto
   */
  sendText(params: SendTextParams): Promise<ApiResponse<NormalizedMessage>>;

  /**
   * Enviar mídia
   */
  sendMedia(params: SendMediaParams): Promise<ApiResponse<NormalizedMessage>>;

  /**
   * Enviar localização
   */
  sendLocation(params: SendLocationParams): Promise<ApiResponse<NormalizedMessage>>;

  /**
   * Enviar contato
   */
  sendContact(params: SendContactParams): Promise<ApiResponse<NormalizedMessage>>;

  /**
   * Marcar conversa como lida
   */
  markAsRead(params: MarkAsReadParams): Promise<ApiResponse>;

  /**
   * Arquivar conversa
   */
  archiveChat(params: ArchiveChatParams): Promise<ApiResponse>;

  /**
   * Silenciar conversa
   */
  muteChat(params: MuteChatParams): Promise<ApiResponse>;

  /**
   * Buscar conversas
   */
  getChats(params: GetChatsParams): Promise<ApiResponse<NormalizedContact[]>>;

  /**
   * Buscar mensagens de uma conversa
   */
  getMessages(params: GetMessagesParams): Promise<ApiResponse<NormalizedMessage[]>>;

  /**
   * Download de mídia
   */
  downloadMedia(messageId: string): Promise<string>;

  /**
   * Configurar webhook
   */
  configureWebhook(instanceToken: string, webhookUrl: string, events: string[]): Promise<ApiResponse>;

  /**
   * Parser de webhook - transforma dados raw do webhook em formato normalizado
   */
  parseWebhook(rawData: any): NormalizedWebhookEvent | null;
}
