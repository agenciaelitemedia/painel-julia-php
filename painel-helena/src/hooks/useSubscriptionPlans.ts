import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BillingCycle } from '@/lib/utils/plan-utils';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_cycle: BillingCycle;
  custom_cycle_days: number | null;
  max_connections: number;
  max_agents: number;
  max_julia_agents: number;
  max_team_members: number;
  max_monthly_contacts: number;
  release_customization: boolean;
  enabled_modules: string[];
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  setup_fee: number | null;
  trial_days: number | null;
  more_info: string | null;
  created_at: string;
  updated_at: string;
  clients_count?: number;
}

export interface CreatePlanData {
  name: string;
  description?: string;
  price: number;
  billing_cycle: BillingCycle;
  custom_cycle_days?: number;
  max_connections: number;
  max_agents: number;
  max_julia_agents: number;
  max_team_members: number;
  max_monthly_contacts: number;
  release_customization: boolean;
  enabled_modules: string[];
  is_active?: boolean;
  is_featured?: boolean;
  display_order?: number;
  setup_fee?: number;
  trial_days?: number;
  more_info?: string;
}

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async (onlyActive = false) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('subscription_plans')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (onlyActive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Buscar contagem de clientes para cada plano
      const plansWithCounts = await Promise.all(
        (data || []).map(async (plan) => {
          const { count } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('plan_id', plan.id);

          return {
            ...plan,
            clients_count: count || 0
          };
        })
      );

      setPlans(plansWithCounts);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      toast.error('Erro ao carregar planos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (planData: CreatePlanData): Promise<SubscriptionPlan | null> => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert([planData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Plano criado com sucesso!');
      await fetchPlans();
      return data;
    } catch (error: any) {
      console.error('Error creating plan:', error);
      toast.error('Erro ao criar plano: ' + error.message);
      return null;
    }
  };

  const updatePlan = async (
    planId: string,
    planData: Partial<CreatePlanData>,
    applyToClients = false
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update(planData)
        .eq('id', planId);

      if (error) throw error;

      // Se deve aplicar mudanças aos clientes existentes
      if (applyToClients) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id')
          .eq('plan_id', planId);

        if (clients && clients.length > 0) {
          const clientUpdates = {
            max_connections: planData.max_connections,
            max_agents: planData.max_agents,
            max_julia_agents: planData.max_julia_agents,
            max_team_members: planData.max_team_members,
            release_customization: planData.release_customization
          };

          await Promise.all(
            clients.map(client =>
              supabase
                .from('clients')
                .update(clientUpdates)
                .eq('id', client.id)
            )
          );

          toast.success(`Plano atualizado e aplicado a ${clients.length} cliente(s)!`);
        } else {
          toast.success('Plano atualizado!');
        }
      } else {
        toast.success('Plano atualizado!');
      }

      await fetchPlans();
      return true;
    } catch (error: any) {
      console.error('Error updating plan:', error);
      toast.error('Erro ao atualizar plano: ' + error.message);
      return false;
    }
  };

  const deletePlan = async (planId: string): Promise<boolean> => {
    try {
      // Verificar se há clientes usando o plano
      const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('plan_id', planId);

      if (count && count > 0) {
        toast.error(`Não é possível excluir. ${count} cliente(s) estão usando este plano.`);
        return false;
      }

      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast.success('Plano excluído com sucesso!');
      await fetchPlans();
      return true;
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      toast.error('Erro ao excluir plano: ' + error.message);
      return false;
    }
  };

  const countClientsUsingPlan = async (planId: string): Promise<number> => {
    try {
      const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('plan_id', planId);

      return count || 0;
    } catch (error) {
      console.error('Error counting clients:', error);
      return 0;
    }
  };

  const reorderPlans = async (planIds: string[]): Promise<boolean> => {
    try {
      await Promise.all(
        planIds.map((planId, index) =>
          supabase
            .from('subscription_plans')
            .update({ display_order: index })
            .eq('id', planId)
        )
      );

      await fetchPlans();
      return true;
    } catch (error: any) {
      console.error('Error reordering plans:', error);
      toast.error('Erro ao reordenar planos: ' + error.message);
      return false;
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return {
    plans,
    loading,
    fetchPlans,
    createPlan,
    updatePlan,
    deletePlan,
    countClientsUsingPlan,
    reorderPlans,
  };
}
