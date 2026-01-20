import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function useHelenaSyncData(helenaCountId: string | null) {
  const { toast } = useToast();
  const [isSyncingDepartments, setIsSyncingDepartments] = useState(false);
  const [isSyncingAgents, setIsSyncingAgents] = useState(false);

  const syncDepartments = useCallback(async (): Promise<boolean> => {
    if (!helenaCountId) return false;

    setIsSyncingDepartments(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/helena-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helena_count_id: helenaCountId,
          action: 'sync_departments'
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast({
        title: 'Equipes sincronizadas',
        description: `${data.synced_count} equipe(s) sincronizada(s) do Atende Julia.`
      });

      return true;
    } catch (error) {
      console.error('Error syncing departments:', error);
      toast({
        title: 'Erro na sincronização',
        description: 'Não foi possível sincronizar as equipes do Atende Julia.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsSyncingDepartments(false);
    }
  }, [helenaCountId, toast]);

  const syncAgents = useCallback(async (): Promise<boolean> => {
    if (!helenaCountId) return false;

    setIsSyncingAgents(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/helena-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helena_count_id: helenaCountId,
          action: 'sync_agents'
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast({
        title: 'Agentes sincronizados',
        description: `${data.synced_count} agente(s) sincronizado(s) do Atende Julia.`
      });

      return true;
    } catch (error) {
      console.error('Error syncing agents:', error);
      toast({
        title: 'Erro na sincronização',
        description: 'Não foi possível sincronizar os agentes do Atende Julia.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsSyncingAgents(false);
    }
  }, [helenaCountId, toast]);

  return {
    isSyncingDepartments,
    isSyncingAgents,
    syncDepartments,
    syncAgents,
  };
}
