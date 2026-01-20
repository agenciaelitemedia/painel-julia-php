import { Bot } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Contact } from '@/types/chat';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ChatHeaderProps {
  contact: Contact;
  onOpenDetails?: () => void;
}

export function ChatHeader({ contact, onOpenDetails }: ChatHeaderProps) {
  const { profile } = useAuth();
  const [agentStatus, setAgentStatus] = useState<'active' | 'paused' | 'disabled'>('disabled');

  useEffect(() => {
    if (!profile?.client_id) return;

    const loadAgentStatus = async () => {
      console.log('🔍 Carregando status do agente para:', contact.phone);
      
      // Buscar conversa do agente com join para pegar os dados do agente
      const { data: conversation, error } = await (supabase as any)
        .from('agent_conversations')
        .select(`
          is_paused,
          agent_id,
          julia_agents (
            is_active,
            agent_type,
            is_paused_globally
          )
        `)
        .eq('remote_jid', `${contact.phone}@s.whatsapp.net`)
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('📊 Conversa encontrada:', conversation);

      if (!conversation || error || !conversation.agent_id) {
        console.log('❌ Sem agente ativo na conversa. Tentando fallback por agente global do cliente...');
        // Fallback: verificar se existe agente JULIA ativo para o cliente (modo webhook externo)
        const { data: activeAgent, error: agentErr } = await (supabase as any)
          .from('julia_agents')
          .select('id,is_active,is_paused_globally,agent_type')
          .eq('client_id', profile.client_id)
          .eq('agent_type', 'julia')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (agentErr) {
          console.log('⚠️ Erro ao buscar agente global:', agentErr);
        }

        if (activeAgent && activeAgent.is_active && !activeAgent.is_paused_globally) {
          console.log('🟢 Agente JULIA global ativo (fallback)');
          setAgentStatus('active');
        } else {
          console.log('❌ Sem agente JULIA ativo (fallback)');
          setAgentStatus('disabled');
        }
        return;
      }

      const agent = conversation.julia_agents;
      
      if (!agent || !agent.is_active || agent.is_paused_globally) {
        console.log('❌ Agente desabilitado:', { agent, is_active: agent?.is_active, is_paused_globally: agent?.is_paused_globally });
        setAgentStatus('disabled');
        return;
      }

      // Agente ativo custom: verde se não pausado, vermelho se pausado
      if (conversation.is_paused) {
        console.log('🔴 Agente pausado');
        setAgentStatus('paused');
      } else {
        console.log('🟢 Agente ativo');
        setAgentStatus('active');
      }
    };

    loadAgentStatus();

    // Escutar mudanças em tempo real
    console.log('🔌 Conectando ao realtime para:', contact.phone);
    
    const channel = supabase
      .channel(`agent-status-${contact.phone}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_conversations',
          filter: `remote_jid=eq.${contact.phone}@s.whatsapp.net`
        },
        (payload) => {
          console.log('🔄 Mudança detectada em agent_conversations:', payload);
          loadAgentStatus();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'julia_agents'
        },
        (payload) => {
          console.log('🔄 Mudança detectada em julia_agents:', payload);
          loadAgentStatus();
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da subscription:', status);
      });

    return () => {
      console.log('🔌 Desconectando realtime');
      supabase.removeChannel(channel);
    };
  }, [contact.phone, profile?.client_id]);

  const getAgentStyles = () => {
    switch (agentStatus) {
      case 'active':
        return {
          bg: 'bg-green-500/10',
          icon: 'text-green-600'
        };
      case 'paused':
        return {
          bg: 'bg-red-500/10',
          icon: 'text-red-600'
        };
      case 'disabled':
        return {
          bg: 'bg-muted/30',
          icon: 'text-muted-foreground/30'
        };
    }
  };

  const styles = getAgentStyles();

  return (
    <div className="h-16 px-4 flex items-center justify-between border-b border-border bg-[hsl(var(--whatsapp-sidebar))]">
      <div 
        className="flex items-center gap-3 cursor-pointer hover:bg-[hsl(var(--whatsapp-hover))] rounded-lg p-2 -ml-2 transition-colors"
        onClick={onOpenDetails}
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={contact.avatar} alt={contact.name} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {contact.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-sm">{contact.name}</h2>
          <p className="text-xs text-muted-foreground">
            +{contact.phone}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg ${styles.bg}`}>
          <Bot className={`h-5 w-5 ${styles.icon}`} />
        </div>
      </div>
    </div>
  );
}
