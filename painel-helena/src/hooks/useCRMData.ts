import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Pipeline {
  id: string;
  name: string;
  color: string;
  position: number;
  board_id?: string | null;
  client_id?: string | null;
}

export interface Deal {
  id: string;
  pipeline_id: string;
  contact_id: string | null;
  title: string;
  description: string | null;
  value: number | null;
  position: number;
  priority: string;
  status: string;
  contact?: {
    id: string;
    name: string;
    phone: string;
    avatar: string | null;
  };
}

export function useCRMData() {
  const { profile } = useAuth();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPipelines = async () => {
    if (!profile?.client_id) return;

    try {
      const { data, error } = await supabase
        .from('crm_pipelines')
        .select('*')
        .eq('client_id', profile.client_id)
        .order('position');

      if (error) throw error;
      setPipelines(data || []);
    } catch (error) {
      console.error('Erro ao carregar pipelines:', error);
      toast.error('Erro ao carregar etapas do CRM');
    }
  };

  const loadDeals = async () => {
    if (!profile?.client_id) return;

    try {
      const { data, error } = await supabase
        .from('crm_deals')
        .select(`
          *,
          contact:contacts(id, name, phone, avatar)
        `)
        .eq('client_id', profile.client_id)
        .order('position');

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error('Erro ao carregar deals:', error);
      toast.error('Erro ao carregar negócios');
    } finally {
      setLoading(false);
    }
  };

  const createPipeline = async (name: string, color: string, boardId?: string) => {
    if (!profile?.client_id) return;

    try {
      const maxPosition = pipelines.length > 0 
        ? Math.max(...pipelines.map(p => p.position)) 
        : -1;

      const { error } = await supabase
        .from('crm_pipelines')
        .insert({
          client_id: profile.client_id,
          name,
          color,
          position: maxPosition + 1,
          board_id: boardId || null,
        });

      if (error) throw error;
      await loadPipelines();
      toast.success('Etapa criada com sucesso');
    } catch (error) {
      console.error('Erro ao criar pipeline:', error);
      toast.error('Erro ao criar etapa');
    }
  };

  const updatePipeline = async (id: string, updates: Partial<Pipeline>) => {
    try {
      const { error } = await supabase
        .from('crm_pipelines')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await loadPipelines();
      toast.success('Etapa atualizada');
    } catch (error) {
      console.error('Erro ao atualizar pipeline:', error);
      toast.error('Erro ao atualizar etapa');
    }
  };

  const deletePipeline = async (id: string) => {
    try {
      const { error } = await supabase
        .from('crm_pipelines')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadPipelines();
      await loadDeals();
      toast.success('Etapa excluída');
    } catch (error) {
      console.error('Erro ao excluir pipeline:', error);
      toast.error('Erro ao excluir etapa');
    }
  };

  const createDeal = async (
    pipelineId: string,
    title: string,
    description: string,
    value: number | null,
    contactId: string | null,
    priority: string
  ) => {
    if (!profile?.client_id) return;

    try {
      const pipelineDeals = deals.filter(d => d.pipeline_id === pipelineId);
      const maxPosition = pipelineDeals.length > 0
        ? Math.max(...pipelineDeals.map(d => d.position))
        : -1;

      const { error } = await supabase
        .from('crm_deals')
        .insert({
          client_id: profile.client_id,
          pipeline_id: pipelineId,
          contact_id: contactId,
          title,
          description,
          value,
          priority,
          position: maxPosition + 1,
        });

      if (error) throw error;
      await loadDeals();
      toast.success('Card criado com sucesso');
    } catch (error) {
      console.error('Erro ao criar deal:', error);
      toast.error('Erro ao criar card');
    }
  };

  const updateDeal = async (id: string, updates: Partial<Deal>) => {
    try {
      const { error } = await supabase
        .from('crm_deals')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await loadDeals();
    } catch (error) {
      console.error('Erro ao atualizar deal:', error);
      toast.error('Erro ao atualizar card');
    }
  };

  const moveDeal = async (dealId: string, newPipelineId: string, newPosition: number) => {
    try {
      // Get all deals in the target pipeline
      const targetPipelineDeals = deals
        .filter(d => d.pipeline_id === newPipelineId && d.id !== dealId)
        .sort((a, b) => a.position - b.position);

      // Insert the moved deal at the new position
      const updatedDeals = [
        ...targetPipelineDeals.slice(0, newPosition),
        { ...deals.find(d => d.id === dealId)!, pipeline_id: newPipelineId, position: newPosition },
        ...targetPipelineDeals.slice(newPosition),
      ];

      // Update positions for all affected deals
      const updates = updatedDeals.map((deal, index) => ({
        id: deal.id,
        pipeline_id: newPipelineId,
        position: index,
      }));

      // Execute all updates
      for (const update of updates) {
        await supabase
          .from('crm_deals')
          .update({
            pipeline_id: update.pipeline_id,
            position: update.position,
          })
          .eq('id', update.id);
      }

      await loadDeals();
    } catch (error) {
      console.error('Erro ao mover deal:', error);
      toast.error('Erro ao mover card');
    }
  };

  const deleteDeal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('crm_deals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadDeals();
      toast.success('Card excluído');
    } catch (error) {
      console.error('Erro ao excluir deal:', error);
      toast.error('Erro ao excluir card');
    }
  };

  useEffect(() => {
    if (profile?.client_id) {
      loadPipelines();
      loadDeals();
    }
  }, [profile?.client_id]);

  useEffect(() => {
    if (!profile?.client_id) return;

    const pipelinesChannel = supabase
      .channel('crm-pipelines-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_pipelines',
          filter: `client_id=eq.${profile.client_id}`,
        },
        () => loadPipelines()
      )
      .subscribe();

    const dealsChannel = supabase
      .channel('crm-deals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_deals',
          filter: `client_id=eq.${profile.client_id}`,
        },
        () => loadDeals()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pipelinesChannel);
      supabase.removeChannel(dealsChannel);
    };
  }, [profile?.client_id]);

  return {
    pipelines,
    deals,
    loading,
    createPipeline,
    updatePipeline,
    deletePipeline,
    createDeal,
    updateDeal,
    moveDeal,
    deleteDeal,
  };
}
