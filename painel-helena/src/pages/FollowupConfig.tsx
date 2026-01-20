import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FollowupStepRow } from '@/components/followup/FollowupStepRow';
import { useFollowupConfig, FollowupStep } from '@/hooks/useFollowupConfig';
import { useAuth } from '@/hooks/useAuth';
import { useJuliaAgents } from '@/hooks/useJuliaAgents';
import { Plus, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const FollowupConfig = () => {
  const { configId } = useParams<{ configId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { agents } = useJuliaAgents();
  const isNewConfig = configId === 'new';

  const { config, isLoading, saveConfig, isSaving } = useFollowupConfig(
    isNewConfig ? '' : (configId || ''),
    profile?.client_id || ''
  );

  const [formData, setFormData] = useState({
    agent_id: '',
    is_active: true,
    auto_message: true,
    start_hours: '08:00',
    end_hours: '20:00',
    followup_from: null as number | null,
    followup_to: null as number | null,
    steps: [] as FollowupStep[]
  });

  useEffect(() => {
    if (config && !isNewConfig) {
      setFormData({
        agent_id: config.agent_id,
        is_active: config.is_active,
        auto_message: config.auto_message,
        start_hours: config.start_hours.substring(0, 5),
        end_hours: config.end_hours.substring(0, 5),
        followup_from: config.followup_from,
        followup_to: config.followup_to,
        steps: config.steps || []
      });
    }
  }, [config, isNewConfig]);

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          title: '',
          step_order: prev.steps.length + 1,
          step_value: 1,
          step_unit: 'hours' as const,
          message: null
        }
      ]
    }));
  };

  const updateStep = (index: number, field: keyof FollowupStep, value: any) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const deleteStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!profile?.client_id || !formData.agent_id) {
      toast.error('Selecione um agente antes de salvar');
      return;
    }

    // Validar loop infinito: ambas as etapas devem ser definidas ou nenhuma
    if ((formData.followup_from !== null && formData.followup_to === null) || 
        (formData.followup_from === null && formData.followup_to !== null)) {
      toast.error('Para configurar o loop infinito, defina ambas as etapas "De" e "Para"');
      return;
    }

    // Validar loop infinito: etapa "De" deve ser maior que etapa "Para"
    if (formData.followup_from !== null && formData.followup_to !== null) {
      if (formData.followup_from <= formData.followup_to) {
        toast.error('No loop infinito, a etapa "De" deve ser maior que a etapa "Para"');
        return;
      }
    }

    try {
      await saveConfig({
        id: isNewConfig ? undefined : configId,
        ...formData,
        client_id: profile.client_id,
        trigger_delay_minutes: 30,
        start_hours: `${formData.start_hours}:00`,
        end_hours: `${formData.end_hours}:00`,
        steps: formData.steps
      });
      
      toast.success('Configuração salva com sucesso!');
      // Não redireciona - mantém na mesma tela
    } catch (error) {
      // Error is already handled by the mutation
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Configuração de Follow-up</h1>
          <p className="text-muted-foreground">Configure as etapas de follow-up automático</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
          <CardDescription>
            Defina o comportamento geral do sistema de follow-up
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Agente Julia</label>
            <Select
              value={formData.agent_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, agent_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um agente" />
              </SelectTrigger>
              <SelectContent>
                {agents?.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name} ({agent.agent_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Follow-up Ativo</label>
              <p className="text-sm text-muted-foreground">
                Ativar ou desativar o sistema de follow-up
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Mensagens Automáticas</label>
              <p className="text-sm text-muted-foreground">
                Gerar mensagens automaticamente com IA
              </p>
            </div>
            <Switch
              checked={formData.auto_message}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_message: checked }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Horário de Início</label>
              <input
                type="time"
                value={formData.start_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, start_hours: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Follow-ups maiores que 1h respeitam este horário
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Horário de Término</label>
              <input
                type="time"
                value={formData.end_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, end_hours: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Mensagens não serão enviadas após este horário
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Loop Infinito - De</label>
              <Select
                value={formData.followup_from?.toString() || 'none'}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  followup_from: value === 'none' ? null : parseInt(value)
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a etapa inicial" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {formData.steps.map((_, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      Etapa {index + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Loop Infinito - Para</label>
              <Select
                value={formData.followup_to?.toString() || 'none'}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  followup_to: value === 'none' ? null : parseInt(value)
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a etapa de retorno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {formData.steps.map((_, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      Etapa {index + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Etapas de Follow-up</CardTitle>
              <CardDescription>
                Configure as etapas e mensagens do follow-up
              </CardDescription>
            </div>
            <Button onClick={addStep} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Etapa
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.steps.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma etapa configurada</p>
              <p className="text-sm">Clique em "Adicionar Etapa" para começar</p>
            </div>
          ) : (
            formData.steps.map((step, index) => (
              <FollowupStepRow
                key={index}
                step={step}
                index={index}
                autoMessage={formData.auto_message}
                onUpdate={updateStep}
                onDelete={deleteStep}
              />
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configuração
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default FollowupConfig;
