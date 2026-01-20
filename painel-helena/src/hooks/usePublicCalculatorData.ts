import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExtraModule {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_name: string;
  has_quantity: boolean;
  quantity_label: string | null;
  price_per_unit: number | null;
  base_quantity: number;
  max_quantity: number;
  display_order: number;
}

export interface ImplementationType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  included_items: string[] | null;
  badge_text: string | null;
  badge_color: string;
  display_order: number;
}

export interface CalculatorSettings {
  openai_cost_per_1k_tokens: { input: number; output: number };
  meta_api_cost_per_message: { utility: number; marketing: number; service: number };
  dollar_rate: number;
  annual_discount_percent: number;
  avg_tokens_per_conversation: number;
  avg_messages_per_conversation: number;
  whatsapp_number: string;
  proposal_validity_days: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_cycle: string;
  enabled_modules: string[] | null;
  max_connections: number;
  max_agents: number;
  max_julia_agents: number;
  max_team_members: number;
  max_monthly_contacts: number;
  is_active: boolean;
}

export const usePublicPlans = () => {
  return useQuery({
    queryKey: ['public-subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useExtraModules = () => {
  return useQuery({
    queryKey: ['extra-modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('extra_modules')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as ExtraModule[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useImplementationTypes = () => {
  return useQuery({
    queryKey: ['implementation-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('implementation_types')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as ImplementationType[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCalculatorSettings = () => {
  return useQuery({
    queryKey: ['calculator-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calculator_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      const settings: Record<string, any> = {};
      data?.forEach((item: { setting_key: string; setting_value: any }) => {
        const value = item.setting_value;
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          settings[item.setting_key] = isNaN(parsed) ? value : parsed;
        } else {
          settings[item.setting_key] = value;
        }
      });

      return settings as CalculatorSettings;
    },
    staleTime: 5 * 60 * 1000,
  });
};
