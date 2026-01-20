import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FollowupStep {
  id?: string;
  title: string;
  step_order: number;
  step_value: number;
  step_unit: 'minutes' | 'hours' | 'days';
  message: string | null;
}

export interface FollowupConfig {
  id?: string;
  agent_id: string;
  client_id: string;
  is_active: boolean;
  auto_message: boolean;
  start_hours: string;
  end_hours: string;
  followup_from: number | null;
  followup_to: number | null;
  trigger_delay_minutes: number;
  steps: FollowupStep[];
}

export const useFollowupConfig = (configId: string, clientId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch config
  const { data: config, isLoading, error } = useQuery({
    queryKey: ['followup-config', configId],
    queryFn: async () => {
      if (!configId) {
        return {
          agent_id: '',
          client_id: clientId,
          is_active: true,
          auto_message: true,
          start_hours: '08:00:00',
          end_hours: '20:00:00',
          followup_from: null,
          followup_to: null,
          trigger_delay_minutes: 30,
          steps: []
        };
      }

      const { data: configData, error: configError } = await supabase
        .from('followup_configs')
        .select('*')
        .eq('id', configId)
        .maybeSingle();

      if (configError) throw configError;

      if (!configData) {
        return {
          agent_id: '',
          client_id: clientId,
          is_active: true,
          auto_message: true,
          start_hours: '08:00:00',
          end_hours: '20:00:00',
          followup_from: null,
          followup_to: null,
          trigger_delay_minutes: 30,
          steps: []
        };
      }

      const { data: stepsData, error: stepsError } = await supabase
        .from('followup_steps')
        .select('*')
        .eq('config_id', configData.id)
        .order('step_order');

      if (stepsError) throw stepsError;

      return {
        ...configData,
        steps: stepsData || []
      };
    },
    enabled: !!clientId
  });

  // Save config mutation
  const saveConfig = useMutation({
    mutationFn: async (configData: FollowupConfig) => {
      // Validações
      if (configData.steps.length === 0) {
        throw new Error('É necessário pelo menos 1 etapa');
      }

      for (const step of configData.steps) {
        if (!step.title || step.title.length < 3) {
          throw new Error('Apelido deve ter no mínimo 3 caracteres');
        }
        if (step.step_value <= 0) {
          throw new Error('Intervalo deve ser maior que 0');
        }
        if (!configData.auto_message && (!step.message || step.message.length < 10)) {
          throw new Error('Mensagem deve ter no mínimo 10 caracteres quando mensagens automáticas estão desativadas');
        }
      }

      if (configData.followup_from !== null && configData.followup_to !== null) {
        if (configData.followup_from === configData.followup_to) {
          throw new Error('Etapas de loop infinito devem ser diferentes');
        }
      }

      const startTime = new Date(`2000-01-01 ${configData.start_hours}`);
      const endTime = new Date(`2000-01-01 ${configData.end_hours}`);
      if (endTime <= startTime) {
        throw new Error('Horário de fim deve ser posterior ao horário de início');
      }

      // Upsert config
      const { data: savedConfig, error: configError } = await supabase
        .from('followup_configs')
        .upsert({
          id: configData.id,
          agent_id: configData.agent_id,
          client_id: configData.client_id,
          is_active: configData.is_active,
          auto_message: configData.auto_message,
          start_hours: configData.start_hours,
          end_hours: configData.end_hours,
          followup_from: configData.followup_from,
          followup_to: configData.followup_to,
          trigger_delay_minutes: configData.trigger_delay_minutes
        })
        .select()
        .single();

      if (configError) throw configError;

      // Delete existing steps
      if (savedConfig.id) {
        await supabase
          .from('followup_steps')
          .delete()
          .eq('config_id', savedConfig.id);
      }

      // Insert new steps
      const stepsToInsert = configData.steps.map((step, index) => ({
        config_id: savedConfig.id,
        title: step.title,
        step_order: index + 1,
        step_value: step.step_value,
        step_unit: step.step_unit,
        message: configData.auto_message ? null : step.message
      }));

      const { error: stepsError } = await supabase
        .from('followup_steps')
        .insert(stepsToInsert);

      if (stepsError) throw stepsError;

      return savedConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followup-config'] });
      queryClient.invalidateQueries({ queryKey: ['followup-configs'] });
      toast({
        title: 'Sucesso',
        description: 'Configuração de follow-up salva com sucesso!'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return {
    config,
    isLoading,
    error,
    saveConfig: saveConfig.mutate,
    isSaving: saveConfig.isPending
  };
};
