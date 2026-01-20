import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface Ticket {
  id: string;
  helena_count_id: string;
  ticket_number: number;
  title: string;
  description: string | null;
  sector_id: string | null;
  priority: 'baixa' | 'normal' | 'alta' | 'critica';
  status: 'aberto' | 'em_atendimento' | 'aguardando' | 'resolvido' | 'cancelado';
  whatsapp_number: string | null;
  contact_name: string | null;
  cod_agent: string | null;
  chat_context: string | null;
  assigned_to_id: string | null;
  assigned_at: string | null;
  sla_deadline: string | null;
  sla_breached: boolean;
  tags: string[];
  created_by_id: string | null;
  created_by_name: string | null;
  resolved_at: string | null;
  resolved_by_id: string | null;
  resolved_by_name: string | null;
  created_at: string;
  updated_at: string;
  helena_contact_id?: string | null;
  sector?: {
    id: string;
    name: string;
    color: string;
    slug: string;
  } | null;
  assigned_to?: {
    id: string;
    user_name: string;
    user_email: string | null;
  } | null;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

export interface TicketHistory {
  id: string;
  ticket_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  user_id: string;
  user_name: string;
  created_at: string;
}

export interface TicketFilters {
  status?: string;
  statuses?: string[];
  priority?: string;
  sector_id?: string;
  assigned_to_id?: string;
  assigned_user_id?: string;
  whatsapp_number?: string;
  helena_contact_id?: string;
  cod_agent?: string;
  sla_breached?: boolean;
  overdue?: boolean;
  search?: string;
  date_from?: string;
  date_to?: string;
  tags?: string[];
  order_by?: 'created_at' | 'overdue_first';
}

export interface TicketStats {
  total: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  overdue: number;
  avg_resolution_time_hours: number;
}

export interface ContactTicketStats {
  total: number;
  pending: number;
  resolved: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  overdue: number;
}

export function usePublicTickets(countId: string | null, pageSize: number = 50) {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [history, setHistory] = useState<TicketHistory[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [contactStats, setContactStats] = useState<ContactTicketStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const currentFiltersRef = useRef<TicketFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0
  });

  const fetchTickets = useCallback(async (filters: TicketFilters = {}, page = 1) => {
    if (!countId) return;
    
    setIsLoading(true);
    currentFiltersRef.current = filters;
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/public-tickets-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helena_count_id: countId,
          action: 'list',
          filters,
          page,
          limit: pageSize
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);

      setTickets(data.tickets || []);
      setPagination(prev => ({
        ...prev,
        page: data.page,
        total: data.total,
        totalPages: data.totalPages
      }));
      setHasMore(data.page < data.totalPages);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os tickets.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [countId, pageSize, toast]);

  const loadMore = useCallback(async () => {
    if (!countId || !hasMore || isLoadingMore) return;
    
    setIsLoadingMore(true);
    const nextPage = pagination.page + 1;
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/public-tickets-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helena_count_id: countId,
          action: 'list',
          filters: currentFiltersRef.current,
          page: nextPage,
          limit: pageSize
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);

      // Append new tickets to existing ones
      setTickets(prev => [...prev, ...(data.tickets || [])]);
      setPagination(prev => ({
        ...prev,
        page: data.page,
        total: data.total,
        totalPages: data.totalPages
      }));
      setHasMore(data.page < data.totalPages);
    } catch (error) {
      console.error('Error loading more tickets:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar mais tickets.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [countId, hasMore, isLoadingMore, pagination.page, pageSize, toast]);

  const fetchTicketDetails = useCallback(async (ticketId: string) => {
    if (!countId) return null;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/public-tickets-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helena_count_id: countId,
          action: 'get',
          ticket_id: ticketId
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);

      setSelectedTicket(data.ticket);
      setComments(data.comments || []);
      setHistory(data.history || []);
      return data.ticket;
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes do ticket.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [countId, toast]);

  const fetchStats = useCallback(async () => {
    if (!countId) return;
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/public-tickets-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helena_count_id: countId,
          action: 'stats'
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);

      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [countId]);

  const fetchContactStats = useCallback(async (filters: TicketFilters) => {
    if (!countId) return;
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/public-tickets-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helena_count_id: countId,
          action: 'contact_stats',
          filters
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);

      setContactStats(data);
    } catch (error) {
      console.error('Error fetching contact stats:', error);
    }
  }, [countId]);

  const fetchBySector = useCallback(async () => {
    if (!countId) return [];
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/public-tickets-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helena_count_id: countId,
          action: 'by_sector'
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);

      return data.sectors || [];
    } catch (error) {
      console.error('Error fetching by sector:', error);
      return [];
    }
  }, [countId]);

  // Auto-fetch tickets on mount
  useEffect(() => {
    if (countId) {
      fetchTickets();
    }
  }, [countId]);

  return {
    tickets,
    selectedTicket,
    setSelectedTicket,
    comments,
    history,
    stats,
    contactStats,
    isLoading,
    isLoadingMore,
    hasMore,
    pagination,
    fetchTickets,
    fetchTicketDetails,
    fetchStats,
    fetchContactStats,
    fetchBySector,
    loadMore
  };
}
