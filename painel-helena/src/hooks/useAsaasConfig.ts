import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AsaasConfig {
  id: string;
  api_token: string;
  wallet_id: string | null;
  environment: string;
  whatsapp_notifications_enabled: boolean;
  whatsapp_instance_id: string | null;
  webhook_url: string | null;
  split_config: any;
  notification_templates: any;
  created_at: string;
  updated_at: string;
}

export function useAsaasConfig() {
  const [config, setConfig] = useState<AsaasConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("asaas_config")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setConfig(data);
    } catch (error) {
      console.error("Error loading Asaas config:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (configData: Partial<AsaasConfig>) => {
    try {
      // Converter strings vazias para null em campos UUID
      const cleanedData = {
        ...configData,
        whatsapp_instance_id: configData.whatsapp_instance_id?.trim() || null,
        wallet_id: configData.wallet_id?.trim() || null,
      };

      if (config?.id) {
        const { error } = await supabase
          .from("asaas_config")
          .update(cleanedData)
          .eq("id", config.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("asaas_config")
          .insert([{
            api_token: cleanedData.api_token || '',
            environment: cleanedData.environment || 'sandbox',
            ...cleanedData
          }])
          .select()
          .single();

        if (error) throw error;
      }

      await loadConfig();
    } catch (error) {
      console.error("Error saving Asaas config:", error);
      throw error;
    }
  };

  const testConnection = async (apiToken: string, environment: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('asaas-test-connection', {
        body: { apiToken, environment }
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    config,
    loading,
    saveConfig,
    testConnection,
  };
}
