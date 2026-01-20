import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClientData } from './useClientData';
import { toast } from 'sonner';

export interface Board {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  position: number;
  client_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useCRMBoards() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const { clientData } = useClientData();
  const clientId = clientData?.id;

  const loadBoards = async () => {
    if (!clientId) return;
    
    try {
      const { data, error } = await supabase
        .from('crm_boards')
        .select('*')
        .eq('client_id', clientId)
        .order('position', { ascending: true });

      if (error) throw error;
      setBoards(data || []);
    } catch (error) {
      console.error('Error loading boards:', error);
      toast.error('Erro ao carregar painéis');
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async (name: string, description: string | null, icon: string, color: string) => {
    if (!clientId) return;

    try {
      const maxPosition = boards.length > 0 
        ? Math.max(...boards.map(b => b.position))
        : -1;

      const { data, error } = await supabase
        .from('crm_boards')
        .insert({
          client_id: clientId,
          name,
          description,
          icon,
          color,
          position: maxPosition + 1,
        })
        .select()
        .single();

      if (error) throw error;
      
      setBoards([...boards, data]);
      toast.success('Painel criado com sucesso');
      return data;
    } catch (error) {
      console.error('Error creating board:', error);
      toast.error('Erro ao criar painel');
    }
  };

  const updateBoard = async (id: string, updates: Partial<Board>) => {
    try {
      const { error } = await supabase
        .from('crm_boards')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setBoards(boards.map(b => b.id === id ? { ...b, ...updates } : b));
      toast.success('Painel atualizado');
    } catch (error) {
      console.error('Error updating board:', error);
      toast.error('Erro ao atualizar painel');
    }
  };

  const deleteBoard = async (id: string) => {
    try {
      const { error } = await supabase
        .from('crm_boards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBoards(boards.filter(b => b.id !== id));
      toast.success('Painel excluído');
    } catch (error) {
      console.error('Error deleting board:', error);
      toast.error('Erro ao excluir painel');
    }
  };

  useEffect(() => {
    loadBoards();
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel('crm_boards_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_boards',
          filter: `client_id=eq.${clientId}`,
        },
        () => {
          loadBoards();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  return {
    boards,
    loading,
    createBoard,
    updateBoard,
    deleteBoard,
  };
}
