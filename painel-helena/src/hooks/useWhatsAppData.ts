import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact, Message } from '@/types/chat';
import { uazapApi } from '@/lib/api/uazap';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useWhatsAppData() {
  const { profile } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(true);
  const [hasSyncedOnLogin, setHasSyncedOnLogin] = useState(false);

  // Carregar contatos com query otimizada
  const loadContacts = async () => {
    if (!profile?.client_id) {
      console.log('Aguardando client_id para carregar contatos');
      return;
    }

    try {
      // Buscar contatos com informação da instância - FILTRADO POR CLIENT_ID
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select(`
          *,
          whatsapp_instances!contacts_instance_id_fkey(instance_name)
        `)
        .eq('client_id', profile.client_id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (contactsError) throw contactsError;

      // Buscar todas as últimas mensagens e contagens de uma vez - FILTRADO POR CLIENT_ID
      const { data: messagesData } = await supabase
        .from('messages')
        .select('contact_id, text, timestamp, from_me, status')
        .eq('client_id', profile.client_id)
        .order('timestamp', { ascending: false });

      // Processar dados localmente (muito mais rápido que múltiplas queries)
      const lastMessageByContact = new Map<string, any>();
      const unreadCountByContact = new Map<string, number>();

      // Uma única passagem pelos dados
      if (messagesData) {
        for (const msg of messagesData) {
          // Capturar primeira (mais recente) mensagem de cada contato
          if (!lastMessageByContact.has(msg.contact_id)) {
            lastMessageByContact.set(msg.contact_id, msg);
          }
          
          // Contar não lidas
          if (!msg.from_me && msg.status !== 'read') {
            unreadCountByContact.set(
              msg.contact_id, 
              (unreadCountByContact.get(msg.contact_id) || 0) + 1
            );
          }
        }
      }

      // Formatar contatos com os dados agregados
      const formattedContacts: Contact[] = (contactsData || []).map(contact => {
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
          lastMessageTimestamp: lastMsg?.timestamp || null, // Para ordenação
        };
      });

      // Ordenar por mensagem mais recente primeiro
      formattedContacts.sort((a, b) => {
        // Contatos sem mensagens vão para o final
        if (!a.lastMessageTimestamp && !b.lastMessageTimestamp) return 0;
        if (!a.lastMessageTimestamp) return 1;
        if (!b.lastMessageTimestamp) return -1;
        
        // Ordenar por timestamp da última mensagem (mais recente primeiro)
        return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime();
      });

      setContacts(formattedContacts);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    }
  };

  // Função para baixar e salvar avatar
  const downloadAndSaveAvatar = async (profilePictureUrl: string, phone: string, contactId: string) => {
    try {
      // Fazer download da imagem
      const response = await fetch(profilePictureUrl);
      const blob = await response.blob();
      
      // Gerar nome único para o arquivo
      const fileExt = 'jpg';
      const fileName = `${phone}_${Date.now()}.${fileExt}`;
      const filePath = `${profile?.client_id}/${fileName}`;
      
      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });
      
      if (uploadError) throw uploadError;
      
      // Obter URL público do avatar
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const avatarUrl = publicUrlData.publicUrl;
      
      // Atualizar contato com a URL do avatar
      await supabase
        .from('contacts')
        .update({ avatar: avatarUrl })
        .eq('id', contactId);
      
      console.log(`Avatar salvo para ${phone}:`, avatarUrl);
      return avatarUrl;
    } catch (error) {
      console.error(`Erro ao salvar avatar de ${phone}:`, error);
      return null;
    }
  };

  // Sincronizar mensagens novas da API do WhatsApp
  const syncNewMessages = async () => {
    if (!profile?.client_id) return;
    
    try {
      console.log('Sincronizando mensagens novas do WhatsApp...');
      
      // Verificar se há instância conectada antes de tentar sincronizar
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
      
      // Buscar todos os chats da API
      const chatsResponse = await uazapApi.getChats({});
      const apiChats = chatsResponse.data || [];
      
      for (const chat of apiChats) {
        const phone = chat.id?.split('@')[0];
        if (!phone) continue;
        
        // Verificar se já temos esse contato no banco
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id, phone, avatar')
          .eq('phone', phone)
          .eq('client_id', profile.client_id)
          .maybeSingle();
        
        let contactId = existingContact?.id;
        
        // Se não existir, criar o contato
        if (!contactId) {
          const { data: newContact } = await supabase
            .from('contacts')
            .insert({
              name: chat.name || phone,
              phone: phone,
              client_id: profile.client_id,
              is_group: chat.id?.includes('@g.us') || false,
            })
            .select('id')
            .single();
          
          contactId = newContact?.id;
        }
        
        if (!contactId) continue;
        
        // Buscar e salvar avatar se não existir
        if (!existingContact?.avatar && chat.profilePictureUrl) {
          await downloadAndSaveAvatar(chat.profilePictureUrl, phone, contactId);
        }
        
        // Buscar última mensagem que temos no banco
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('timestamp')
          .eq('contact_id', contactId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        // Buscar mensagens da API
        const messagesResponse = await uazapApi.getMessages({
          number: chat.id,
        });
        
        const apiMessages = messagesResponse.data || [];
        
        // Filtrar apenas mensagens novas (posteriores à última que temos)
        const newMessages = lastMessage 
          ? apiMessages.filter(msg => new Date(msg.timestamp * 1000) > new Date(lastMessage.timestamp))
          : apiMessages;
        
        // Inserir mensagens novas no banco
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
        
        console.log(`Sincronizadas ${newMessages.length} mensagens novas de ${chat.name || phone}`);
      }
      
      console.log('Sincronização completa!');
    } catch (error: any) {
      // Apenas logar erro se não for relacionado a instância desconectada
      if (!error.message?.includes('Nenhuma instância WhatsApp conectada')) {
        console.error('Erro ao sincronizar mensagens:', error);
        toast.error('Erro ao sincronizar mensagens: ' + (error.message || 'Erro desconhecido'));
      }
    }
  };

  // Carregar mensagens de um contato com paginação
  const loadMessages = async (contactId: string, limit: number = 10, offset: number = 0) => {
    if (!profile?.client_id) {
      console.log('Aguardando client_id para carregar mensagens');
      return { messages: [], hasMore: false, total: 0 };
    }

    try {
      console.log('Carregando mensagens para contact_id:', contactId, 'limit:', limit, 'offset:', offset);
      
      // Buscar total de mensagens primeiro - FILTRADO POR CLIENT_ID
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('contact_id', contactId)
        .eq('client_id', profile.client_id);

      const totalMessages = count || 0;
      
      // Calcular range para pegar as últimas mensagens
      const startIndex = Math.max(0, totalMessages - offset - limit);
      const endIndex = totalMessages - offset - 1;
      
      // Buscar mensagens - FILTRADO POR CLIENT_ID
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contact_id', contactId)
        .eq('client_id', profile.client_id)
        .order('timestamp', { ascending: true })
        .range(startIndex, endIndex);

      if (error) {
        console.error('Erro ao carregar mensagens:', error);
        throw error;
      }

      console.log(`Mensagens carregadas: ${data?.length || 0} de ${totalMessages} mensagens`);

      const formattedMessages: Message[] = (data || []).map(msg => {
        const metadata = msg.metadata as any;
        return {
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
          quotedMessage: metadata?.quotedMessage,
          metadata: metadata,
        };
      });

      setMessages(prev => {
        const existing = prev[contactId] || [];
        // Se offset > 0, estamos carregando mais mensagens antigas (prepend)
        // Se offset === 0, estamos carregando inicial (replace)
        const updated = offset > 0 
          ? [...formattedMessages, ...existing]
          : formattedMessages;
        
        return {
          ...prev,
          [contactId]: updated,
        };
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

  // Sincronizar mensagens ao fazer login
  useEffect(() => {
    if (profile?.client_id && !hasSyncedOnLogin && !loading) {
      console.log('Primeira carga após login - sincronizando mensagens...');
      syncNewMessages().then(() => {
        loadContacts();
        setHasSyncedOnLogin(true);
      });
    }
  }, [profile?.client_id, hasSyncedOnLogin, loading]);

  // Configurar realtime
  useEffect(() => {
    if (profile?.client_id) {
      loadContacts().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Inscrever para mudanças em contatos
    const contactsChannel = supabase
      .channel('contacts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
        },
        () => {
          loadContacts();
        }
      )
      .subscribe();

    // Inscrever para mudanças em mensagens
    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Nova mensagem recebida:', payload);
          const newMessage = payload.new as any;
          loadMessages(newMessage.contact_id);
          loadContacts(); // Atualizar lista de contatos para mostrar última mensagem
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Mensagem atualizada:', payload);
          const updatedMessage = payload.new as any;
          loadMessages(updatedMessage.contact_id);
          // Recarregar contatos para atualizar contadores de não lidas
          loadContacts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(contactsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, []);

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // Zerar horas para comparar apenas datas
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Se for hoje, mostrar apenas hora
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString('pt-BR', { 
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Se for outro dia, mostrar data
    return date.toLocaleDateString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', 
      month: '2-digit',
      year: '2-digit'
    });
  };

  // Calcular total de mensagens não lidas
  const totalUnreadCount = contacts.reduce((sum, contact) => sum + (contact.unreadCount || 0), 0);
  const individualUnreadCount = contacts.filter(c => !c.isGroup).reduce((sum, contact) => sum + (contact.unreadCount || 0), 0);
  const groupUnreadCount = contacts.filter(c => c.isGroup).reduce((sum, contact) => sum + (contact.unreadCount || 0), 0);

  return {
    contacts,
    messages,
    loading,
    loadMessages,
    loadContacts,
    totalUnreadCount,
    individualUnreadCount,
    groupUnreadCount,
  };
}
