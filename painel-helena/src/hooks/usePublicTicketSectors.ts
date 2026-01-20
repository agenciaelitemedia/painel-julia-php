import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface TicketSector {
  id: string;
  helena_count_id: string;
  helena_department_id?: string;
  name: string;
  slug: string;
  color: string;
  sla_hours: number;
  default_priority: 'baixa' | 'normal' | 'alta' | 'critica';
  is_active: boolean;
  is_default?: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  // Stats when loaded with by_sector
  ticket_count?: number;
  by_status?: {
    aberto: number;
    em_atendimento: number;
    aguardando: number;
  };
  overdue_count?: number;
}

export interface CreateSectorData {
  name: string;
  color?: string;
  sla_hours?: number;
  default_priority?: 'baixa' | 'normal' | 'alta' | 'critica';
}

export function usePublicTicketSectors(countId: string | null) {
  const { toast } = useToast();
  const [sectors, setSectors] = useState<TicketSector[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSectors = useCallback(async () => {
    if (!countId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/public-tickets-sectors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helena_count_id: countId,
          action: 'list'
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);

      setSectors(data.sectors || []);
    } catch (error) {
      console.error('Error fetching sectors:', error);
    } finally {
      setIsLoading(false);
    }
  }, [countId]);

  const createSector = useCallback(async (data: CreateSectorData): Promise<TicketSector | null> => {
    if (!countId) return null;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/public-tickets-sectors`, {
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
        title: 'Setor criado',
        description: `O setor "${data.name}" foi criado com sucesso.`
      });

      await fetchSectors();
      return result.sector;
    } catch (error) {
      console.error('Error creating sector:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o setor.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [countId, fetchSectors, toast]);

  const updateSector = useCallback(async (sectorId: string, data: Partial<CreateSectorData & { is_active?: boolean }>): Promise<boolean> => {
    if (!countId) return false;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/public-tickets-sectors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helena_count_id: countId,
          action: 'update',
          sector_id: sectorId,
          data
        })
      });

      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error);

      toast({
        title: 'Setor atualizado',
        description: 'As alterações foram salvas.'
      });

      await fetchSectors();
      return true;
    } catch (error) {
      console.error('Error updating sector:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o setor.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [countId, fetchSectors, toast]);

  const deleteSector = useCallback(async (sectorId: string): Promise<boolean> => {
    if (!countId) return false;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/public-tickets-sectors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helena_count_id: countId,
          action: 'delete',
          sector_id: sectorId
        })
      });

      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error);

      toast({
        title: 'Setor excluído',
        description: 'O setor foi removido com sucesso.'
      });

      await fetchSectors();
      return true;
    } catch (error) {
      console.error('Error deleting sector:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o setor.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [countId, fetchSectors, toast]);

  useEffect(() => {
    if (countId) {
      fetchSectors();
    }
  }, [countId, fetchSectors]);

  return {
    sectors,
    activeSectors: sectors.filter(s => s.is_active),
    isLoading,
    fetchSectors,
    createSector,
    updateSector,
    deleteSector
  };
}
