import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message, NotificationType } from '@/types/chat';

export function useSystemNotifications() {
  const insertSystemNotification = useCallback(async (
    contactId: string,
    clientId: string,
    type: NotificationType,
    message: string
  ): Promise<Message | null> => {
    try {
      const notification: Message = {
        id: crypto.randomUUID(),
        type: 'system_notification',
        text: message,
        timestamp: new Date(),
        fromMe: false,
        status: 'sent' as const,
        contactId,
        metadata: {
          notificationType: type
        }
      };

      // Inserir na tabela messages como notificação do sistema
      console.log('📢 Inserindo notificação do sistema:', {
        contactId,
        clientId,
        type,
        message
      });

      const { data, error } = await supabase
        .from('messages')
        .insert({
          id: notification.id,
          contact_id: contactId,
          client_id: clientId,
          text: message,
          type: 'system_notification',
          from_me: false,
          status: 'read', // Notificações do sistema já vêm como lidas
          timestamp: new Date().toISOString(),
          metadata: {
            notificationType: type
          }
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao inserir notificação do sistema:', error);
        return null;
      }

      console.log('✅ Notificação inserida com sucesso:', data);

      return notification;
    } catch (error) {
      console.error('Erro ao criar notificação do sistema:', error);
      return null;
    }
  }, []);

  const notifyAgentPaused = useCallback(async (contactId: string, clientId: string, isGlobal: boolean = false) => {
    // Buscar tipo do agente para usar termo correto
    const { data: contact } = await supabase
      .from('contacts')
      .select('phone')
      .eq('id', contactId)
      .single();
    
    if (!contact) {
      const message = isGlobal ? 'Agente pausado globalmente' : 'Agente pausado para este contato';
      return insertSystemNotification(contactId, clientId, isGlobal ? 'agent_paused_global' : 'agent_paused', message);
    }

    const remoteJid = `${contact.phone}@s.whatsapp.net`;
    
    const { data: conversation } = await supabase
      .from('agent_conversations')
      .select('julia_agents(agent_type)')
      .eq('remote_jid', remoteJid)
      .eq('client_id', clientId)
      .maybeSingle();
    
    const agentType = conversation?.julia_agents?.agent_type;
    const agentLabel = agentType === 'custom' ? 'Assistente IA' : 'Agente';
    
    const message = isGlobal 
      ? `${agentLabel} pausado globalmente` 
      : `${agentLabel} pausado para este contato`;
    return insertSystemNotification(
      contactId, 
      clientId, 
      isGlobal ? 'agent_paused_global' : 'agent_paused', 
      message
    );
  }, [insertSystemNotification]);

  const notifyAgentResumed = useCallback(async (contactId: string, clientId: string, isGlobal: boolean = false) => {
    // Buscar tipo do agente para usar termo correto
    const { data: contact } = await supabase
      .from('contacts')
      .select('phone')
      .eq('id', contactId)
      .single();
    
    if (!contact) {
      const message = isGlobal ? 'Agente reativado globalmente' : 'Agente reativado para este contato';
      return insertSystemNotification(contactId, clientId, isGlobal ? 'agent_resumed_global' : 'agent_resumed', message);
    }

    const remoteJid = `${contact.phone}@s.whatsapp.net`;
    
    const { data: conversation } = await supabase
      .from('agent_conversations')
      .select('julia_agents(agent_type)')
      .eq('remote_jid', remoteJid)
      .eq('client_id', clientId)
      .maybeSingle();
    
    const agentType = conversation?.julia_agents?.agent_type;
    const agentLabel = agentType === 'custom' ? 'Assistente IA' : 'Agente';
    
    const message = isGlobal 
      ? `${agentLabel} reativado globalmente` 
      : `${agentLabel} reativado para este contato`;
    return insertSystemNotification(
      contactId, 
      clientId, 
      isGlobal ? 'agent_resumed_global' : 'agent_resumed', 
      message
    );
  }, [insertSystemNotification]);

  const notifyServiceStarted = useCallback((contactId: string, clientId: string, channel?: string) => {
    const message = channel 
      ? `Atendimento iniciado no canal ${channel}` 
      : 'Atendimento iniciado';
    return insertSystemNotification(contactId, clientId, 'service_started', message);
  }, [insertSystemNotification]);

  const notifyServiceEnded = useCallback((contactId: string, clientId: string, attendantName?: string) => {
    const message = attendantName 
      ? `${attendantName} concluiu o atendimento` 
      : 'Atendimento concluído';
    return insertSystemNotification(contactId, clientId, 'service_ended', message);
  }, [insertSystemNotification]);

  const notifyServiceTransfer = useCallback((contactId: string, clientId: string, fromAttendant: string, toAttendant: string) => {
    const message = `Atendimento transferido de ${fromAttendant} para ${toAttendant}`;
    return insertSystemNotification(contactId, clientId, 'service_transfer', message);
  }, [insertSystemNotification]);

  const notifyNoteCreated = useCallback((contactId: string, clientId: string, userName: string) => {
    const message = `${userName} criou uma nota interna`;
    return insertSystemNotification(contactId, clientId, 'note_created', message);
  }, [insertSystemNotification]);

  const notifyNoteUpdated = useCallback((contactId: string, clientId: string, userName: string) => {
    const message = `${userName} atualizou a nota interna`;
    return insertSystemNotification(contactId, clientId, 'note_updated', message);
  }, [insertSystemNotification]);

  const notifyNoteDeleted = useCallback((contactId: string, clientId: string, userName: string) => {
    const message = `${userName} excluiu a nota interna`;
    return insertSystemNotification(contactId, clientId, 'note_deleted', message);
  }, [insertSystemNotification]);

  return {
    insertSystemNotification,
    notifyAgentPaused,
    notifyAgentResumed,
    notifyServiceStarted,
    notifyServiceEnded,
    notifyServiceTransfer,
    notifyNoteCreated,
    notifyNoteUpdated,
    notifyNoteDeleted
  };
}
