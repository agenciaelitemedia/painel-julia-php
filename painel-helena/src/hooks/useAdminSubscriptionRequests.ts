import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SubscriptionRequest {
  id: string;
  plan_id: string;
  full_name: string;
  cpf_cnpj: string;
  email: string;
  whatsapp_phone: string;
  status: string;
  is_verified: boolean;
  payment_provider: string;
  asaas_customer_id?: string;
  asaas_payment_id?: string;
  payment_data?: any;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  subscription_plans?: {
    name: string;
    price: number;
    billing_cycle: string;
  };
}

export function useAdminSubscriptionRequests() {
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchRequests = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('subscription_requests')
        .select('*, subscription_plans(*)')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setRequests(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (request_id: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke(
        'approve-subscription-request',
        {
          body: { request_id, is_automatic: false }
        }
      );

      if (error) throw error;

      if (data?.success) {
        toast.success('Pedido aprovado e conta criada com sucesso!');
        await fetchRequests();
        return true;
      }

      throw new Error(data?.error || 'Erro ao aprovar pedido');
    } catch (error: any) {
      console.error('Erro ao aprovar pedido:', error);
      toast.error(error.message || 'Erro ao aprovar pedido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const rejectRequest = async (request_id: string, rejection_reason: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke(
        'reject-subscription-request',
        {
          body: { request_id, rejection_reason }
        }
      );

      if (error) throw error;

      if (data?.success) {
        toast.success('Pedido rejeitado');
        await fetchRequests();
        return true;
      }

      throw new Error(data?.error || 'Erro ao rejeitar pedido');
    } catch (error: any) {
      console.error('Erro ao rejeitar pedido:', error);
      toast.error(error.message || 'Erro ao rejeitar pedido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('subscription-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscription_requests'
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  return {
    requests,
    loading,
    filter,
    setFilter,
    fetchRequests,
    approveRequest,
    rejectRequest
  };
}