import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PlanChangeType, BillingCycle } from '@/lib/utils/plan-utils';

export interface PlanHistoryRecord {
  id: string;
  client_id: string;
  client_name?: string;
  old_plan_id: string | null;
  old_plan_name?: string;
  new_plan_id: string | null;
  new_plan_name?: string;
  change_type: PlanChangeType;
  reason: string | null;
  notes: string | null;
  old_price: number | null;
  new_price: number | null;
  old_billing_cycle: BillingCycle | null;
  new_billing_cycle: BillingCycle | null;
  old_resources: any;
  new_resources: any;
  changed_by: string | null;
  changed_by_role: string | null;
  effective_date: string;
  created_at: string;
  is_automatic: boolean;
}

interface HistoryFilters {
  clientId?: string;
  changeType?: PlanChangeType;
  startDate?: string;
  endDate?: string;
}

export function usePlanHistory() {
  const [history, setHistory] = useState<PlanHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async (filters?: HistoryFilters) => {
    try {
      setLoading(true);

      let query = supabase
        .from('client_plan_history')
        .select(`
          *,
          client:clients(name),
          old_plan:subscription_plans!client_plan_history_old_plan_id_fkey(name),
          new_plan:subscription_plans!client_plan_history_new_plan_id_fkey(name)
        `)
        .order('effective_date', { ascending: false });

      // Aplicar filtros
      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      if (filters?.changeType) {
        query = query.eq('change_type', filters.changeType);
      }

      if (filters?.startDate) {
        query = query.gte('effective_date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('effective_date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Mapear dados com nomes dos planos
      const mappedHistory = (data || []).map((record: any) => ({
        ...record,
        client_name: record.client?.name,
        old_plan_name: record.old_plan?.name,
        new_plan_name: record.new_plan?.name
      }));

      setHistory(mappedHistory);
    } catch (error: any) {
      console.error('Error fetching history:', error);
      toast.error('Erro ao carregar histórico: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getClientHistory = async (clientId: string): Promise<PlanHistoryRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('client_plan_history')
        .select(`
          *,
          old_plan:subscription_plans!client_plan_history_old_plan_id_fkey(name),
          new_plan:subscription_plans!client_plan_history_new_plan_id_fkey(name)
        `)
        .eq('client_id', clientId)
        .order('effective_date', { ascending: false });

      if (error) throw error;

      return (data || []).map((record: any) => ({
        ...record,
        old_plan_name: record.old_plan?.name,
        new_plan_name: record.new_plan?.name
      }));
    } catch (error: any) {
      console.error('Error fetching client history:', error);
      toast.error('Erro ao carregar histórico do cliente: ' + error.message);
      return [];
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return {
    history,
    loading,
    fetchHistory,
    getClientHistory
  };
}
