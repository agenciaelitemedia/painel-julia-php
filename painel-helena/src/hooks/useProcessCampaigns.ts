import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProcessCampaign {
  id: string;
  client_id: string;
  name: string;
  whatsapp_instance_id: string;
  status: 'pending' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed';
  scheduled_start_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  total_records: number;
  sent_count: number;
  failed_count: number;
  batch_size: number;
  interval_between_messages_ms: number;
  interval_between_batches_ms: number;
  message_template: string;
  created_at: string;
  updated_at: string;
  whatsapp_instances?: {
    instance_name: string;
    status: string;
  };
}

export interface ProcessRecord {
  id: string;
  campaign_id: string;
  process_number: string;
  phone_number: string;
  process_status: string;
  message_text: string;
  send_status: 'pending' | 'sending' | 'sent' | 'failed';
  sent_at: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
}

export const useProcessCampaigns = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["process-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("process_campaigns")
        .select(`
          *,
          whatsapp_instances (
            instance_name,
            status
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProcessCampaign[];
    },
  });

  const createCampaign = useMutation({
    mutationFn: async (campaignData: {
      name: string;
      whatsapp_instance_id: string;
      scheduled_start_at: string | null;
      batch_size: number;
      interval_between_messages_ms: number;
      interval_between_batches_ms: number;
      message_template: string;
      records: Array<{
        process_number: string;
        phone_number: string;
        process_status: string;
      }>;
    }) => {
      const { data: clientData } = await supabase.auth.getUser();
      if (!clientData.user) throw new Error("User not authenticated");

      const { data: userData } = await supabase
        .from("users")
        .select("client_id")
        .eq("id", clientData.user.id)
        .single();

      if (!userData?.client_id) throw new Error("Client ID not found");

      const { data: campaign, error: campaignError } = await supabase
        .from("process_campaigns")
        .insert({
          client_id: userData.client_id,
          name: campaignData.name,
          whatsapp_instance_id: campaignData.whatsapp_instance_id,
          scheduled_start_at: campaignData.scheduled_start_at,
          batch_size: campaignData.batch_size,
          interval_between_messages_ms: campaignData.interval_between_messages_ms,
          interval_between_batches_ms: campaignData.interval_between_batches_ms,
          message_template: campaignData.message_template,
          total_records: campaignData.records.length,
          status: campaignData.scheduled_start_at ? 'scheduled' : 'pending',
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      const records = campaignData.records.map((record) => ({
        campaign_id: campaign.id,
        process_number: record.process_number,
        phone_number: record.phone_number,
        process_status: record.process_status,
        message_text: campaignData.message_template
          .replace(/{numero_processo}/g, record.process_number)
          .replace(/{andamento}/g, record.process_status),
      }));

      const { error: recordsError } = await supabase
        .from("process_records")
        .insert(records);

      if (recordsError) throw recordsError;

      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["process-campaigns"] });
      toast({
        title: "Campanha criada",
        description: "A campanha foi criada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar campanha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCampaignStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProcessCampaign['status'] }) => {
      const updates: any = { status };
      
      if (status === 'running' && !campaigns?.find(c => c.id === id)?.started_at) {
        updates.started_at = new Date().toISOString();
      }
      
      if (status === 'completed' || status === 'failed') {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("process_campaigns")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["process-campaigns"] });
      toast({
        title: "Status atualizado",
        description: "O status da campanha foi atualizado!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("process_campaigns")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["process-campaigns"] });
      toast({
        title: "Campanha excluída",
        description: "A campanha foi excluída com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir campanha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getCampaignRecords = async (campaignId: string) => {
    const { data, error } = await supabase
      .from("process_records")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as ProcessRecord[];
  };

  return {
    campaigns,
    isLoading,
    createCampaign: createCampaign.mutateAsync,
    updateCampaignStatus: updateCampaignStatus.mutateAsync,
    deleteCampaign: deleteCampaign.mutateAsync,
    getCampaignRecords,
  };
};
