import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ChatList } from "@/components/chat/ChatList";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { ContactDetailsPanel } from "@/components/chat/ContactDetailsPanel";
import { Contact, Message } from "@/types/chat";
import { uazapApi } from "@/lib/api/uazap";
import { toast } from "sonner";
import { useWhatsAppData } from "@/context/WhatsAppDataContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Users } from "lucide-react";
import { useSystemNotifications } from "@/hooks/useSystemNotifications";

export default function Chat() {
  const { contacts, messages, loading, loadMessages, loadContacts, individualUnreadCount, groupUnreadCount, syncContacts, isSyncing } = useWhatsAppData();
  const { profile } = useAuth();
  const location = useLocation();
  const { notifyAgentPaused } = useSystemNotifications();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [activeTab, setActiveTab] = useState("individual");
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [messageOffset, setMessageOffset] = useState(0);
  const [replyingTo, setReplyingTo] = useState<{ id: string; text: string; senderName?: string; type?: string } | null>(null);
  const [showContactDetails, setShowContactDetails] = useState(false);

  // Trava temporária para manter contadores visuais até mensagens carregarem
  const [lockTabCounters, setLockTabCounters] = useState(false);
  const [lockedUnreadByContact, setLockedUnreadByContact] = useState<Record<string, number>>({});

  const displayIndividualUnreadCount = useMemo(() => {
    return contacts
      .filter(c => !c.isGroup)
      .reduce((s, c) => {
        const locked = lockTabCounters && lockedUnreadByContact[c.id] !== undefined ? lockedUnreadByContact[c.id] : (c.unreadCount || 0);
        return s + locked;
      }, 0);
  }, [contacts, lockTabCounters, lockedUnreadByContact]);

  const displayGroupUnreadCount = useMemo(() => {
    return contacts
      .filter(c => c.isGroup)
      .reduce((s, c) => {
        const locked = lockTabCounters && lockedUnreadByContact[c.id] !== undefined ? lockedUnreadByContact[c.id] : (c.unreadCount || 0);
        return s + locked;
      }, 0);
  }, [contacts, lockTabCounters, lockedUnreadByContact]);

  // Separar contatos individuais e grupos
  const individualContacts = contacts.filter(c => !c.isGroup);
  const groupContacts = contacts.filter(c => c.isGroup);

  // Verificar se há um contato passado pela navegação
  useEffect(() => {
    if (contacts.length === 0) return;

    const stateContact = location.state?.selectedContact as Contact | undefined;
    
    if (stateContact) {
      // Encontrar o contato atualizado na lista de contatos (por ID ou phone)
      const foundContact = contacts.find(
        c => c.id === stateContact.id || c.phone === stateContact.phone
      );
      
      if (foundContact) {
        setSelectedContact(foundContact);
        // Definir a aba correta
        setActiveTab(foundContact.isGroup ? "groups" : "individual");
        // Limpar o state da navegação
        window.history.replaceState({}, document.title);
      }
    }
    // Removido: seleção automática do primeiro contato
  }, [contacts, location.state]);

  useEffect(() => {
    const loadInitialMessages = async () => {
      if (selectedContact) {
        setMessageOffset(0);
        setIsLoadingMore(false);
        const result = await loadMessages(selectedContact.id, 10, 0);
        setHasMoreMessages(result?.hasMore || false);
      }
    };
    loadInitialMessages();
  }, [selectedContact?.id]);

  // Contadores das abas são apenas visuais
  // As mensagens são marcadas como lidas apenas quando o usuário seleciona um contato específico

  // REMOVIDO: Não marcar mais todas as mensagens como lidas ao carregar a página
  // As mensagens devem ser marcadas como lidas apenas quando o usuário selecionar o contato

  const handleSelectContact = async (contact: Contact) => {
    setSelectedContact(contact);
    
    // Travar contadores visuais deste contato até mensagens aparecerem
    setLockTabCounters(true);
    setLockedUnreadByContact(prev => ({ ...prev, [contact.id]: contact.unreadCount || 0 }));
    
    // Carregar mensagens primeiro
    setMessageOffset(0);
    const result = await loadMessages(contact.id, 10, 0);
    setHasMoreMessages(result?.hasMore || false);
    
    // Marcar mensagens como lidas no WhatsApp e no banco DEPOIS de carregar
    if (contact.phone) {
      try {
        const dest = contact.isGroup ? `${contact.phone}@g.us` : contact.phone;
        
        // Marcar como lido no WhatsApp
        await uazapApi.markAsRead({ number: dest, read: true });
        
        // Marcar mensagens como lidas no banco - FILTRADO POR CLIENT_ID
        if (profile?.client_id) {
          await supabase
            .from('messages')
            .update({ status: 'read' })
            .eq('contact_id', contact.id)
            .eq('client_id', profile.client_id)
            .eq('from_me', false)
            .neq('status', 'read');
        }
        
        // Aguardar um pouco para o realtime processar
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Recarregar contatos para atualizar contadores
        await loadContacts();
      } catch (err) {
        console.error('Erro ao marcar como lido:', err);
      } finally {
        // Destravar contadores após atualização
        setLockTabCounters(false);
        setLockedUnreadByContact({});
      }
    } else {
      // Se não houver phone, apenas destrava
      setLockTabCounters(false);
      setLockedUnreadByContact({});
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!profile?.client_id) {
      toast.error("Perfil não carregado. Tente novamente.");
      return;
    }

    try {
      // Pegar os contatos da aba atual
      const currentContacts = activeTab === "individual" ? individualContacts : groupContacts;
      
      // Filtrar apenas contatos com mensagens não lidas
      const contactsWithUnread = currentContacts.filter(c => (c.unreadCount ?? 0) > 0);
      
      if (contactsWithUnread.length === 0) {
        toast.info("Nenhuma mensagem não lida para marcar");
        return;
      }

      const contactIds = contactsWithUnread.map(c => c.id);

      // Marcar todas as mensagens não lidas da aba como lidas no banco
      const { error } = await supabase
        .from('messages')
        .update({ status: 'read' })
        .in('contact_id', contactIds)
        .eq('client_id', profile.client_id)
        .eq('from_me', false)
        .neq('status', 'read');

      if (error) throw error;

      // Marcar como lido no WhatsApp para cada contato (sem parar se um falhar)
      let successCount = 0;
      let errorCount = 0;

      for (const contact of contactsWithUnread) {
        if (contact.phone) {
          try {
            const dest = contact.isGroup ? `${contact.phone}@g.us` : contact.phone;
            await uazapApi.markAsRead({ number: dest, read: true });
            successCount++;
          } catch (err) {
            errorCount++;
            console.error(`Erro ao marcar ${contact.name} como lido:`, err);
          }
        }
      }

      // Recarregar contatos para atualizar contadores
      await loadContacts();
      
      if (errorCount === 0) {
        toast.success(`${successCount} conversas marcadas como lidas`);
      } else if (successCount > 0) {
        toast.success(`${successCount} conversas marcadas como lidas (${errorCount} com erro)`);
      } else {
        toast.error("Erro ao marcar conversas no WhatsApp");
      }
    } catch (error: any) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error("Erro ao marcar mensagens como lidas");
    }
  };

  const handleLoadMoreMessages = async () => {
    if (!selectedContact || isLoadingMore || !hasMoreMessages) return;
    
    setIsLoadingMore(true);
    try {
      const newOffset = messageOffset + 10;
      const result = await loadMessages(selectedContact.id, 10, newOffset);
      setMessageOffset(newOffset);
      setHasMoreMessages(result?.hasMore || false);
    } catch (error) {
      console.error('Erro ao carregar mais mensagens:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSendMessage = async (text: string, replyToId?: string) => {
    if (!selectedContact || !text.trim()) return;
    if (!profile?.client_id) {
      toast.error("Perfil não carregado. Tente novamente.");
      return;
    }

    // Adicionar assinatura se for membro da equipe
    let messageText = text;
    if (profile?.is_team_member && profile?.full_name) {
      messageText = `*${profile.full_name}*:\n${text}`;
    }

    console.log('Enviando mensagem para:', {
      name: selectedContact.name,
      phone: selectedContact.phone,
      isGroup: selectedContact.isGroup,
      replyToId,
      isTeamMember: profile?.is_team_member
    });

    const tempId = Date.now().toString();
    const newMessage: Message = {
      id: tempId,
      text: messageText,
      timestamp: new Date(),
      fromMe: true,
      status: "sending",
      replyTo: replyToId,
    };

    try {
      // Enviar via API
      const destination = selectedContact.isGroup ? `${selectedContact.phone}@g.us` : selectedContact.phone;
      
      // Se tiver replyToId, enviar com replyid
      const response = replyToId 
        ? await uazapApi.sendText({
            number: destination,
            text: messageText,
            readchat: true,
            replyid: replyToId,
          })
        : await uazapApi.sendText({
            number: destination,
            text: messageText,
            readchat: true,
          });

      console.log('Resposta da API:', response);

      // Salvar no banco de dados
      const messageData: any = {
        contact_id: selectedContact.id,
        message_id: response.data?.key?.id || tempId,
        text: messageText,
        from_me: true,
        status: 'sent',
        type: 'text',
        client_id: profile?.client_id,
        reply_to: replyToId,
      };

      // Se estiver respondendo, incluir os dados da mensagem citada no metadata
      if (replyingTo) {
        messageData.metadata = {
          quotedMessage: {
            text: replyingTo.text,
            type: replyingTo.type || 'text',
            senderName: replyingTo.senderName,
          }
        };
      }

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) {
        console.error('Erro ao salvar mensagem no banco:', error);
        throw error;
      }

      // Pausar automaticamente conversas do agente e salvar mensagem na memória
      if (!selectedContact.isGroup) {
        const remoteJid = selectedContact.phone.includes('@')
          ? selectedContact.phone
          : `${selectedContact.phone}@s.whatsapp.net`;
        try {
          // Buscar ou criar conversa do agente
          const { data: agentConversation } = await supabase
            .from('agent_conversations')
            .select('id, agent_id')
            .eq('client_id', profile.client_id!)
            .eq('remote_jid', remoteJid)
            .maybeSingle();

          if (agentConversation) {
            // Salvar mensagem do atendente na memória do agente
            await supabase
              .from('agent_conversation_messages')
              .insert({
                conversation_id: agentConversation.id,
                agent_id: agentConversation.agent_id,
                client_id: profile.client_id!,
                remote_jid: remoteJid,
                role: 'assistant',
                content: messageText,
                metadata: {
                  from_human: true,
                  attendant_name: profile.full_name || 'Atendente',
                  timestamp: new Date().toISOString()
                }
              });

            console.log('Mensagem do atendente salva na memória do agente');
          }

          // Pausar conversa do agente
          const { data: pausedData, error: pauseErr } = await supabase
            .from('agent_conversations')
            .update({
              is_paused: true,
              paused_at: new Date().toISOString(),
              paused_reason: 'Atendente humano assumiu o atendimento',
              pause_triggered_by: 'human_intervention',
            })
            .eq('client_id', profile.client_id!)
            .eq('remote_jid', remoteJid)
            .eq('is_paused', false)
            .select();
          
          if (pauseErr) {
            console.warn('Não foi possível pausar automaticamente a conversa do agente:', pauseErr.message);
          } else if (pausedData && pausedData.length > 0) {
            console.log('Conversa do agente pausada automaticamente por intervenção humana.');
            try {
              await notifyAgentPaused(selectedContact.id, profile.client_id!, false);
            } catch (e) {
              console.warn('Falha ao notificar pausa do agente (texto):', e);
            }
          }
        } catch (e) {
          console.warn('Falha ao pausar conversa do agente ou salvar mensagem:', e);
        }
      }

      console.log('Mensagem salva no banco, recarregando...');
      await loadMessages(selectedContact.id);
      await loadContacts();

    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error(error.message || "Erro ao enviar mensagem");
    }
  };

  const handleSendLocation = async (latitude: number, longitude: number, name?: string, address?: string) => {
    if (!selectedContact) return;
    if (!profile?.client_id) {
      toast.error("Perfil não carregado. Tente novamente.");
      return;
    }

    const tempId = Date.now().toString();

    try {
      const destination = selectedContact.isGroup ? `${selectedContact.phone}@g.us` : selectedContact.phone;
      const response = await uazapApi.sendLocation({
        number: destination,
        latitude,
        longitude,
        name,
        address,
        readchat: true,
      });

      console.log('Resposta da API sendLocation:', response);

      // Salvar no banco de dados
      const messageId = response.data?.key?.id || response.data?.messageId || tempId;

      const { error } = await supabase
        .from('messages')
        .insert({
          contact_id: selectedContact.id,
          message_id: messageId,
          text: name || 'Localização',
          from_me: true,
          status: 'sent',
          type: 'location',
          client_id: profile?.client_id,
          metadata: {
            latitude,
            longitude,
            name,
            address,
          },
        });

      if (error) throw error;

      // Pausar automaticamente conversas do agente e salvar localização na memória
      if (!selectedContact.isGroup) {
        const remoteJid = selectedContact.phone.includes('@')
          ? selectedContact.phone
          : `${selectedContact.phone}@s.whatsapp.net`;
        try {
          // Buscar conversa do agente
          const { data: agentConversation } = await supabase
            .from('agent_conversations')
            .select('id, agent_id')
            .eq('client_id', profile.client_id!)
            .eq('remote_jid', remoteJid)
            .maybeSingle();

          if (agentConversation) {
            // Salvar localização na memória do agente
            await supabase
              .from('agent_conversation_messages')
              .insert({
                conversation_id: agentConversation.id,
                agent_id: agentConversation.agent_id,
                client_id: profile.client_id!,
                remote_jid: remoteJid,
                role: 'assistant',
                content: `Localização compartilhada: ${name || 'Sem nome'}`,
                metadata: {
                  from_human: true,
                  attendant_name: profile.full_name || 'Atendente',
                  type: 'location',
                  latitude,
                  longitude,
                  location_name: name,
                  location_address: address,
                  timestamp: new Date().toISOString()
                }
              });
          }

          // Pausar conversa do agente
          const { data: pausedDataLoc, error: pauseErr } = await supabase
            .from('agent_conversations')
            .update({
              is_paused: true,
              paused_at: new Date().toISOString(),
              paused_reason: 'Atendente humano assumiu o atendimento',
              pause_triggered_by: 'human_intervention',
            })
            .eq('client_id', profile.client_id!)
            .eq('remote_jid', remoteJid)
            .eq('is_paused', false)
            .select();
          if (pauseErr) {
            console.warn('Não foi possível pausar automaticamente a conversa do agente (location):', pauseErr.message);
          } else if (pausedDataLoc && pausedDataLoc.length > 0) {
            console.log('Conversa do agente pausada automaticamente (location).');
            try {
              await notifyAgentPaused(selectedContact.id, profile.client_id!, false);
            } catch (e) {
              console.warn('Falha ao notificar pausa do agente (location):', e);
            }
          }
        } catch (e) {
          console.warn('Falha ao pausar conversa do agente (location):', e);
        }
      }

      await loadMessages(selectedContact.id);
      await loadContacts();
      toast.success('Localização enviada!');

    } catch (error: any) {
      console.error("Erro ao enviar localização:", error);
      toast.error(error.message || "Erro ao enviar localização");
    }
  };

  const handleSendMedia = async(
    file: File,
    type: "image" | "video" | "document" | "audio" | "ptt"
  ) => {
    if (!selectedContact) return;
    if (!profile?.client_id) {
      toast.error("Perfil não carregado. Tente novamente.");
      return;
    }

    const tempId = Date.now().toString();

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const destination = selectedContact.isGroup ? `${selectedContact.phone}@g.us` : selectedContact.phone;
          const response = await uazapApi.sendMedia({
            number: destination,
            type,
            file: base64,
            readchat: true,
            docName: type === 'document' ? file.name : undefined,
          });

          // Salvar no banco de dados
          const apiMediaUrl = response.data?.mediaUrl
            || response.data?.url
            || response.data?.content?.URL
            || response.data?.content?.url
            || null;
          const messageId = response.data?.key?.id
            || response.data?.messageId
            || response.data?.messageid
            || response.data?.id
            || tempId;

          const previewable = ['audio','ptt','image','video'].includes(type);
          const localBlobUrl = previewable ? URL.createObjectURL(file) : null;
          const mediaUrlToSave = apiMediaUrl ?? localBlobUrl;
          
          console.log('Resposta da API sendMedia:', {
            type,
            messageId,
            mediaUrl: mediaUrlToSave,
            fullResponse: response.data
          });

          const { error } = await supabase
            .from('messages')
            .insert({
              contact_id: selectedContact.id,
              message_id: messageId,
              text: type === 'ptt' ? '' : file.name,
              from_me: true,
              status: 'sent',
              type,
              file_name: file.name,
              client_id: profile?.client_id,
              media_url: mediaUrlToSave,
            });

          if (error) throw error;

          // Pausar automaticamente conversas do agente e salvar mídia na memória
          if (!selectedContact.isGroup) {
            const remoteJid = selectedContact.phone.includes('@')
              ? selectedContact.phone
              : `${selectedContact.phone}@s.whatsapp.net`;
            try {
              // Buscar conversa do agente
              const { data: agentConversation } = await supabase
                .from('agent_conversations')
                .select('id, agent_id')
                .eq('client_id', profile.client_id!)
                .eq('remote_jid', remoteJid)
                .maybeSingle();

              if (agentConversation) {
                // Salvar mídia na memória do agente
                await supabase
                  .from('agent_conversation_messages')
                  .insert({
                    conversation_id: agentConversation.id,
                    agent_id: agentConversation.agent_id,
                    client_id: profile.client_id!,
                    remote_jid: remoteJid,
                    role: 'assistant',
                    content: `Mídia compartilhada: ${file.name} (${type})`,
                    metadata: {
                      from_human: true,
                      attendant_name: profile.full_name || 'Atendente',
                      type: 'media',
                      media_type: type,
                      file_name: file.name,
                      media_url: mediaUrlToSave,
                      timestamp: new Date().toISOString()
                    }
                  });
              }

              // Pausar conversa do agente
              const { data: pausedDataMedia, error: pauseErr } = await supabase
                .from('agent_conversations')
                .update({
                  is_paused: true,
                  paused_at: new Date().toISOString(),
                  paused_reason: 'Atendente humano assumiu o atendimento',
                  pause_triggered_by: 'human_intervention',
                })
                .eq('client_id', profile.client_id!)
                .eq('remote_jid', remoteJid)
                .eq('is_paused', false)
                .select();
              if (pauseErr) {
                console.warn('Não foi possível pausar automaticamente a conversa do agente (media):', pauseErr.message);
              } else if (pausedDataMedia && pausedDataMedia.length > 0) {
                console.log('Conversa do agente pausada automaticamente (media).');
                try {
                  await notifyAgentPaused(selectedContact.id, profile.client_id!, false);
                } catch (e) {
                  console.warn('Falha ao notificar pausa do agente (media):', e);
                }
              }
            } catch (e) {
              console.warn('Falha ao pausar conversa do agente (media):', e);
            }
          }

          await loadMessages(selectedContact.id);
          await loadContacts();

        } catch (error: any) {
          console.error("Erro ao enviar mídia:", error);
          toast.error(error.message || "Erro ao enviar mídia");
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("Erro ao processar arquivo:", error);
      toast.error("Erro ao processar arquivo");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Carregando conversas...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-80 border-r border-border flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 m-2">
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Conversas
                {displayIndividualUnreadCount > 0 && (
                  <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                    {displayIndividualUnreadCount}
                  </span>
                )}
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Grupos
                {displayGroupUnreadCount > 0 && (
                  <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                    {displayGroupUnreadCount}
                  </span>
                )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="individual" className="flex-1 m-0 min-h-0">
            <ChatList
              contacts={individualContacts}
              selectedContact={selectedContact}
              onSelectContact={handleSelectContact}
              onMarkAllAsRead={handleMarkAllAsRead}
              onSyncContacts={syncContacts}
              isSyncing={isSyncing}
            />
          </TabsContent>
          
          <TabsContent value="groups" className="flex-1 m-0 min-h-0">
            <ChatList
              contacts={groupContacts}
              selectedContact={selectedContact}
              onSelectContact={handleSelectContact}
              onMarkAllAsRead={handleMarkAllAsRead}
              onSyncContacts={syncContacts}
              isSyncing={isSyncing}
            />
          </TabsContent>
        </Tabs>
      </div>

      {selectedContact ? (
        <div className="flex-1 flex flex-col min-h-0 relative">
          <ChatHeader 
            contact={selectedContact} 
            onOpenDetails={() => setShowContactDetails(true)}
          />
          <ChatMessages 
            messages={messages[selectedContact.id] || []} 
            onLoadMore={handleLoadMoreMessages}
            hasMore={hasMoreMessages}
            isLoadingMore={isLoadingMore}
            onReply={(message) => {
              setReplyingTo({
                id: message.messageId || message.id,
                text: message.text || message.content || 'Mídia',
                senderName: message.fromMe ? 'Você' : selectedContact.name,
                type: message.type
              });
            }}
          />
          <ChatInput
            onSendMessage={handleSendMessage}
            onSendMedia={handleSendMedia}
            onSendLocation={handleSendLocation}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />
          {showContactDetails && (
            <ContactDetailsPanel 
              contact={selectedContact}
              onClose={() => setShowContactDetails(false)}
            />
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-muted/20">
          <div className="text-center">
            <p className="text-muted-foreground">
              {contacts.length === 0 
                ? 'Aguardando mensagens do WhatsApp...'
                : 'Selecione uma conversa para começar'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
