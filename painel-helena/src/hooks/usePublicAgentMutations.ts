import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateAgentCaseParams {
  cod_agent: string;
  case_category_id: string;
  case_legal_id: string;
  activation_phrase: string;
  campaing_link?: string;
  case_fees?: string;
  sessionToken: string;
}

interface UpdateAgentCaseParams {
  id: string;
  status?: boolean;
  activation_phrase?: string;
  campaing_link?: string;
  case_fees?: string;
  sessionToken: string;
}

interface UpdateAgentBioParams {
  cod_agent: string;
  bio: string;
  sessionToken: string;
}

interface UpdateAgentStatusParams {
  cod_agent: string;
  status: boolean;
  sessionToken: string;
}

interface UpdateAgentMessagesParams {
  cod_agent: string;
  agent_welcome: string;
  agent_fees: string;
  sessionToken: string;
}

interface UpdateDocumentNoteParams {
  id: number;
  note_case: string;
  sessionToken: string;
}

export const usePublicAgentMutations = () => {
  const queryClient = useQueryClient();

  const createAgentCase = useMutation({
    mutationFn: async (params: CreateAgentCaseParams) => {
      const query = `
        INSERT INTO public.agent_case_legal 
          (cod_agent, case_category_id, case_legal_id, activation_phrase, campaing_link, case_fees, status)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING id
      `;

      const { data, error } = await supabase.functions.invoke("public-external-db-query", {
        body: {
          query,
          params: [
            params.cod_agent,
            params.case_category_id,
            params.case_legal_id,
            params.activation_phrase,
            params.campaing_link || null,
            params.case_fees || null,
          ],
        },
        headers: {
          "x-session-token": params.sessionToken,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao vincular caso");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-agent-cases"] });
      toast.success("Caso vinculado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao vincular caso: ${error.message}`);
    },
  });

  const updateAgentCase = useMutation({
    mutationFn: async (params: UpdateAgentCaseParams) => {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (params.status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(params.status);
      }
      if (params.activation_phrase !== undefined) {
        updates.push(`activation_phrase = $${paramIndex++}`);
        values.push(params.activation_phrase);
      }
      if (params.campaing_link !== undefined) {
        updates.push(`campaing_link = $${paramIndex++}`);
        values.push(params.campaing_link);
      }
      if (params.case_fees !== undefined) {
        updates.push(`case_fees = $${paramIndex++}`);
        values.push(params.case_fees);
      }

      updates.push(`update_at = NOW()`);
      values.push(params.id);

      const query = `
        UPDATE public.agent_case_legal
        SET ${updates.join(", ")}
        WHERE id = $${paramIndex}
      `;

      const { data, error } = await supabase.functions.invoke("public-external-db-query", {
        body: { query, params: values },
        headers: { "x-session-token": params.sessionToken },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao atualizar caso");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-agent-cases"] });
      toast.success("Caso atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar caso: ${error.message}`);
    },
  });

  const deleteAgentCase = useMutation({
    mutationFn: async (params: { id: string; sessionToken: string }) => {
      const query = `DELETE FROM public.agent_case_legal WHERE id = $1`;

      const { data, error } = await supabase.functions.invoke("public-external-db-query", {
        body: { query, params: [params.id] },
        headers: { "x-session-token": params.sessionToken },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao excluir caso");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-agent-cases"] });
      toast.success("Caso removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover caso: ${error.message}`);
    },
  });

  const updateAgentBio = useMutation({
    mutationFn: async (params: UpdateAgentBioParams) => {
      const query = `
        UPDATE public.agents
        SET agent_bio = $1, updated_at = NOW()
        WHERE cod_agent = $2
      `;

      const { data, error } = await supabase.functions.invoke("public-external-db-query", {
        body: { query, params: [params.bio, params.cod_agent] },
        headers: { "x-session-token": params.sessionToken },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao atualizar bio");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-agent-details"] });
      toast.success("Bio atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar bio: ${error.message}`);
    },
  });

  const updateAgentStatus = useMutation({
    mutationFn: async (params: UpdateAgentStatusParams) => {
      const query = `
        UPDATE public.agents
        SET status = $1, updated_at = NOW()
        WHERE cod_agent = $2
      `;

      const { data, error } = await supabase.functions.invoke("public-external-db-query", {
        body: { query, params: [params.status, params.cod_agent] },
        headers: { "x-session-token": params.sessionToken },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao atualizar status");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-agent-details"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });

  const updateAgentMessages = useMutation({
    mutationFn: async (params: UpdateAgentMessagesParams) => {
      const query = `
        UPDATE public.agents
        SET agent_welcome = $1, agent_fees = $2, updated_at = NOW()
        WHERE cod_agent = $3
      `;

      const { data, error } = await supabase.functions.invoke("public-external-db-query", {
        body: { query, params: [params.agent_welcome, params.agent_fees, params.cod_agent] },
        headers: { "x-session-token": params.sessionToken },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao atualizar mensagens");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-agent-details"] });
      toast.success("Mensagens atualizadas com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar mensagens: ${error.message}`);
    },
  });

  const updateDocumentNote = useMutation({
    mutationFn: async (params: UpdateDocumentNoteParams) => {
      const query = `
        UPDATE public.sessions
        SET note_case = $1, updated_at = NOW()
        WHERE id = $2
      `;

      const { data, error } = await supabase.functions.invoke("public-external-db-query", {
        body: { query, params: [params.note_case, params.id] },
        headers: { "x-session-token": params.sessionToken },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao atualizar nota");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-documents-data"] });
      toast.success("Nota atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar nota: ${error.message}`);
    },
  });

  return {
    createAgentCase,
    updateAgentCase,
    deleteAgentCase,
    updateAgentBio,
    updateAgentStatus,
    updateAgentMessages,
    updateDocumentNote,
  };
};
