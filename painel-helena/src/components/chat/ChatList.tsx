import { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Plus, MessageCircle, RefreshCw, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Contact } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ChatListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  onNewMessage?: () => void;
  onMarkAllAsRead?: () => void;
  onSyncContacts?: () => void;
  isSyncing?: boolean;
}

export function ChatList({ contacts, selectedContact, onSelectContact, onNewMessage, onMarkAllAsRead, onSyncContacts, isSyncing }: ChatListProps) {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstances, setSelectedInstances] = useState<string[]>([]);
  const [instances, setInstances] = useState<Array<{ id: string; instance_name: string; deleted_at: string | null; has_contacts: boolean }>>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);

  // Carregar instâncias disponíveis (incluindo arquivadas com contatos)
  useEffect(() => {
    const loadInstances = async () => {
      if (!profile?.client_id) return;

      // Buscar todas as instâncias (ativas e arquivadas)
      const { data: instancesData } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_name, deleted_at')
        .eq('client_id', profile.client_id)
        .order('instance_name');

      if (instancesData) {
        // Para cada instância, verificar se há contatos vinculados
        const instancesWithContacts = await Promise.all(
          instancesData.map(async (instance) => {
            const { count } = await supabase
              .from('contacts')
              .select('*', { count: 'exact', head: true })
              .eq('instance_id', instance.id);

            return {
              ...instance,
              has_contacts: (count || 0) > 0
            };
          })
        );

        // Filtrar: mostrar ativas sempre, arquivadas apenas se tiverem contatos
        const filteredInstances = instancesWithContacts.filter(
          inst => !inst.deleted_at || inst.has_contacts
        );

        setInstances(filteredInstances);
      }
    };

    loadInstances();
  }, [profile?.client_id]);

  const handleInstanceToggle = (instanceId: string) => {
    setSelectedInstances(prev => 
      prev.includes(instanceId)
        ? prev.filter(id => id !== instanceId)
        : [...prev, instanceId]
    );
  };

  const filteredContacts = contacts.filter(contact => {
    // Filtro de busca
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery);
    
    // Filtro de instâncias
    const matchesInstance = selectedInstances.length === 0 || 
      (contact.instanceName && selectedInstances.some(id => {
        const instance = instances.find(i => i.id === id);
        return instance?.instance_name === contact.instanceName;
      }));

    return matchesSearch && matchesInstance;
  });

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--whatsapp-sidebar))] border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Conversas</h1>
          <div className="flex items-center gap-2">
            <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-[hsl(var(--whatsapp-hover))] rounded-full transition-colors relative">
                  <Filter className="h-5 w-5 text-muted-foreground" />
                  {selectedInstances.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full text-[10px] text-primary-foreground flex items-center justify-center">
                      {selectedInstances.length}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-background border-border z-50">
                <DropdownMenuLabel>Filtros</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <Collapsible open={isConnectionsOpen} onOpenChange={setIsConnectionsOpen}>
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center justify-between w-full px-2 py-2 hover:bg-accent rounded-sm">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        <span className="text-sm font-medium">Conexões</span>
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform",
                        isConnectionsOpen && "rotate-180"
                      )} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-2 py-1 space-y-1">
                    {instances.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">Nenhuma conexão disponível</p>
                    ) : (
                      instances.map((instance) => (
                        <div key={instance.id} className="flex items-center space-x-2 py-1.5">
                          <Checkbox
                            id={instance.id}
                            checked={selectedInstances.includes(instance.id)}
                            onCheckedChange={() => handleInstanceToggle(instance.id)}
                          />
                          <label
                            htmlFor={instance.id}
                            className={cn(
                              "text-sm cursor-pointer flex-1 flex items-center gap-2",
                              instance.deleted_at && "text-destructive"
                            )}
                          >
                            {instance.deleted_at && <X className="h-3 w-3" />}
                            {instance.instance_name}
                          </label>
                        </div>
                      ))
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {selectedInstances.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setSelectedInstances([])}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      Limpar filtros
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-[hsl(var(--whatsapp-hover))] rounded-full transition-colors">
                  <MoreVertical className="h-5 w-5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background border-border z-50">
                <DropdownMenuItem onClick={onNewMessage} className="cursor-pointer">
                  <div className="flex items-center justify-between w-full">
                    <span>Nova Mensagem</span>
                    <Plus className="h-4 w-4" />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onMarkAllAsRead} className="cursor-pointer">
                  <div className="flex items-center justify-between w-full">
                    <span>Marcar tudo como lida</span>
                    <MessageCircle className="h-4 w-4" />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSyncContacts} disabled={isSyncing} className="cursor-pointer">
                  <div className="flex items-center justify-between w-full">
                    <span>Sincronizar contatos</span>
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversa"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-[hsl(var(--whatsapp-bg))] border-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-accent rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => onSelectContact(contact)}
            className={cn(
              "w-full p-3 flex items-center gap-3 hover:bg-[hsl(var(--whatsapp-hover))] transition-colors border-b border-border/50",
              selectedContact?.id === contact.id && "bg-[hsl(var(--whatsapp-hover))]"
            )}
          >
            <Avatar className="h-11 w-11 flex-shrink-0">
              <AvatarImage src={contact.avatar} alt={contact.name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {contact.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 flex flex-col items-start gap-1">
              <div className="flex items-center justify-between gap-2 w-full">
                <h3 className="font-semibold text-sm truncate">{contact.name}</h3>
                {(contact.unreadCount ?? 0) > 0 && (
                  <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                    {contact.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-start justify-between gap-2 w-full">
                <p className="text-xs text-muted-foreground truncate flex-1 text-left">
                  {contact.lastMessage || "Sem mensagens"}
                </p>
                {contact.lastMessageTime && (
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {contact.lastMessageTime}
                  </span>
                )}
              </div>
              {contact.instanceName && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-4 gap-1 flex items-center",
                    contact.instanceDeleted 
                      ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20" 
                      : "bg-[hsl(30,70%,50%)] text-white border-transparent hover:bg-[hsl(30,70%,45%)]"
                  )}
                >
                  {contact.instanceDeleted && <X className="h-3 w-3" />}
                  {contact.instanceName}
                </Badge>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
