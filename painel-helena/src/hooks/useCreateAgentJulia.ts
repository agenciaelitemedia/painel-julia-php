import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExternalDbQueryResponse {
  success: boolean;
  data?: any[];
  rowCount?: number;
  error?: string;
}

export interface CreateAgentData {
  // Client data
  clientId?: number;
  clientData?: {
    name: string;
    business_name?: string;
    federal_id?: string;
    email: string;
    phone: string;
    country: string;
    state?: string;
    city: string;
    zip_code?: string;
  };
  
  // Agent data
  cod_agent: string;
  is_closer: boolean;
  hub: string;
  settings?: string;
  
  // Plan data
  plan: string;
  limit: number;
  due_date: number;
  
  // Prompt
  prompt?: string;

  // Helena CRM data
  helena_count_id: string;
  helena_token: string;
  wp_number?: string;
}

export interface CreatedAgentResult {
  clientId: number;
  agentId: number;
  codAgent: string;
}

export const useGenerateCodAgent = () => {
  return useMutation({
    mutationFn: async (): Promise<string> => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}${month}`;
      
      // Use numeric range comparison instead of LIKE (cod_agent is bigint)
      const minValue = parseInt(`${prefix}000`);
      const maxValue = parseInt(`${prefix}999`);
      
      const query = `
        SELECT cod_agent FROM public.agents 
        WHERE cod_agent >= $1 AND cod_agent <= $2
        ORDER BY cod_agent DESC 
        LIMIT 1
      `;
      
      const { data, error } = await supabase.functions.invoke<ExternalDbQueryResponse>(
        'public-external-db-query',
        { body: { query, params: [minValue, maxValue] } }
      );

      if (error || !data?.success) {
        // If error or no data, start with 001
        return `${prefix}001`;
      }

      if (data.data && data.data.length > 0) {
        const lastCode = String(data.data[0].cod_agent);
        const lastNumber = parseInt(lastCode.slice(-3), 10);
        const nextNumber = String(lastNumber + 1).padStart(3, '0');
        return `${prefix}${nextNumber}`;
      }

      return `${prefix}001`;
    }
  });
};

export const useCreateAgentJulia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentData: CreateAgentData): Promise<CreatedAgentResult> => {
      let clientId = agentData.clientId;

      // Step 1: Create client if needed
      if (!clientId && agentData.clientData) {
        const createClientQuery = `
          INSERT INTO public.clients (name, business_name, federal_id, email, phone, country, state, city, zip_code)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `;
        
        // Clean masks from data - phone should already come with DDI from ClientStep
        const cleanPhone = agentData.clientData.phone.replace(/\D/g, '');
        const cleanFederalId = agentData.clientData.federal_id?.replace(/\D/g, '') || null;
        const cleanZipCode = agentData.clientData.zip_code?.replace(/\D/g, '') || null;
        
        const clientParams = [
          agentData.clientData.name,
          agentData.clientData.business_name || null,
          cleanFederalId,
          agentData.clientData.email,
          cleanPhone,
          agentData.clientData.country, // Already a 2-letter code from ClientStep
          agentData.clientData.state || null,
          agentData.clientData.city,
          cleanZipCode,
        ];
        
        const { data: clientResult, error: clientError } = await supabase.functions.invoke<ExternalDbQueryResponse>(
          'public-external-db-query',
          { body: { query: createClientQuery, params: clientParams } }
        );

        if (clientError || !clientResult?.success || !clientResult.data?.[0]) {
          throw new Error(clientResult?.error || clientError?.message || 'Failed to create client');
        }
        
        clientId = clientResult.data[0].id;
      }

      if (!clientId) {
        throw new Error('Client ID is required');
      }

      // Step 2: Create agent
      const uuid = crypto.randomUUID();
      const settingsJson = agentData.settings ? agentData.settings : '{}';
      
      const createAgentQuery = `
        INSERT INTO public.agents (client_id, uuid, cod_agent, status, hub, is_closer, settings, evo_url, evo_apikey, evo_instance)
        VALUES ($1, $2, $3, true, $4, $5, $6::jsonb, $7, $8, $9)
        RETURNING id
      `;
      
      const cleanWpNumber = agentData.wp_number?.replace(/\D/g, '') || null;
      
      const agentParams = [
        clientId,
        uuid,
        agentData.cod_agent,
        agentData.hub,
        agentData.is_closer,
        settingsJson,
        agentData.helena_count_id,
        agentData.helena_token,
        cleanWpNumber,
      ];
      
      const { data: agentResult, error: agentError } = await supabase.functions.invoke<ExternalDbQueryResponse>(
        'public-external-db-query',
        { body: { query: createAgentQuery, params: agentParams } }
      );

      if (agentError || !agentResult?.success || !agentResult.data?.[0]) {
        throw new Error(agentResult?.error || agentError?.message || 'Failed to create agent');
      }
      
      const agentId = agentResult.data[0].id;

      // Step 3: Create used_agents
      const createUsedAgentQuery = `
        INSERT INTO public.used_agents (client_id, agent_id, cod_agent, plan, due_date, "limit", used)
        VALUES ($1, $2, $3, $4, $5, $6, 0)
      `;
      
      const usedAgentParams = [
        clientId,
        agentId,
        agentData.cod_agent,
        agentData.plan,
        agentData.due_date,
        agentData.limit,
      ];
      
      const { error: usedAgentError } = await supabase.functions.invoke<ExternalDbQueryResponse>(
        'public-external-db-query',
        { body: { query: createUsedAgentQuery, params: usedAgentParams } }
      );

      if (usedAgentError) {
        throw new Error(usedAgentError.message || 'Failed to create used_agents');
      }

      // Step 4: Create override_settings
      const createOverrideQuery = `
        INSERT INTO public.override_settings (agent_id, prompt)
        VALUES ($1, $2)
      `;
      
      const { error: overrideError } = await supabase.functions.invoke<ExternalDbQueryResponse>(
        'public-external-db-query',
        { body: { query: createOverrideQuery, params: [agentId, agentData.prompt || null] } }
      );

      if (overrideError) {
        throw new Error(overrideError.message || 'Failed to create override_settings');
      }

      // Step 5: Create default followup_config
      const stepCadence = JSON.stringify({
        cadence_1: "5 minutes",
        cadence_2: "15 minutes",
        cadence_3: "30 minutes"
      });
      
      const msgCadence = JSON.stringify({
        cadence_1: null,
        cadence_2: null,
        cadence_3: null
      });
      
      const titleCadence = JSON.stringify({
        cadence_1: "Ste 01",
        cadence_2: "Ste 02",
        cadence_3: "Ste 03"
      });
      
      const createFollowupQuery = `
        INSERT INTO public.followup_config (cod_agent, step_cadence, msg_cadence, title_cadence, start_hours, end_hours, auto_message)
        VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, 0, 23, true)
      `;
      
      const { error: followupError } = await supabase.functions.invoke<ExternalDbQueryResponse>(
        'public-external-db-query',
        { body: { query: createFollowupQuery, params: [agentData.cod_agent, stepCadence, msgCadence, titleCadence] } }
      );

      if (followupError) {
        throw new Error(followupError.message || 'Failed to create followup_config');
      }

      // Step 6: Create agents_helena
      const createAgentsHelenaQuery = `
        INSERT INTO public.agents_helena (cod_agent, helena_count_id, helena_token, wp_number, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, true, NOW(), NOW())
      `;
      
      const { error: helenaError } = await supabase.functions.invoke<ExternalDbQueryResponse>(
        'public-external-db-query',
        { body: { query: createAgentsHelenaQuery, params: [agentData.cod_agent, agentData.helena_count_id, agentData.helena_token, agentData.wp_number || null] } }
      );

      if (helenaError) {
        throw new Error(helenaError.message || 'Failed to create agents_helena');
      }

      return {
        clientId,
        agentId,
        codAgent: agentData.cod_agent,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['external-clients'] });
      queryClient.invalidateQueries({ queryKey: ['public-admin-agents-julia'] });
      toast.success(`Agente ${result.codAgent} criado com sucesso!`);
    },
    onError: (error) => {
      toast.error(`Erro ao criar agente: ${error.message}`);
    }
  });
};
