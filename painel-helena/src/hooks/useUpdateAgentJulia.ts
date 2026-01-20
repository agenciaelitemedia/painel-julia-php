import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExternalDbQueryResponse {
  success: boolean;
  data?: any[];
  rowCount?: number;
  error?: string;
}

export interface UpdateAgentData {
  cod_agent: string;
  agent_id: number;
  
  // Client table
  name?: string;
  business_name?: string;
  federal_id?: string;
  email?: string;
  phone?: string;
  country?: string;
  state?: string;
  city?: string;
  zip_code?: string;
  
  // Agent table
  is_closer?: boolean;
  settings?: string;
  
  // Used_agents table
  plan?: string;
  limit?: number;
  due_date?: number;
  
  // Override_settings table
  prompt?: string;
  
  // Agents_helena table
  helena_count_id?: string;
  helena_token?: string;
  wp_number?: string;
}

export const useUpdateAgentJulia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateAgentData): Promise<void> => {
      // Step 1: Update client data
      if (data.name || data.email || data.phone || data.city) {
        const updateClientQuery = `
          UPDATE public.clients 
          SET 
            name = COALESCE($2, name),
            business_name = COALESCE($3, business_name),
            federal_id = COALESCE($4, federal_id),
            email = COALESCE($5, email),
            phone = COALESCE($6, phone),
            country = COALESCE($7, country),
            state = COALESCE($8, state),
            city = COALESCE($9, city),
            zip_code = COALESCE($10, zip_code)
          WHERE id = (SELECT client_id FROM public.agents WHERE cod_agent = $1 LIMIT 1)
        `;
        
        const clientParams = [
          data.cod_agent,
          data.name || null,
          data.business_name || null,
          data.federal_id?.replace(/\D/g, '') || null,
          data.email || null,
          data.phone?.replace(/\D/g, '') || null,
          data.country || null,
          data.state || null,
          data.city || null,
          data.zip_code?.replace(/\D/g, '') || null,
        ];
        
        const { error: clientError } = await supabase.functions.invoke<ExternalDbQueryResponse>(
          'public-external-db-query',
          { body: { query: updateClientQuery, params: clientParams } }
        );

        if (clientError) {
          throw new Error(clientError.message || 'Failed to update client');
        }
      }

      // Step 2: Update agent data (including evo_* fields)
      if (data.is_closer !== undefined || data.settings !== undefined || 
          data.helena_count_id || data.helena_token || data.wp_number !== undefined) {
        const updateAgentQuery = `
          UPDATE public.agents 
          SET 
            is_closer = COALESCE($2, is_closer),
            settings = COALESCE($3::jsonb, settings),
            evo_url = COALESCE($4, evo_url),
            evo_apikey = COALESCE($5, evo_apikey),
            evo_instance = COALESCE($6, evo_instance)
          WHERE cod_agent = $1
        `;
        
        const agentParams = [
          data.cod_agent,
          data.is_closer,
          data.settings || null,
          data.helena_count_id || null,
          data.helena_token || null,
          data.wp_number?.replace(/\D/g, '') || null,
        ];
        
        const { error: agentError } = await supabase.functions.invoke<ExternalDbQueryResponse>(
          'public-external-db-query',
          { body: { query: updateAgentQuery, params: agentParams } }
        );

        if (agentError) {
          throw new Error(agentError.message || 'Failed to update agent');
        }
      }

      // Step 3: Update used_agents (plan, limit, due_date)
      if (data.plan || data.limit !== undefined || data.due_date !== undefined) {
        const updateUsedAgentQuery = `
          UPDATE public.used_agents 
          SET 
            plan = COALESCE($2, plan),
            "limit" = COALESCE($3, "limit"),
            due_date = COALESCE($4, due_date)
          WHERE cod_agent = $1
        `;
        
        const usedAgentParams = [
          data.cod_agent,
          data.plan || null,
          data.limit !== undefined ? data.limit : null,
          data.due_date !== undefined ? data.due_date : null,
        ];
        
        const { error: usedAgentError } = await supabase.functions.invoke<ExternalDbQueryResponse>(
          'public-external-db-query',
          { body: { query: updateUsedAgentQuery, params: usedAgentParams } }
        );

        if (usedAgentError) {
          throw new Error(usedAgentError.message || 'Failed to update used_agents');
        }
      }

      // Step 4: Update override_settings (prompt)
      if (data.prompt !== undefined) {
        // First check if override_settings exists for this agent
        const checkQuery = `
          SELECT id FROM public.override_settings WHERE agent_id = $1 LIMIT 1
        `;
        
        const { data: checkResult } = await supabase.functions.invoke<ExternalDbQueryResponse>(
          'public-external-db-query',
          { body: { query: checkQuery, params: [data.agent_id] } }
        );

        if (checkResult?.data && checkResult.data.length > 0) {
          // Update existing
          const updatePromptQuery = `
            UPDATE public.override_settings 
            SET prompt = $2
            WHERE agent_id = $1
          `;
          
          const { error: promptError } = await supabase.functions.invoke<ExternalDbQueryResponse>(
            'public-external-db-query',
            { body: { query: updatePromptQuery, params: [data.agent_id, data.prompt] } }
          );

          if (promptError) {
            throw new Error(promptError.message || 'Failed to update prompt');
          }
        } else {
          // Insert new
          const insertPromptQuery = `
            INSERT INTO public.override_settings (agent_id, prompt)
            VALUES ($1, $2)
          `;
          
          const { error: promptError } = await supabase.functions.invoke<ExternalDbQueryResponse>(
            'public-external-db-query',
            { body: { query: insertPromptQuery, params: [data.agent_id, data.prompt] } }
          );

          if (promptError) {
            throw new Error(promptError.message || 'Failed to insert prompt');
          }
        }
      }

      // Step 5: Update agents_helena (helena_token, wp_number)
      if (data.helena_token || data.wp_number !== undefined) {
        const updateHelenaQuery = `
          UPDATE public.agents_helena 
          SET 
            helena_token = COALESCE($2, helena_token),
            wp_number = COALESCE($3, wp_number),
            updated_at = NOW()
          WHERE cod_agent = $1
        `;
        
        const { error: helenaError } = await supabase.functions.invoke<ExternalDbQueryResponse>(
          'public-external-db-query',
          { 
            body: { 
              query: updateHelenaQuery, 
              params: [
                data.cod_agent, 
                data.helena_token || null,
                data.wp_number?.replace(/\D/g, '') || null
              ] 
            } 
          }
        );

        if (helenaError) {
          throw new Error(helenaError.message || 'Failed to update helena data');
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agents-julia'] });
      toast.success('Agente atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar agente: ${error.message}`);
    }
  });
};
