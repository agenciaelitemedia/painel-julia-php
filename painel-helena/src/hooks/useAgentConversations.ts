import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSystemNotifications } from './useSystemNotifications';

export interface AgentConversation {
  id: string;
  agent_id: string;
  remote_jid: string;
  contact_id: string | null;
  is_paused: boolean;
  paused_at: string | null;
  paused_reason: string | null;
  pause_triggered_by: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  contacts?: {
    name: string;
    phone: string;
  } | null;
}

export function useAgentConversations(agentId?: string) {
  const queryClient = useQueryClient();
  const { notifyAgentPaused, notifyAgentResumed } = useSystemNotifications();

  // Resolve o contact_id a partir do remote_jid quando ausente
  const resolveContactId = async (remoteJid: string, clientId: string): Promise<string | null> => {
    try {
      const phoneRaw = (remoteJid || '').split('@')[0];
      if (!phoneRaw) return null;
      const onlyDigits = phoneRaw.replace(/\D/g, '');
      const no55 = onlyDigits.replace(/^55/, '');

      // 1) Tentativas com igualdade exata para formatos comuns
      const { data: exact } = await supabase
        .from('contacts')
        .select('id, phone')
        .eq('client_id', clientId)
        .or(`phone.eq.${onlyDigits},phone.eq.+${onlyDigits},phone.eq.${no55},phone.eq.+${no55}`)
        .limit(1)
        .maybeSingle();

      if (exact?.id) return exact.id;

      // 2) Fallback: busca por sufixo (últimos 8-9 dígitos) para números formatados
      const suffix = onlyDigits.slice(-9);
      const { data: fuzzy } = await supabase
        .from('contacts')
        .select('id, phone')
        .eq('client_id', clientId)
        .ilike('phone', `%${suffix}`)
        .limit(1)
        .maybeSingle();

      return fuzzy?.id || null;
    } catch {
      return null;
    }
  };

  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ['agent-conversations', agentId],
    queryFn: async () => {
      let query = supabase
        .from('agent_conversations')
        .select('*, contacts(name, phone)')
        .order('last_message_at', { ascending: false });

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AgentConversation[];
    },
    enabled: !!agentId,
  });

  const togglePause = useMutation({
    mutationFn: async ({ 
      conversationId, 
      isPaused,
      reason
    }: { 
      conversationId: string; 
      isPaused: boolean;
      reason?: string;
    }) => {
      const { data, error } = await supabase
        .from('agent_conversations')
        .update({ 
          is_paused: isPaused,
          paused_at: isPaused ? new Date().toISOString() : null,
          paused_reason: isPaused ? reason || 'Pausado manualmente' : null,
          pause_triggered_by: isPaused ? 'manual' : null,
        })
        .eq('id', conversationId)
        .select('*, contacts(id)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['agent-conversations'] });
      toast.success('Status da conversa atualizado!');
      
      // Inserir notificação do sistema no chat
      if (data && data.client_id) {
        let contactId = data.contact_id as string | null;
        if (!contactId) {
          contactId = await resolveContactId(data.remote_jid, data.client_id);
        }
        if (contactId) {
          if (data.is_paused) {
            await notifyAgentPaused(contactId, data.client_id, false);
          } else {
            await notifyAgentResumed(contactId, data.client_id, false);
          }
        }
      }
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar conversa: ' + error.message);
    },
  });

  const pauseAll = useMutation({
    mutationFn: async (agentId: string) => {
      // Primeiro, buscar todas as conversas que serão pausadas
      const { data: conversationsData } = await supabase
        .from('agent_conversations')
        .select('id, contact_id, client_id, remote_jid')
        .eq('agent_id', agentId)
        .eq('is_paused', false);

      const { error } = await supabase
        .from('agent_conversations')
        .update({ 
          is_paused: true,
          paused_at: new Date().toISOString(),
          paused_reason: 'Pausado em massa',
          pause_triggered_by: 'manual',
        })
        .eq('agent_id', agentId)
        .eq('is_paused', false);

      if (error) throw error;
      
      return conversationsData || [];
    },
    onSuccess: async (conversationsData) => {
      queryClient.invalidateQueries({ queryKey: ['agent-conversations'] });
      toast.success('Todas as conversas foram pausadas!');
      
      // Inserir notificação global para cada contato
      for (const conv of conversationsData as Array<any>) {
        const clientId = conv.client_id;
        let contactId = conv.contact_id as string | null;
        if (!contactId && conv.remote_jid && clientId) {
          contactId = await resolveContactId(conv.remote_jid, clientId);
        }
        if (contactId && clientId) {
          await notifyAgentPaused(contactId, clientId, true);
        }
      }
    },
    onError: (error: any) => {
      toast.error('Erro ao pausar conversas: ' + error.message);
    },
  });

  const resumeAll = useMutation({
    mutationFn: async (agentId: string) => {
      // Primeiro, buscar todas as conversas que serão reativadas
      const { data: conversationsData } = await supabase
        .from('agent_conversations')
        .select('id, contact_id, client_id, remote_jid')
        .eq('agent_id', agentId)
        .eq('is_paused', true);

      const { error } = await supabase
        .from('agent_conversations')
        .update({ 
          is_paused: false,
          paused_at: null,
          paused_reason: null,
          pause_triggered_by: null,
        })
        .eq('agent_id', agentId)
        .eq('is_paused', true);

      if (error) throw error;
      
      return conversationsData || [];
    },
    onSuccess: async (conversationsData) => {
      queryClient.invalidateQueries({ queryKey: ['agent-conversations'] });
      toast.success('Todas as conversas foram reativadas!');
      
      // Inserir notificação global para cada contato
      for (const conv of conversationsData as Array<any>) {
        const clientId = conv.client_id;
        let contactId = conv.contact_id as string | null;
        if (!contactId && conv.remote_jid && clientId) {
          contactId = await resolveContactId(conv.remote_jid, clientId);
        }
        if (contactId && clientId) {
          await notifyAgentResumed(contactId, clientId, true);
        }
      }
    },
    onError: (error: any) => {
      toast.error('Erro ao reativar conversas: ' + error.message);
    },
  });

  return {
    conversations,
    isLoading,
    error,
    togglePause,
    pauseAll,
    resumeAll,
  };
}
