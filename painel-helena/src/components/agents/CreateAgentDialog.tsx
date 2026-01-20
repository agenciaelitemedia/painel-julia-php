import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Bot, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface WhatsAppInstance {
  id: string;
  instance_name: string;
  phone_number: string | null;
  status: string;
}

interface JuliaAgent {
  id: string;
  instance_id: string | null;
}

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, instanceId: string | null, agentType: 'julia' | 'custom') => void;
  isLoading: boolean;
}

export function CreateAgentDialog({ open, onOpenChange, onSubmit, isLoading }: CreateAgentDialogProps) {
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [agentType, setAgentType] = useState<'julia' | 'custom'>('custom');
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [maxJulias, setMaxJulias] = useState<number>(1);
  const [juliaCount, setJuliaCount] = useState<number>(0);
  const [usedInstanceIds, setUsedInstanceIds] = useState<Set<string>>(new Set());

  const juliaLimitReached = juliaCount >= maxJulias;

  const loadJuliaLimits = async () => {
    if (!profile?.client_id) return;

    try {
      // Get client limits
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('max_julia_agents')
        .eq('id', profile.client_id)
        .single();

      if (clientError) throw clientError;
      setMaxJulias(clientData.max_julia_agents);

      // Count existing julia agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('julia_agents')
        .select('id', { count: 'exact' })
        .eq('client_id', profile.client_id)
        .eq('agent_type', 'julia');

      if (agentsError) throw agentsError;
      setJuliaCount(agentsData?.length || 0);
    } catch (error) {
      console.error('Erro ao carregar limites:', error);
    }
  };

  const loadInstances = async () => {
    setLoadingInstances(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_name, phone_number, status')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstances(data || []);

      // Load agents to check which instances are in use
      const { data: agentsData, error: agentsError } = await supabase
        .from('julia_agents')
        .select('id, instance_id')
        .not('instance_id', 'is', null);

      if (agentsError) throw agentsError;
      
      const usedIds = new Set((agentsData || []).map((agent: JuliaAgent) => agent.instance_id).filter(Boolean) as string[]);
      setUsedInstanceIds(usedIds);
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
    } finally {
      setLoadingInstances(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadInstances();
      loadJuliaLimits();
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), selectedInstanceId, agentType);
      setName('');
      setSelectedInstanceId(null);
      setAgentType(juliaLimitReached ? 'custom' : 'julia');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Agente</DialogTitle>
          <DialogDescription>
            O código do agente será gerado automaticamente
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Agente</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Agente Principal"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label className="mb-3 block">Tipo de Agente</Label>
            <div className="space-y-2">
              <div
                onClick={() => !juliaLimitReached && setAgentType('julia')}
                className={`rounded-xl border bg-card text-card-foreground shadow-sm transition-colors p-4 ${
                  juliaLimitReached 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:shadow-md cursor-pointer'
                } ${
                  agentType === 'julia' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Agentes da Julia Completo</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {juliaLimitReached 
                        ? `Limite atingido (${juliaCount}/${maxJulias}). Use agente personalizado.`
                        : `A Julia vem com todos os recursos avançados: atendimento inteligente, 
                      qualificação de leads e geração automática de contratos.`
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setAgentType('custom')}
                className={`rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md cursor-pointer transition-colors p-4 ${
                  agentType === 'custom' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Agente Personalizado</p>
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
            {loadingInstances ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : instances.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Nenhuma conexão WhatsApp disponível. Crie uma conexão primeiro.
              </p>
            ) : (
              <Select 
                value={selectedInstanceId || 'none'} 
                onValueChange={(value) => setSelectedInstanceId(value === 'none' ? null : value)}
              >
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
                  {instances.map((instance) => {
                    const isInUse = usedInstanceIds.has(instance.id);
                    return (
                      <SelectItem key={instance.id} value={instance.id} disabled={isInUse}>
                        <div className="flex flex-col">
                          <span className="font-medium">{instance.instance_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {instance.phone_number || 'Sem número'} • {instance.status === 'connected' ? 'Conectado' : 'Desconectado'}
                            {isInUse && ' • Em uso'}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Agente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
