import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Ticket } from './usePublicTickets';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface CreateTicketData {
  title: string;
  description?: string;
  sector_id?: string;
  priority?: 'baixa' | 'normal' | 'alta' | 'critica';
  whatsapp_number?: string;
  contact_name?: string;
  cod_agent?: string;
  chat_context?: string;
  assigned_to_id?: string;
  tags?: string[];
  helena_contact_id?: string;
  session_id?: string;
}

export interface UpdateTicketData {
  status?: 'aberto' | 'em_atendimento' | 'aguardando' | 'resolvido' | 'cancelado';
  priority?: 'baixa' | 'normal' | 'alta' | 'critica';
  sector_id?: string;
  assigned_to_id?: string | null;
  title?: string;
  description?: string;
  tags?: string[];
}

export function usePublicTicketMutations(
  countId: string | null,
  userId: string | null,
  userName: string = 'Usuário'
) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const createTicket = useCallback(async (data: CreateTicketData): Promise<Ticket | null> => {
    if (!countId) return null;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/public-tickets-mutation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helena_count_id: countId,
          action: 'create',
          data,
          user_id: userId,
          user_name: userName
        })
      });

      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error);

      toast({
        title: 'Ticket criado',
        description: `Ticket #${result.ticket.ticket_number} criado com sucesso.`
      });

      return result.ticket;
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o ticket.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [countId, userId, userName, toast]);

  const updateTicket = useCallback(async (ticketId: string, data: UpdateTicketData): Promise<Ticket | null> => {
    if (!countId) return null;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/public-tickets-mutation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helena_count_id: countId,
          action: 'update',
          ticket_id: ticketId,
          data,
          user_id: userId,
          user_name: userName
        })
      });

      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error);

      toast({
        title: 'Ticket atualizado',
        description: 'As alterações foram salvas.'
      });

      return result.ticket;
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o ticket.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [countId, userId, userName, toast]);

  const addComment = useCallback(async (ticketId: string, content: string, isInternal = true): Promise<boolean> => {
    if (!countId) return false;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/public-tickets-mutation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helena_count_id: countId,
          action: 'add_comment',
          ticket_id: ticketId,
          data: { content, is_internal: isInternal },
          user_id: userId,
          user_name: userName
        })
      });

      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error);

      toast({
        title: 'Comentário adicionado',
        description: 'Seu comentário foi registrado.'
      });

      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o comentário.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [countId, userId, userName, toast]);

  const deleteTicket = useCallback(async (ticketId: string): Promise<boolean> => {
    if (!countId) return false;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/public-tickets-mutation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helena_count_id: countId,
          action: 'delete',
          ticket_id: ticketId,
          user_id: userId,
          user_name: userName
        })
      });

      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error);

      toast({
        title: 'Ticket excluído',
        description: 'O ticket foi removido com sucesso.'
      });

      return true;
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o ticket.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [countId, userId, userName, toast]);

  return {
    isLoading,
    createTicket,
    updateTicket,
    addComment,
    deleteTicket
  };
}
