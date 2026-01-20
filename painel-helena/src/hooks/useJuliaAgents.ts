import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface AgentTool {
  tool_id: string;
  enabled: boolean;
  config?: {
    calendar_id?: string;
    [key: string]: any;
  };
}

export interface StartConversationPhrases {
  enabled: boolean;
  match_type: 'contains' | 'equals';
  phrases: string[];
}

export interface JuliaAgent {
  id: string;
  client_id: string;
  name: string;
  agent_code: string;
  is_active: boolean;
  is_paused_globally?: boolean | null;
  instance_id: string | null;
  agent_type: 'julia' | 'custom';
  created_at: string;
  updated_at: string;
  selected_julia_code?: string | null;
  custom_prompt?: string | null;
  ai_model_id?: string | null;
  ai_temperature?: number | null;
  ai_max_tokens?: number | null;
  system_instructions?: string | null;
  pause_phrases?: string[] | null;
  tools_config?: any;
  release_customization?: boolean | null;
  agent_bio?: string | null;
  start_conversation_phrases?: StartConversationPhrases | null;
  whatsapp_instances?: {
    instance_name: string;
    status: string;
  } | null;
}

export function useJuliaAgents() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const { data: agents, isLoading, error } = useQuery({
    queryKey: ['julia-agents', profile?.client_id],
    queryFn: async () => {
      if (!profile?.client_id) {
        return [];
      }

      const { data, error } = await supabase
        .from('julia_agents')
        .select('*, whatsapp_instances(instance_name, status)')
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(agent => ({
        ...agent,
        start_conversation_phrases: agent.start_conversation_phrases as unknown as StartConversationPhrases | null
      })) as JuliaAgent[];
    },
    enabled: !!profile?.client_id,
  });

  const createAgent = useMutation({
    mutationFn: async ({ 
      name, 
      client_id, 
      client_code, 
      instance_id, 
      agent_type 
    }: { 
      name: string; 
      client_id: string; 
      client_code: string; 
      instance_id: string | null; 
      agent_type: 'julia' | 'custom';
    }) => {
      // Buscar o último agente criado do cliente e gerar o próximo código preservando zeros à esquerda
      const { data: lastAgents } = await supabase
        .from('julia_agents')
        .select('agent_code, created_at')
        .eq('client_id', client_id)
        .order('created_at', { ascending: false })
        .limit(1);

      const prefix = `${client_code}0`;
      let nextSuffix = '1';

      if (lastAgents && lastAgents.length > 0) {
        const lastCode = lastAgents[0].agent_code || '';
        if (lastCode.startsWith(prefix)) {
          const digits = lastCode.slice(prefix.length);
          if (/^\d+$/.test(digits) && digits.length > 0) {
            const incremented = (parseInt(digits, 10) + 1).toString();
            nextSuffix = incremented.padStart(digits.length, '0');
          }
        } else {
          // Fallback: calcular com base no maior sufixo dos códigos válidos para este cliente
          const { data: allCodes } = await supabase
            .from('julia_agents')
            .select('agent_code')
            .eq('client_id', client_id);

          const suffixes = (allCodes || [])
            .map((a) => a.agent_code)
            .filter((code): code is string => !!code && code.startsWith(prefix))
            .map((code) => code.slice(prefix.length))
            .filter((s) => /^\d+$/.test(s));

          if (suffixes.length > 0) {
            const maxNum = Math.max(...suffixes.map((s) => parseInt(s, 10)));
            const maxLen = Math.max(...suffixes.map((s) => s.length));
            nextSuffix = (maxNum + 1).toString().padStart(maxLen, '0');
          }
        }
      }

      const agent_code = `${prefix}${nextSuffix}`;

      // Buscar a configuração de release_customization do cliente
      let release_customization = true;
      if (agent_type === 'custom') {
        const { data: clientData } = await supabase
          .from('clients')
          .select('release_customization')
          .eq('id', client_id)
          .single();
        
        release_customization = clientData?.release_customization ?? true;
      }

      const { data, error } = await supabase
        .from('julia_agents')
        .insert({
          name,
          client_id,
          agent_code,
          instance_id,
          agent_type,
          is_active: true,
          release_customization,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['julia-agents'] });
      toast.success('Agente criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar agente: ' + error.message);
    },
  });

  const updateAgent = useMutation({
    mutationFn: async ({ 
      id, 
      name, 
      is_active, 
      instance_id, 
      agent_type,
      is_paused_globally
    }: { 
      id: string; 
      name: string; 
      is_active: boolean; 
      instance_id: string | null; 
      agent_type: 'julia' | 'custom';
      is_paused_globally?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('julia_agents')
        .update({ name, is_active, instance_id, agent_type, is_paused_globally })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // ✅ REGRA: Quando agente é pausado, cancelar follow-ups ativos
      if (is_paused_globally !== undefined) {
        try {
          await supabase.functions.invoke('pause-agent-followup', {
            body: { 
              agent_id: id, 
              is_paused: is_paused_globally 
            }
          });
        } catch (err) {
          console.error('Erro ao processar pausa de follow-ups:', err);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['julia-agents'] });
      toast.success('Agente atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar agente: ' + error.message);
    },
  });

  const deleteAgent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('julia_agents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['julia-agents'] });
      toast.success('Agente excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir agente: ' + error.message);
    },
  });

  const configureAgent = useMutation({
    mutationFn: async ({ 
      id, 
      selectedCode, 
      customPrompt,
      aiModelId,
      aiTemperature,
      aiMaxTokens,
      systemInstructions,
      pausePhrases,
      toolsConfig,
      agentBio,
      startConversationPhrases
    }: { 
      id: string; 
      selectedCode?: string; 
      customPrompt?: string;
      aiModelId?: string;
      aiTemperature?: number;
      aiMaxTokens?: number;
      systemInstructions?: string;
      pausePhrases?: string[];
      toolsConfig?: { enabled_tools: AgentTool[] };
      agentBio?: string;
      startConversationPhrases?: StartConversationPhrases;
    }) => {
      const updateData: any = { 
        selected_julia_code: selectedCode,
        custom_prompt: customPrompt,
        ai_model_id: aiModelId,
        ai_temperature: aiTemperature,
        ai_max_tokens: aiMaxTokens,
        system_instructions: systemInstructions,
        pause_phrases: pausePhrases,
        tools_config: toolsConfig,
        agent_bio: agentBio,
        start_conversation_phrases: startConversationPhrases,
      };

      const { error } = await supabase
        .from('julia_agents')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['julia-agents'] });
      toast.success('Agente configurado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao configurar agente: ' + error.message);
    },
  });

  return {
    agents,
    isLoading,
    error,
    createAgent,
    updateAgent,
    deleteAgent,
    configureAgent,
  };
}
