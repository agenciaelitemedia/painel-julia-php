import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface TicketTeamMember {
  id: string;
  helena_count_id: string;
  helena_agent_id?: string;
  helena_user_id?: string;
  sector_id: string | null;
  user_id: string;
  user_name: string;
  user_email: string | null;
  phone_number?: string;
  role: 'atendente' | 'lider' | 'admin';
  is_available: boolean;
  is_active: boolean;
  is_supervisor?: boolean;
  created_at: string;
  updated_at: string;
  sector?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

export interface CreateTeamMemberData {
  sector_id?: string;
  user_id: string;
  user_name: string;
  user_email?: string;
  role?: 'atendente' | 'lider' | 'admin';
  is_available?: boolean;
}

export function usePublicTicketTeam(countId: string | null) {
  const { toast } = useToast();
  const [members, setMembers] = useState<TicketTeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMembers = useCallback(async (sectorId?: string) => {
    if (!countId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/public-tickets-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helena_count_id: countId,
          action: 'list',
          sector_id: sectorId
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);

      setMembers(data.members || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setIsLoading(false);
    }
  }, [countId]);

  const fetchAvailableMembers = useCallback(async (sectorId?: string): Promise<TicketTeamMember[]> => {
    if (!countId) return [];
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/public-tickets-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helena_count_id: countId,
          action: 'available',
          sector_id: sectorId
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);

      return data.members || [];
    } catch (error) {
      console.error('Error fetching available members:', error);
      return [];
    }
  }, [countId]);

  const createMember = useCallback(async (data: CreateTeamMemberData): Promise<TicketTeamMember | null> => {
    if (!countId) return null;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/public-tickets-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helena_count_id: countId,
          action: 'create',
          data
        })
      });

      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error);

      toast({
        title: 'Membro adicionado',
        description: `${data.user_name} foi adicionado à equipe.`
      });

      await fetchMembers();
      return result.member;
    } catch (error) {
      console.error('Error creating member:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o membro.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [countId, fetchMembers, toast]);

  const updateMember = useCallback(async (memberId: string, data: Partial<CreateTeamMemberData & { is_active?: boolean }>): Promise<boolean> => {
    if (!countId) return false;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/public-tickets-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helena_count_id: countId,
          action: 'update',
          member_id: memberId,
          data
        })
      });

      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error);

      toast({
        title: 'Membro atualizado',
        description: 'As alterações foram salvas.'
      });

      await fetchMembers();
      return true;
    } catch (error) {
      console.error('Error updating member:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o membro.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [countId, fetchMembers, toast]);

  const deleteMember = useCallback(async (memberId: string): Promise<boolean> => {
    if (!countId) return false;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/public-tickets-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helena_count_id: countId,
          action: 'delete',
          member_id: memberId
        })
      });

      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error);

      toast({
        title: 'Membro removido',
        description: 'O membro foi removido da equipe.'
      });

      await fetchMembers();
      return true;
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o membro.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [countId, fetchMembers, toast]);

  useEffect(() => {
    if (countId) {
      fetchMembers();
    }
  }, [countId, fetchMembers]);

  return {
    members,
    activeMembers: members.filter(m => m.is_active),
    availableMembers: members.filter(m => m.is_active && m.is_available),
    isLoading,
    fetchMembers,
    fetchAvailableMembers,
    createMember,
    updateMember,
    deleteMember
  };
}
