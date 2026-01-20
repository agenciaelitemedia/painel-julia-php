import { useState, useEffect } from "react";
import { X, Phone, Tag, FileText, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Contact } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSystemNotifications } from "@/hooks/useSystemNotifications";

interface ContactDetailsPanelProps {
  contact: Contact;
  onClose: () => void;
}

export function ContactDetailsPanel({ contact, onClose }: ContactDetailsPanelProps) {
  const { profile } = useAuth();
  const [notes, setNotes] = useState("");
  const [originalNotes, setOriginalNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [agentConversation, setAgentConversation] = useState<any>(null);
  const [agent, setAgent] = useState<any>(null);
  const [isTogglingAgent, setIsTogglingAgent] = useState(false);
  const { notifyAgentPaused, notifyAgentResumed, notifyNoteCreated, notifyNoteUpdated, notifyNoteDeleted } = useSystemNotifications();

  useEffect(() => {
    loadContactData();
    loadAgentData();
  }, [contact.id]);

  const loadContactData = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('notes')
        .eq('id', contact.id)
        .single();

      if (error) throw error;
      
      const contactNotes = data?.notes || "";
      setNotes(contactNotes);
      setOriginalNotes(contactNotes);
    } catch (error) {
      console.error('Erro ao carregar dados do contato:', error);
    }
  };

  const loadAgentData = async () => {
    try {
      if (!profile?.client_id) return;
      
      console.log('Loading agent data for contact:', contact.id, contact.phone);
      
      // Construir remote_jid a partir do telefone
      const remoteJid = contact.phone.includes('@') 
        ? contact.phone 
        : `${contact.phone}@s.whatsapp.net`;
      
      console.log('Remote JID:', remoteJid);
      
      // Buscar conversa do agente por remote_jid OU contact_id
      const { data: conversation, error: convError } = await supabase
        .from('agent_conversations')
        .select('*, julia_agents(*)')
        .or(`remote_jid.eq.${remoteJid},contact_id.eq.${contact.id}`)
        .maybeSingle();

      console.log('Agent conversation query result:', { conversation, error: convError });

      if (convError) throw convError;

      if (conversation) {
        // Conversa encontrada - agente custom ou julia com conversa
        setAgentConversation(conversation);
        setAgent(conversation.julia_agents);
        console.log('✅ Agent conversation found:', conversation);
      } else {
        // FALLBACK: Buscar agente Julia global ativo (para webhook externo)
        console.log('⚠️ No agent_conversation found. Checking for global Julia agent...');
        
        const { data: globalAgent, error: agentErr } = await supabase
          .from('julia_agents')
          .select('*')
          .eq('client_id', profile.client_id)
          .eq('agent_type', 'julia')
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (agentErr) {
          console.error('Error fetching global Julia agent:', agentErr);
          throw agentErr;
        }

        if (globalAgent) {
          console.log('✅ Global Julia agent found (fallback):', globalAgent);
          // Criar um objeto simulado de conversa para manter compatibilidade
          setAgentConversation({
            id: 'virtual-julia-conversation',
            is_paused: false,
            agent_id: globalAgent.id,
            remote_jid: remoteJid,
            client_id: profile.client_id,
          });
          setAgent(globalAgent);
        } else {
          console.log('❌ No global Julia agent found');
          setAgentConversation(null);
          setAgent(null);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do agente:', error);
    }
  };

  const handleSaveNotes = async () => {
    if (!profile?.client_id) {
      toast.error("Perfil não carregado");
      return;
    }

    setIsSavingNotes(true);
    try {
      const isCreating = !originalNotes;
      const userName = profile.full_name || 'Usuário';

      const { error } = await supabase
        .from('contacts')
        .update({ 
          notes,
          notes_updated_by: profile.id,
          notes_updated_by_name: userName,
          notes_updated_at: new Date().toISOString()
        })
        .eq('id', contact.id)
        .eq('client_id', profile.client_id);

      if (error) throw error;

      // Inserir notificação no chat
      if (isCreating) {
        await notifyNoteCreated(contact.id, profile.client_id, userName);
      } else {
        await notifyNoteUpdated(contact.id, profile.client_id, userName);
      }

      setOriginalNotes(notes);
      setIsEditingNotes(false);
      toast.success('Notas salvas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar notas:', error);
      toast.error('Erro ao salvar notas');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCancelEdit = () => {
    setNotes(originalNotes);
    setIsEditingNotes(false);
  };

  const handleToggleAgent = async () => {
    if (!agentConversation || !profile?.client_id) return;

    setIsTogglingAgent(true);
    try {
      const newPausedState = !agentConversation.is_paused;
      
      const { error } = await supabase
        .from('agent_conversations')
        .update({ 
          is_paused: newPausedState,
          paused_at: newPausedState ? new Date().toISOString() : null,
          paused_reason: newPausedState ? 'Pausado manualmente pelo usuário' : null,
          pause_triggered_by: newPausedState ? 'manual' : null,
        })
        .eq('id', agentConversation.id)
        .eq('client_id', profile.client_id);

      if (error) throw error;

      // Notificação do sistema no chat
      try {
        if (newPausedState) {
          await notifyAgentPaused(contact.id, profile.client_id, false);
        } else {
          await notifyAgentResumed(contact.id, profile.client_id, false);
        }
      } catch (e) {
        console.warn('Falha ao inserir notificação do sistema:', e);
      }

      await loadAgentData();
      const agentLabel = agent?.agent_type === 'custom' ? 'Assistente IA' : 'Agente';
      toast.success(newPausedState 
        ? `${agentLabel} desativado para este contato` 
        : `${agentLabel} ativado para este contato`
      );
    } catch (error: any) {
      console.error('Erro ao alternar agente:', error);
      toast.error('Erro ao alterar status da IA');
    } finally {
      setIsTogglingAgent(false);
    }
  };

  const isAgentActive = agentConversation && !agentConversation.is_paused && agent?.is_active;

  return (
    <div className="absolute top-0 right-0 h-full w-96 bg-background border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <h2 className="text-lg font-semibold">Dados do contato</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Avatar e Nome */}
          <div className="flex flex-col items-center space-y-3 py-4">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-semibold text-primary ring-4 ring-primary/20">
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-xl font-semibold text-center">{contact.name}</h3>
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>Telefone</span>
            </div>
            <div className="pl-6">
              <p className="text-sm font-mono">{contact.phone}</p>
            </div>
          </div>

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span>Etiquetas</span>
              </div>
              <div className="flex flex-wrap gap-2 pl-6">
                {contact.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notas Internas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Notas internas</span>
              </div>
              {!isEditingNotes && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingNotes(true)}
                  className="h-8 text-xs"
                >
                  Alterar
                </Button>
              )}
            </div>
            
            {isEditingNotes ? (
              <div className="space-y-2 pl-6">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione notas sobre o contato..."
                  className="min-h-[100px] text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                  >
                    {isSavingNotes ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSavingNotes}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pl-6">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {notes || 'Nenhuma nota cadastrada'}
                </p>
              </div>
            )}
          </div>

          {/* Controle de IA */}
          {agent && (
            <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">
                      {agent.agent_type === 'custom' ? 'Assistente IA' : 'Agente Julia'}
                    </h4>
                    <p className="text-xs text-muted-foreground">{agent.name}</p>
                  </div>
                  <Badge variant={isAgentActive ? "default" : "secondary"} className="text-xs">
                    {isAgentActive ? "Ativo" : "Pausado"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50">
                    <div className="space-y-1">
                      <Label htmlFor="agent-toggle" className="text-sm font-medium cursor-pointer">
                        {isAgentActive 
                          ? `Desativar ${agent.agent_type === 'custom' ? 'Assistente IA' : 'Agente'}` 
                          : `Ativar ${agent.agent_type === 'custom' ? 'Assistente IA' : 'Agente'}`
                        }
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {isAgentActive 
                          ? `${agent.agent_type === 'custom' ? 'Assistente' : 'Agente'} responde automaticamente`
                          : `${agent.agent_type === 'custom' ? 'Assistente' : 'Agente'} não responderá`
                        }
                      </p>
                    </div>
                    <Switch
                      id="agent-toggle"
                      checked={isAgentActive}
                      onCheckedChange={handleToggleAgent}
                      disabled={isTogglingAgent || !agent.is_active || agentConversation?.id === 'virtual-julia-conversation'}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1 px-2">
                    <p>• Código: <span className="font-mono text-foreground">{agent.agent_code}</span></p>
                    {agent.is_paused_globally && (
                      <p className="text-amber-600 dark:text-amber-400">
                        ⚠️ Agente pausado globalmente
                      </p>
                    )}
                    {!agent.is_active && (
                      <p className="text-destructive">
                        ⚠️ Agente está desativado
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
