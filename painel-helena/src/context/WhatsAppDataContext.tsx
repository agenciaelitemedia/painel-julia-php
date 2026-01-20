import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact, Message } from '@/types/chat';
import { uazapApi } from '@/lib/api/uazap';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface WhatsAppDataContextValue {
  contacts: Contact[];
  messages: Record<string, Message[]>;
  loading: boolean;
  loadMessages: (contactId: string, limit?: number, offset?: number) => Promise<{ messages: Message[]; hasMore: boolean; total: number }>;
  loadContacts: () => Promise<void>;
  totalUnreadCount: number;
  individualUnreadCount: number;
  groupUnreadCount: number;
  syncContacts: () => Promise<void>;
  isSyncing: boolean;
}

const WhatsAppDataContext = createContext<WhatsAppDataContextValue | null>(null);

export function WhatsAppDataProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(true);
  const [hasSyncedOnLogin, setHasSyncedOnLogin] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const loadContacts = async () => {
    if (!profile?.client_id) return;
    try {
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select(`*, whatsapp_instances!contacts_instance_id_fkey(instance_name, deleted_at)`)
        .eq('client_id', profile.client_id)
        .or('is_archived.is.null,is_archived.eq.false')
        .order('updated_at', { ascending: false });
      if (contactsError) throw contactsError;

      const { data: messagesData } = await supabase
        .from('messages')
        .select('contact_id, text, timestamp, from_me, status')
        .eq('client_id', profile.client_id)
        .order('timestamp', { ascending: false });

      const lastMessageByContact = new Map<string, any>();
      const unreadCountByContact = new Map<string, number>();
      if (messagesData) {
        for (const msg of messagesData) {
          if (!lastMessageByContact.has(msg.contact_id)) {
            lastMessageByContact.set(msg.contact_id, msg);
          }
          if (!msg.from_me && msg.status !== 'read') {
            unreadCountByContact.set(
              msg.contact_id,
              (unreadCountByContact.get(msg.contact_id) || 0) + 1
            );
          }
        }
      }

      const formattedContacts: Contact[] = (contactsData || []).map((contact: any) => {
        const lastMsg = lastMessageByContact.get(contact.id);
        return {
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          avatar: contact.avatar || '',
          lastMessage: lastMsg?.text || '',
          lastMessageTime: lastMsg ? formatMessageTime(lastMsg.timestamp) : '',
          unreadCount: unreadCountByContact.get(contact.id) || 0,
          status: contact.status || '',
          tags: contact.tags || [],
          isArchived: contact.is_archived,
          isMuted: contact.is_muted,
          isGroup: contact.is_group || false,
          instanceName: contact.whatsapp_instances?.instance_name || undefined,
          instanceDeleted: contact.whatsapp_instances?.deleted_at || undefined,
          lastMessageTimestamp: lastMsg?.timestamp || null,
        } as Contact;
      });

      formattedContacts.sort((a, b) => {
        if (!a.lastMessageTimestamp && !b.lastMessageTimestamp) return 0;
        if (!a.lastMessageTimestamp) return 1;
        if (!b.lastMessageTimestamp) return -1;
        return new Date(b.lastMessageTimestamp as any).getTime() - new Date(a.lastMessageTimestamp as any).getTime();
      });

      setContacts(formattedContacts);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    }
  };

  const loadMessages = async (contactId: string, limit: number = 10, offset: number = 0) => {
    if (!profile?.client_id) return { messages: [], hasMore: false, total: 0 };
    try {
      // Buscar contato para pegar remote_jid
      const { data: contactData } = await supabase
        .from('contacts')
        .select('phone, is_group')
        .eq('id', contactId)
        .single();

      if (!contactData) return { messages: [], hasMore: false, total: 0 };

      // Construir remote_jid baseado no telefone
      const remote_jid = contactData.is_group 
        ? `${contactData.phone}@g.us` 
        : `${contactData.phone}@s.whatsapp.net`;

      // Buscar mensagens regulares (do WhatsApp)
      const { count: regularCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('contact_id', contactId)
        .eq('client_id', profile.client_id);

      // Buscar conversa do agente (se existir)
      const { data: agentConversation } = await supabase
        .from('agent_conversations')
        .select('id')
        .eq('remote_jid', remote_jid)
        .eq('client_id', profile.client_id)
        .maybeSingle();

      let agentMessagesCount = 0;
      if (agentConversation) {
        const { count } = await supabase
          .from('agent_conversation_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', agentConversation.id);
        agentMessagesCount = count || 0;
      }

      const totalMessages = (regularCount || 0) + agentMessagesCount;
      if (totalMessages === 0) {
        return { messages: [], hasMore: false, total: 0 };
      }

      // Buscar todas as mensagens regulares
      const { data: regularMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('contact_id', contactId)
        .eq('client_id', profile.client_id)
        .order('timestamp', { ascending: true });

      const regularFormatted = (regularMessages || []).map((msg: any) => ({
        id: msg.id,
        messageId: msg.message_id || undefined,
        text: msg.text || '',
        timestamp: new Date(msg.timestamp),
        fromMe: msg.from_me,
        status: msg.status as any,
        type: msg.type as any,
        mediaUrl: msg.media_url,
        fileName: msg.file_name,
        caption: msg.caption,
        replyTo: msg.reply_to,
        quotedMessage: (msg.metadata as any)?.quotedMessage,
        metadata: msg.metadata as any,
        sort_timestamp: new Date(msg.timestamp).getTime(),
      } as Message & { sort_timestamp: number }));

      // Buscar mensagens do agente e formatar (fallback para respostas do N8N)
      let agentFormatted: (Message & { sort_timestamp: number })[] = [];
      if (agentConversation) {
    const { data: agentMsgs } = await supabase
      .from('agent_conversation_messages')
      .select('id, content, created_at, role, metadata')
      .eq('conversation_id', agentConversation.id)
      .order('created_at', { ascending: true });

    // Inclui apenas respostas do agente (assistant) que NÃO foram digitadas por humano
    const filteredAgentMsgs = (agentMsgs || []).filter((m: any) => m.role === 'assistant' && !(m.metadata && m.metadata.from_human === true));

    agentFormatted = filteredAgentMsgs.map((m: any) => ({
      id: `agent-${m.id}`,
      messageId: undefined,
      text: m.content || '',
      timestamp: new Date(m.created_at),
      fromMe: true,
      status: 'sent',
      type: 'text',
      metadata: m.metadata || undefined,
      sort_timestamp: new Date(m.created_at).getTime(),
    } as Message & { sort_timestamp: number }));
      }

    // Unificar, deduplicar e ordenar
    const merged = [...regularFormatted, ...agentFormatted];

    // Dedupe por messageId quando existir; caso contrário, por (fromMe + texto + bucket de 5s)
    const seen = new Map<string, (Message & { sort_timestamp: number })>();
    for (const m of merged) {
      const hasId = !!m.messageId;
      const key = hasId
        ? `id:${m.messageId}`
        : `k:${m.fromMe ? '1' : '0'}|${(m.text || '').trim()}|${Math.floor((m.timestamp as Date).getTime() / 5000)}`;
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, m);
      } else {
        const prefM = (m.messageId ? 1 : 0) + (m.mediaUrl ? 1 : 0);
        const prefE = (existing.messageId ? 1 : 0) + (existing.mediaUrl ? 1 : 0);
        if (prefM > prefE) seen.set(key, m);
      }
    }

    const deduped = Array.from(seen.values()).sort((a, b) => a.sort_timestamp - b.sort_timestamp);

    // Aplicar paginação ao deduped
    const startIndex = Math.max(0, deduped.length - offset - limit);
    const endIndex = deduped.length - offset;
    const paginated = deduped.slice(startIndex, endIndex);

    const formattedMessages: Message[] = paginated.map(({ sort_timestamp, ...msg }) => msg);

    setMessages(prev => {
      const existing = prev[contactId] || [];
      const updated = offset > 0 ? [...formattedMessages, ...existing] : formattedMessages;
      // Dedupe rápido também no estado existente (proteção contra realtime duplo)
      const stateSeen = new Map<string, Message>();
      for (const m of updated) {
        const key = (m as any).messageId
          ? `id:${(m as any).messageId}`
          : `k:${m.fromMe ? '1' : '0'}|${(m.text || '').trim()}|${Math.floor(new Date(m.timestamp).getTime() / 5000)}`;
        if (!stateSeen.has(key)) stateSeen.set(key, m);
      }
      const dedupedUpdated = Array.from(stateSeen.values());
      return { ...prev, [contactId]: dedupedUpdated };
    });

    return {
      messages: formattedMessages,
      hasMore: startIndex > 0,
      total: totalMessages,
    };
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      return { messages: [], hasMore: false, total: 0 };
    }
  };

  const syncNewMessages = async () => {
    if (!profile?.client_id) return;
    setIsSyncing(true);
    try {
      console.log('Sincronizando mensagens novas do WhatsApp...');
      const { data: connectedInstance } = await supabase
        .from('whatsapp_instances')
        .select('instance_id, status')
        .eq('status', 'connected')
        .eq('client_id', profile.client_id)
        .maybeSingle();
      if (!connectedInstance) {
        console.log('Nenhuma instância WhatsApp conectada para sincronizar');
        return;
      }

      const chatsResponse = await uazapApi.getChats({});
      const apiChats = chatsResponse.data || [];
      for (const chat of apiChats) {
        const phone = chat.id?.split('@')[0];
        if (!phone) continue;

        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id, phone, avatar')
          .eq('phone', phone)
          .eq('client_id', profile.client_id)
          .maybeSingle();
        let contactId = existingContact?.id;
        if (!contactId) {
          const { data: newContact } = await supabase
            .from('contacts')
            .insert({
              name: chat.name || phone,
              phone,
              client_id: profile.client_id,
              is_group: chat.id?.includes('@g.us') || false,
            })
            .select('id')
            .single();
          contactId = newContact?.id;
        }
        if (!contactId) continue;

        if (!existingContact?.avatar && chat.profilePictureUrl) {
          try {
            // best-effort, não bloquear sync
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            downloadAndSaveAvatar(chat.profilePictureUrl, phone, contactId);
          } catch { }
        }

        const { data: lastMessage } = await supabase
          .from('messages')
          .select('timestamp')
          .eq('contact_id', contactId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        const messagesResponse = await uazapApi.getMessages({ number: chat.id });
        const apiMessages = messagesResponse.data || [];
        const newMessages = lastMessage
          ? apiMessages.filter((msg: any) => new Date(msg.timestamp * 1000) > new Date(lastMessage.timestamp))
          : apiMessages;

        for (const msg of newMessages) {
          await supabase
            .from('messages')
            .insert({
              contact_id: contactId,
              message_id: msg.id?.id,
              text: msg.message || msg.caption || '',
              from_me: msg.fromMe || false,
              status: msg.fromMe ? 'sent' : 'delivered',
              type: msg.type || 'text',
              timestamp: new Date(msg.timestamp * 1000).toISOString(),
              client_id: profile.client_id,
              media_url: msg.mediaUrl,
              file_name: msg.fileName,
              caption: msg.caption,
            })
            .select()
            .single();
        }
      }
      console.log('Sincronização completa!');
    } catch (error: any) {
      if (!error.message?.includes('Nenhuma instância WhatsApp conectada')) {
        console.error('Erro ao sincronizar mensagens:', error);
        toast.error('Erro ao sincronizar mensagens: ' + (error.message || 'Erro desconhecido'));
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const downloadAndSaveAvatar = async (profilePictureUrl: string, phone: string, contactId: string) => {
    try {
      const response = await fetch(profilePictureUrl);
      const blob = await response.blob();
      const fileExt = 'jpg';
      const fileName = `${phone}_${Date.now()}.${fileExt}`;
      const filePath = `${profile?.client_id}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = publicUrlData.publicUrl;
      await supabase.from('contacts').update({ avatar: avatarUrl }).eq('id', contactId);
      return avatarUrl;
    } catch (error) {
      console.error(`Erro ao salvar avatar de ${phone}:`, error);
      return null;
    }
  };

  useEffect(() => {
    if (profile?.client_id && !hasSyncedOnLogin && !loading) {
      console.log('Primeira carga após login - sincronizando mensagens...');
      syncNewMessages().then(() => {
        setLoading(true);
        // Após a sincronização, recarrega os contatos
        loadContacts();
        setHasSyncedOnLogin(true);
        setLoading(false);
      });
    }
  }, [profile?.client_id, hasSyncedOnLogin, loading]);

  useEffect(() => {
    if (profile?.client_id) {
      loadContacts().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    const contactsChannel = supabase
      .channel('contacts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts' },
        () => loadContacts()
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new as any;
          loadMessages(newMessage.contact_id);
          loadContacts();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const updatedMessage = payload.new as any;
          loadMessages(updatedMessage.contact_id);
          loadContacts();
        }
      )
      .subscribe();

    // Fallback realtime para respostas do agente (quando não houver registro em messages)
    const agentMessagesChannel = supabase
      .channel('agent-conversation-messages-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_conversation_messages' },
        async (payload) => {
          const agentMsg: any = payload.new;
          try {
            // Mapear remote_jid -> contact_id e recarregar mensagens
            const remote = (agentMsg.remote_jid || '').replace('@s.whatsapp.net','').replace('@c.us','').replace('@g.us','');
            if (!remote) return;
            const { data: contact } = await supabase
              .from('contacts')
              .select('id')
              .eq('client_id', profile?.client_id!)
              .eq('phone', remote)
              .maybeSingle();
            if (contact?.id) {
              await loadMessages(contact.id);
              await loadContacts();
            }
          } catch (e) {
            console.warn('Falha ao processar realtime de agent_conversation_messages:', e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(contactsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(agentMessagesChannel);
    };
  }, [profile?.client_id]);

  const totalUnreadCount = useMemo(
    () => contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [contacts]
  );
  const individualUnreadCount = useMemo(
    () => contacts.filter(c => !c.isGroup).reduce((s, c) => s + (c.unreadCount || 0), 0),
    [contacts]
  );
  const groupUnreadCount = useMemo(
    () => contacts.filter(c => c.isGroup).reduce((s, c) => s + (c.unreadCount || 0), 0),
    [contacts]
  );

  const value: WhatsAppDataContextValue = {
    contacts,
    messages,
    loading,
    loadMessages,
    loadContacts,
    totalUnreadCount,
    individualUnreadCount,
    groupUnreadCount,
    syncContacts: syncNewMessages,
    isSyncing,
  };

  return (
    <WhatsAppDataContext.Provider value={value}>{children}</WhatsAppDataContext.Provider>
  );
}

export function useWhatsAppData(): WhatsAppDataContextValue {
  const ctx = useContext(WhatsAppDataContext);
  if (!ctx) {
    throw new Error('useWhatsAppData deve ser usado dentro de WhatsAppDataProvider');
  }
  return ctx;
}
