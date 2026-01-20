import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NotificationSettings {
  CHAT_RESUME?: boolean;
  ONLY_ME_RESUME?: boolean;
  NOTIFY_RESUME?: string;
  NOTIFY_DOC_CREATED?: string;
  NOTIFY_DOC_SIGNED?: string;
  SESSION_START?: string;
  CONTRACT_SIGNED?: string;
}

interface AgentSettingsResponse {
  settings: NotificationSettings | null;
}

export const usePublicAgentSettings = (
  codAgent: string,
  sessionToken: string | null,
  generateFreshToken?: (() => string | null) | null
) => {
  const queryClient = useQueryClient();

  // Fetch settings
  const { data: settings, isLoading } = useQuery<NotificationSettings>({
    queryKey: ["agent-settings", codAgent],
    queryFn: async () => {
      const query = `
        SELECT settings FROM public.agents WHERE cod_agent = $1
      `;

      const headers: Record<string, string> = {};
      // Gerar token fresco para cada requisição
      const freshToken = generateFreshToken ? generateFreshToken() : sessionToken;
      if (freshToken) {
        headers['x-session-token'] = freshToken;
      }

      const { data, error } = await supabase.functions.invoke<{
        success: boolean;
        data?: AgentSettingsResponse[];
        error?: string;
      }>('public-external-db-query', {
        body: { query, params: [codAgent] },
        headers
      });

      if (error) {
        throw new Error(error.message || 'Erro ao buscar configurações');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha ao buscar configurações');
      }

      return data.data?.[0]?.settings || {};
    },
    enabled: !!codAgent
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (newSettings: NotificationSettings) => {
      const query = `
        UPDATE public.agents
        SET settings = COALESCE(settings, '{}'::jsonb) || $1::jsonb,
            updated_at = NOW()
        WHERE cod_agent = $2
        RETURNING settings
      `;

      const headers: Record<string, string> = {};
      // Gerar token fresco para cada requisição
      const freshToken = generateFreshToken ? generateFreshToken() : sessionToken;
      if (freshToken) {
        headers['x-session-token'] = freshToken;
      }

      const { data, error } = await supabase.functions.invoke<{
        success: boolean;
        data?: any[];
        error?: string;
      }>('public-external-db-query', {
        body: { 
          query, 
          params: [JSON.stringify(newSettings), codAgent] 
        },
        headers
      });

      if (error) {
        throw new Error(error.message || 'Erro ao atualizar configurações');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha ao atualizar configurações');
      }

      return data.data?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-settings", codAgent] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error: Error) => {
      console.error('[usePublicAgentSettings] Error updating settings:', error);
      toast.error(error.message || "Erro ao salvar configurações");
    }
  });

  return {
    settings: settings || {},
    isLoading,
    updateSettings
  };
};
