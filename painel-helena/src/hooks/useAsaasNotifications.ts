import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AsaasNotification {
  id: string;
  client_id: string;
  notification_type: string;
  phone_number: string;
  message_text: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  error_message: string | null;
  invoice_id: string | null;
  subscription_id: string | null;
  whatsapp_message_id: string | null;
}

export function useAsaasNotifications() {
  const [notifications, setNotifications] = useState<AsaasNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("asaas_whatsapp_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    notifications,
    loading,
    refresh: loadNotifications,
  };
}
