import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Bot, Sparkles } from 'lucide-react';
import { JuliaAgent } from '@/hooks/useJuliaAgents';
import { supabase } from '@/integrations/supabase/client';
import { useClientData } from '@/hooks/useClientData';
interface WhatsAppInstance {
  id: string;
  instance_name: string;
  phone_number: string | null;
  status: string;
}
interface AgentInstanceInfo {
  id: string;
  instance_id: string | null;
}
interface EditAgentDialogProps {
  agent: JuliaAgent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, name: string, is_active: boolean, instance_id: string | null, agent_type: 'julia' | 'custom', is_paused_globally?: boolean) => void;
  isLoading: boolean;
}
export function EditAgentDialog({
  agent,
  open,
  onOpenChange,
  onSubmit,
  isLoading
}: EditAgentDialogProps) {
  const {
    clientData
  } = useClientData();
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isPausedGlobally, setIsPausedGlobally] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [agentType, setAgentType] = useState<'julia' | 'custom'>('julia');
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [usedInstanceIds, setUsedInstanceIds] = useState<Set<string>>(new Set());
  const [juliaAgentsCount, setJuliaAgentsCount] = useState(0);
  useEffect(() => {
    if (open) {
      loadInstances();
    }
  }, [open]);
  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setIsActive(agent.is_active);
      setIsPausedGlobally(agent.is_paused_globally || false);
      setSelectedInstanceId(agent.instance_id);
      setAgentType(agent.agent_type);
    }
  }, [agent]);
  const loadInstances = async () => {
    setLoadingInstances(true);
    try {
      const {
        data,
        error
      } = await supabase.from('whatsapp_instances').select('id, instance_name, phone_number, status').is('deleted_at', null).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setInstances(data || []);

      // Load agents to check which instances are in use
      const {
        data: agentsData,
        error: agentsError
      } = await supabase.from('julia_agents').select('id, instance_id, agent_type').not('instance_id', 'is', null);
      if (agentsError) throw agentsError;

      // Count Julia agents (excluding current agent if it's Julia)
      const juliaCount = (agentsData || []).filter((a: any) => a.agent_type === 'julia' && a.id !== (agent?.agent_type === 'julia' ? agent.id : null)).length;
      setJuliaAgentsCount(juliaCount);

      // Exclude the current agent's instance from the used list
      const usedIds = new Set((agentsData || []).filter((a: AgentInstanceInfo) => a.id !== agent?.id).map((a: AgentInstanceInfo) => a.instance_id).filter(Boolean) as string[]);
      setUsedInstanceIds(usedIds);
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
    } finally {
      setLoadingInstances(false);
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (agent && name.trim()) {
      onSubmit(agent.id, name.trim(), isActive, selectedInstanceId, agentType, isPausedGlobally);
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Agente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Nome do Agente</Label>
            <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} required disabled={isLoading} />
          </div>

          <div>
            <Label className="mb-3 block">Tipo de Agente</Label>
            <div className="space-y-2">
              <div onClick={() => {
              const maxJuliaAgents = clientData?.max_julia_agents || 0;
              const hasJuliaSlots = juliaAgentsCount < maxJuliaAgents;
              if (hasJuliaSlots || agent?.agent_type === 'julia') {
                setAgentType('julia');
              }
            }} className={`rounded-xl border bg-card text-card-foreground shadow-sm transition-colors p-4 ${agentType === 'julia' ? 'border-primary ring-2 ring-primary/20' : ''} ${juliaAgentsCount >= (clientData?.max_julia_agents || 0) && agent?.agent_type !== 'julia' ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md cursor-pointer hover:border-primary/50'}`}>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">JULIA SRD/CLOSER</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      A Julia vem com todos os recursos avançados: atendimento inteligente, 
                      qualificação de leads e geração automática de contratos.
                    </p>
                    {juliaAgentsCount >= (clientData?.max_julia_agents || 0) && agent?.agent_type !== 'julia' && <p className="text-xs text-destructive mt-2">
                        Limite de agentes Julia atingido ({juliaAgentsCount}/{clientData?.max_julia_agents})
                      </p>}
                  </div>
                </div>
              </div>

              <div onClick={() => setAgentType('custom')} className={`rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md cursor-pointer transition-colors p-4 ${agentType === 'custom' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">JULIA Assistente</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Crie seu próprio agente e personalize completamente o comportamento 
                      e as respostas conforme suas necessidades.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="whatsapp-connection" className="mb-3 block">Conexão WhatsApp</Label>
            {loadingInstances ? <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div> : instances.length === 0 ? <p className="text-sm text-muted-foreground py-4">
                Nenhuma conexão WhatsApp disponível. Crie uma conexão primeiro.
              </p> : <Select value={selectedInstanceId || 'none'} onValueChange={value => setSelectedInstanceId(value === 'none' ? null : value)}>
                <SelectTrigger id="whatsapp-connection" className="w-full">
                  <SelectValue placeholder="Selecione uma conexão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex flex-col">
                      <span className="font-medium">Sem conexão</span>
                      <span className="text-xs text-muted-foreground">
                        Agente sem WhatsApp vinculado
                      </span>
                    </div>
                  </SelectItem>
                  {instances.map(instance => {
                const isInUse = usedInstanceIds.has(instance.id);
                return <SelectItem key={instance.id} value={instance.id} disabled={isInUse}>
                        <div className="flex flex-col">
                          <span className="font-medium">{instance.instance_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {instance.phone_number || 'Sem número'} • {instance.status === 'connected' ? 'Conectado' : 'Desconectado'}
                            {isInUse && ' • Em uso'}
                          </span>
                        </div>
                      </SelectItem>;
              })}
                </SelectContent>
              </Select>}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is-active">Agente Ativo</Label>
            <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} disabled={isLoading} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is-paused-globally">Pausar Globalmente</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Pausa todas as conversas deste agente
              </p>
            </div>
            <Switch id="is-paused-globally" checked={isPausedGlobally} onCheckedChange={setIsPausedGlobally} disabled={isLoading} />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>;
}