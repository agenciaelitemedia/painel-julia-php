import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LegalRepresentativeData {
  representative_name?: string;
  representative_cpf?: string;
  representative_relationship?: string;
  minor_name?: string;
  minor_birth_date?: string;
  reason?: string;
}

export interface ContractTemplate {
  id: number;
  agent_case_legal_id: number | null;
  template_name: string;
  storage_path: string;
  file_name: string;
  file_size: number;
  variables: string[];
  zapsign_template_id: string | null;
  zapsign_doc_token: string | null;
  is_main_document: boolean;
  parent_template_id: number | null;
  is_legal_representative: boolean;
  legal_representative_data: LegalRepresentativeData;
  status: 'draft' | 'testing' | 'active' | 'error';
  test_data: Record<string, string>;
  error_message: string | null;
  cod_agent: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  case_name?: string;
}

interface FetchTemplatesParams {
  codAgent: string;
  sessionToken: string | null;
  filters?: {
    caseId?: number;
    status?: string;
    isLegalRepresentative?: boolean;
  };
}

export function usePublicContractTemplates({ codAgent, sessionToken, filters }: FetchTemplatesParams) {
  return useQuery({
    queryKey: ['contract-templates', codAgent, filters],
    queryFn: async (): Promise<ContractTemplate[]> => {
      if (!sessionToken || !codAgent) return [];

      let query = `
        SELECT 
          t.*,
          cl.title as case_name
        FROM public.case_contract_templates t
        LEFT JOIN public.agent_case_legal acl ON t.agent_case_legal_id = acl.id
        LEFT JOIN public.case_legal cl ON acl.case_legal_id = cl.id
        WHERE acl.cod_agent = '${codAgent}'
      `;

      if (filters?.caseId) {
        query += ` AND t.agent_case_legal_id = ${filters.caseId}`;
      }
      if (filters?.status) {
        query += ` AND t.status = '${filters.status}'`;
      }
      if (filters?.isLegalRepresentative !== undefined) {
        query += ` AND t.is_legal_representative = ${filters.isLegalRepresentative}`;
      }

      query += ` ORDER BY t.created_at DESC`;

      const { data, error } = await supabase.functions.invoke('public-external-db-query', {
        body: { query },
        headers: {
          'x-session-token': sessionToken,
          'x-request-timestamp': new Date().toISOString(),
          'x-referer': window.location.href
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return (data?.data || []).map((row: any) => ({
        ...row,
        variables: row.variables || [],
        legal_representative_data: row.legal_representative_data || {},
        test_data: row.test_data || {},
        is_main_document: row.is_main_document ?? true,
        parent_template_id: row.parent_template_id ?? null,
      }));
    },
    enabled: !!sessionToken && !!codAgent
  });
}

export function useCreateContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      template, 
      sessionToken 
    }: { 
      template: Partial<ContractTemplate>; 
      sessionToken: string;
    }): Promise<ContractTemplate> => {
      // Note: zapsign_template_id, zapsign_doc_token, and cod_agent columns
      // don't exist in the external database schema
      const query = `
        INSERT INTO public.case_contract_templates (
          agent_case_legal_id,
          template_name,
          storage_path,
          file_name,
          file_size,
          variables,
          is_legal_representative,
          legal_representative_data,
          status
        ) VALUES (
          ${template.agent_case_legal_id || 'NULL'},
          '${(template.template_name || '').replace(/'/g, "''")}',
          '${(template.storage_path || '').replace(/'/g, "''")}',
          '${(template.file_name || '').replace(/'/g, "''")}',
          ${template.file_size || 0},
          '${JSON.stringify(template.variables || [])}'::jsonb,
          ${template.is_legal_representative ?? false},
          '${JSON.stringify(template.legal_representative_data || {})}'::jsonb,
          '${template.status || 'draft'}'
        )
        RETURNING *
      `;

      const { data, error } = await supabase.functions.invoke('public-external-db-query', {
        body: { query },
        headers: {
          'x-session-token': sessionToken,
          'x-request-timestamp': new Date().toISOString(),
          'x-referer': window.location.href
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data?.data?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
    }
  });
}

export function useUpdateContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates, 
      sessionToken 
    }: { 
      id: number; 
      updates: Partial<ContractTemplate>; 
      sessionToken: string;
    }) => {
      // Note: zapsign_template_id, zapsign_doc_token, test_data, error_message 
      // columns don't exist in the external database schema
      const setClauses: string[] = [];
      
      if (updates.status !== undefined) {
        setClauses.push(`status = '${updates.status}'`);
      }
      if (updates.variables !== undefined) {
        setClauses.push(`variables = '${JSON.stringify(updates.variables)}'::jsonb`);
      }
      if (updates.template_name !== undefined) {
        setClauses.push(`template_name = '${(updates.template_name || '').replace(/'/g, "''")}'`);
      }
      if (updates.is_legal_representative !== undefined) {
        setClauses.push(`is_legal_representative = ${updates.is_legal_representative}`);
      }
      if (updates.legal_representative_data !== undefined) {
        setClauses.push(`legal_representative_data = '${JSON.stringify(updates.legal_representative_data)}'::jsonb`);
      }

      setClauses.push(`updated_at = NOW()`);

      const query = `
        UPDATE public.case_contract_templates 
        SET ${setClauses.join(', ')}
        WHERE id = ${id}
        RETURNING *
      `;

      const { data, error } = await supabase.functions.invoke('public-external-db-query', {
        body: { query },
        headers: {
          'x-session-token': sessionToken,
          'x-request-timestamp': new Date().toISOString(),
          'x-referer': window.location.href
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data?.data?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
    }
  });
}

