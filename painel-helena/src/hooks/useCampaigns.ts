import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientData } from "./useClientData";

export interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  start_date: string;
  end_date: string | null;
  budget: number | null;
  payload_data: any;
  created_at: string;
  updated_at: string;
  
  // Métricas agregadas
  total_leads?: number;
  qualified_leads?: number;
  opportunities?: number;
  customers?: number;
  conversion_rate?: number;
  total_revenue?: number;
}

export function useCampaigns() {
  const { clientData } = useClientData();

  return useQuery({
    queryKey: ["campaigns", clientData?.id],
    queryFn: async () => {
      if (!clientData?.id) return [];

      // Buscar campanhas
      const { data: campaigns, error } = await supabase
        .from("campaign_sources")
        .select("*")
        .eq("client_id", clientData.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Para cada campanha, buscar métricas agregadas
      const campaignsWithMetrics = await Promise.all(
        (campaigns || []).map(async (campaign: any) => {
          // Buscar tracking de contatos
          const { data: tracking } = await supabase
            .from("contact_campaign_tracking")
            .select("*")
            .eq("campaign_source_id", campaign.id);

          // Buscar métricas agregadas
          const { data: metrics } = await supabase
            .from("campaign_metrics")
            .select("*")
            .eq("campaign_source_id", campaign.id)
            .order("date", { ascending: false })
            .limit(1)
            .maybeSingle();

          const totalLeads = (tracking as any[])?.length || 0;
          const qualifiedLeads = (tracking as any[])?.filter((t: any) => 
            ['qualified_lead', 'opportunity', 'customer'].includes(t.conversion_stage)
          ).length || 0;
          const opportunities = (tracking as any[])?.filter((t: any) => 
            ['opportunity', 'customer'].includes(t.conversion_stage)
          ).length || 0;
          const customers = (tracking as any[])?.filter((t: any) => 
            t.conversion_stage === 'customer'
          ).length || 0;

          return {
            ...campaign,
            total_leads: totalLeads,
            qualified_leads: qualifiedLeads,
            opportunities: opportunities,
            customers: customers,
            conversion_rate: totalLeads > 0 ? (customers / totalLeads) * 100 : 0,
            total_revenue: (metrics as any)?.total_revenue || 0,
          };
        })
      );

      return campaignsWithMetrics;
    },
    enabled: !!clientData?.id,
  });
}

export function useCampaignDetails(campaignId: string | null) {
  const { clientData } = useClientData();

  return useQuery({
    queryKey: ["campaign-details", campaignId],
    queryFn: async () => {
      if (!campaignId || !clientData?.id) return null;

      // Buscar campanha
      const { data: campaign, error } = await supabase
        .from("campaign_sources")
        .select("*")
        .eq("id", campaignId)
        .eq("client_id", clientData.id)
        .single();

      if (error) throw error;

      // Buscar leads desta campanha
      const { data: leads } = await supabase
        .from("contact_campaign_tracking")
        .select(`
          *,
          contacts (
            id,
            name,
            phone,
            avatar
          )
        `)
        .eq("campaign_source_id", campaignId)
        .order("created_at", { ascending: false });

      // Buscar métricas ao longo do tempo
      const { data: metrics } = await supabase
        .from("campaign_metrics")
        .select("*")
        .eq("campaign_source_id", campaignId)
        .order("date", { ascending: true });

      return {
        campaign,
        leads: leads || [],
        metrics: metrics || [],
      };
    },
    enabled: !!campaignId && !!clientData?.id,
  });
}
