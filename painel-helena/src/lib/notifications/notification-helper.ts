import { supabase } from '@/integrations/supabase/client';

export interface NotificationConnection {
  id: string;
  instance_id: string;
  phone_number: string | null;
  status: string;
  is_default_notification: boolean;
  api_token: string | null;
}

/**
 * Busca a conexão de notificação padrão ou uma alternativa com fallback automático
 * Ordem de prioridade:
 * 1. Conexão com is_default_notification=true
 * 2. Outras conexões com is_notifications=true, ordenadas por atualização
 */
export async function getNotificationConnection(): Promise<NotificationConnection | null> {
  try {
    // Tentar buscar a conexão padrão primeiro
    const { data: defaultConnection, error: defaultError } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_id, phone_number, status, is_default_notification, api_token')
      .eq('is_default_notification', true)
      .eq('is_notifications', true)
      .eq('status', 'connected')
      .maybeSingle();

    if (defaultError) {
      console.error('Error fetching default notification connection:', defaultError);
    }

    if (defaultConnection) {
      console.log('Using default notification connection:', defaultConnection.id);
      return defaultConnection as any;
    }

    // Se não houver padrão ou der erro, buscar alternativas
    console.log('No default connection found, trying alternatives...');
    
    const { data: alternativeConnections, error: altError } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_id, phone_number, status, is_default_notification, api_token')
      .eq('is_notifications', true)
      .eq('status', 'connected')
      .order('updated_at', { ascending: false })
      .limit(5);

    if (altError) {
      console.error('Error fetching alternative connections:', altError);
      return null;
    }

    if (alternativeConnections && alternativeConnections.length > 0) {
      console.log(`Using alternative connection: ${alternativeConnections[0].id}`);
      return alternativeConnections[0] as any;
    }

    console.warn('No notification connections available');
    return null;
  } catch (error) {
    console.error('Error in getNotificationConnection:', error);
    return null;
  }
}

/**
 * Registra log de notificação enviada
 */
export async function logNotification(params: {
  clientId?: string;
  notificationType: string;
  recipientPhone: string;
  messageContent: string;
  status: 'pending' | 'sent' | 'failed';
  whatsappInstanceId?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const { error } = await supabase
      .from('system_notification_logs')
      .insert({
        client_id: params.clientId || null,
        notification_type: params.notificationType,
        recipient_phone: params.recipientPhone,
        message_content: params.messageContent,
        status: params.status,
        whatsapp_instance_id: params.whatsappInstanceId || null,
        error_message: params.errorMessage || null,
        metadata: params.metadata || {},
        sent_at: params.status === 'sent' ? new Date().toISOString() : null,
      });

    if (error) {
      console.error('Error logging notification:', error);
    }
  } catch (error) {
    console.error('Error in logNotification:', error);
  }
}