export function useDeleteContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      storagePath,
      zapsignTemplateId,
      sessionToken 
    }: { 
      id: number;
      storagePath: string;
      zapsignTemplateId?: string | null;
      sessionToken: string;
    }) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // 1. Delete from ZapSign first (if template exists)
      if (zapsignTemplateId) {
        try {
          console.log('[useDeleteContractTemplate] Deleting from ZapSign:', zapsignTemplateId);
          const zapsignResponse = await fetch(
            `${supabaseUrl}/functions/v1/zapsign-templates/delete-zapsign/${encodeURIComponent(zapsignTemplateId)}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (!zapsignResponse.ok) {
            const errorText = await zapsignResponse.text();
            console.error('[useDeleteContractTemplate] ZapSign delete error:', errorText);
            // Continue with deletion even if ZapSign fails
          } else {
            console.log('[useDeleteContractTemplate] Deleted from ZapSign successfully');
          }
        } catch (e) {
          console.error('[useDeleteContractTemplate] Error deleting from ZapSign:', e);
          // Continue with deletion even if ZapSign fails
        }
      }

      // 2. Delete from Supabase Storage
      if (storagePath) {
        try {
          console.log('[useDeleteContractTemplate] Deleting from storage:', storagePath);
          const storageResponse = await fetch(
            `${supabaseUrl}/functions/v1/zapsign-templates/template/${encodeURIComponent(storagePath)}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (!storageResponse.ok) {
            const errorText = await storageResponse.text();
            console.error('[useDeleteContractTemplate] Storage delete error:', errorText);
          } else {
            console.log('[useDeleteContractTemplate] Deleted from storage successfully');
          }
        } catch (e) {
          console.error('[useDeleteContractTemplate] Error deleting from storage:', e);
        }
      }

      // 3. Delete from external database
      const query = `DELETE FROM public.case_contract_templates WHERE id = ${id}`;

      const { data, error } = await supabase.functions.invoke('public-external-db-query', {
        body: { query },
        headers: {
          'x-session-token': sessionToken,
          'x-request-timestamp': new Date().toISOString(),
          'x-referer': window.location.href
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      console.log('[useDeleteContractTemplate] Deleted from database successfully');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
    }
  });
}
