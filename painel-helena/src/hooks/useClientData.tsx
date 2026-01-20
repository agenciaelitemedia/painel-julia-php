import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ClientData {
  id: string;
  name: string;
  email: string;
  whatsapp_phone?: string;
  max_connections: number;
  max_agents: number;
  max_julia_agents: number;
  max_monthly_contacts: number;
  client_code: string;
  is_active: boolean;
  julia_agent_codes?: string[];
  release_customization?: boolean;
}

export function useClientData() {
  const { profile } = useAuth();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.client_id) {
      fetchClientData();
    } else {
      setLoading(false);
    }
  }, [profile?.client_id]);

  const fetchClientData = async () => {
    if (!profile?.client_id) {
      console.log('No client_id in profile:', profile);
      return;
    }

    console.log('Fetching client data for client_id:', profile.client_id);

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', profile.client_id)
        .maybeSingle();

      console.log('Client data response:', { data, error });

      if (error) throw error;
      
      if (data) {
        setClientData(data);
      } else {
        console.warn('No client data found for client_id:', profile.client_id);
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  return { clientData, loading };
}