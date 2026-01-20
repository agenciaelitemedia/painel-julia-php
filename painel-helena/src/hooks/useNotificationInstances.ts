import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppInstance {
  id: string;
  instance_name: string;
  phone_number: string;
  status: string;
  is_notifications: boolean;
  is_default_notification: boolean;
  client_id: string;
}

export const useNotificationInstances = () => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInstances = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_name, phone_number, status, is_notifications, is_default_notification, client_id')
        .eq('is_notifications', true)
        .order('is_default_notification', { ascending: false })
        .order('instance_name', { ascending: true });

      if (error) throw error;
      setInstances(data || []);
    } catch (error) {
      console.error('Error loading notification instances:', error);
      setInstances([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstances();
  }, []);

  return { instances, loading, refreshInstances: loadInstances };
};
