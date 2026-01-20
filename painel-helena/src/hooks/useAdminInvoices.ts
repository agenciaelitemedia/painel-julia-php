import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Invoice {
  id: string;
  client_id: string;
  invoice_number: string;
  value: number;
  due_date: string;
  status: string;
  billing_type: string;
  description: string | null;
  created_at: string;
  payment_date: string | null;
  asaas_payment_id: string | null;
  invoice_url: string | null;
  pix_code: string | null;
  pix_qrcode: string | null;
}

interface Subscription {
  id: string;
  client_id: string;
  plan_name: string;
  value: number;
  cycle: string;
  status: string;
  billing_type: string;
  next_due_date: string | null;
  description: string | null;
  created_at: string;
  asaas_subscription_id: string | null;
}

export function useAdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invoicesResponse, subscriptionsResponse] = await Promise.all([
        supabase
          .from("asaas_invoices")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("asaas_subscriptions")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (invoicesResponse.error) throw invoicesResponse.error;
      if (subscriptionsResponse.error) throw subscriptionsResponse.error;

      setInvoices(invoicesResponse.data || []);
      setSubscriptions(subscriptionsResponse.data || []);
    } catch (error) {
      console.error("Error loading billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    invoices,
    subscriptions,
    loading,
    refresh: loadData,
  };
}
