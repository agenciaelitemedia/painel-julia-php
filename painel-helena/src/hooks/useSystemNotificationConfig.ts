import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SystemNotificationLog {
  id: string;
  client_id: string | null;
  notification_type: string;
  recipient_phone: string;
  message_content: string;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  whatsapp_instance_id: string | null;
  metadata: Record<string, any>;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppInstance {
  id: string;
  client_id: string;
  instance_id: string;
  instance_name: string;
  is_notifications: boolean;
  is_default_notification: boolean;
  status: string;
  phone_number: string | null;
  client?: {
    name: string;
    email: string;
  };
}

export function useSystemNotificationConfig() {
  const queryClient = useQueryClient();

  const { data: defaultInstance, isLoading: isLoadingInstance } = useQuery({
    queryKey: ['default-notification-instance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select(`
          id,
          client_id,
          instance_id,
          instance_name,
          is_notifications,
          is_default_notification,
          status,
          phone_number,
          clients (
            name,
            email
          )
        `)
        .eq('is_default_notification', true)
        .maybeSingle();

      if (error) throw error;
      return data as (WhatsAppInstance & { clients: { name: string; email: string } | null }) | null;
    },
  });

  const { data: notificationInstances, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['notification-instances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select(`
          id,
          client_id,
          instance_id,
          instance_name,
          is_notifications,
          is_default_notification,
          status,
          phone_number,
          clients (
            id,
            name,
            email
          )
        `)
        .eq('is_notifications', true)
        .order('is_default_notification', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      return data?.map(instance => ({
        id: instance.id,
        client_id: instance.client_id,
        instance_id: instance.instance_id,
        instance_name: instance.instance_name,
        is_notifications: instance.is_notifications,
        is_default_notification: instance.is_default_notification,
        status: instance.status,
        phone_number: instance.phone_number,
        client: instance.clients,
      })) as WhatsAppInstance[];
    },
  });

  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['system-notification-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as SystemNotificationLog[];
    },
  });

  const setDefaultInstance = useMutation({
    mutationFn: async (instanceId: string) => {
      // Primeiro, remove a marcação de todas as instâncias
      const { error: clearError } = await supabase
        .from('whatsapp_instances')
        .update({ is_default_notification: false })
        .eq('is_default_notification', true);

      if (clearError) throw clearError;

      // Depois, marca a nova instância como padrão e de notificação
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .update({ 
          is_default_notification: true,
          is_notifications: true 
        })
        .eq('id', instanceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['default-notification-instance'] });
      queryClient.invalidateQueries({ queryKey: ['notification-instances'] });
      toast.success('Conexão padrão de notificação configurada com sucesso');
    },
    onError: (error: Error) => {
      console.error('Error setting default instance:', error);
      toast.error('Erro ao configurar conexão padrão');
    },
  });

  const toggleNotificationInstance = useMutation({
    mutationFn: async ({ instanceId, enable }: { instanceId: string; enable: boolean }) => {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .update({ is_notifications: enable })
        .eq('id', instanceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notification-instances'] });
      toast.success(
        variables.enable 
          ? 'Conexão habilitada para notificações' 
          : 'Conexão desabilitada para notificações'
      );
    },
    onError: (error: Error) => {
      console.error('Error toggling notification instance:', error);
      if (error.message.includes('Cannot disable notifications on default connection')) {
        toast.error('Não é possível desabilitar a conexão padrão. Defina outra conexão como padrão primeiro.');
      } else {
        toast.error('Erro ao alterar configuração de notificação');
      }
    },
  });

  return {
    defaultInstance,
    notificationInstances,
    logs,
    isLoading: isLoadingInstance || isLoadingNotifications || isLoadingLogs,
    setDefaultInstance,
    toggleNotificationInstance,
  };
}
