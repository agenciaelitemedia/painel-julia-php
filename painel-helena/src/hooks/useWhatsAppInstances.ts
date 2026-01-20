import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { whatsappClient } from '@/lib/whatsapp';
import { toast } from '@/hooks/use-toast';

interface WhatsAppInstance {
  id: string;
  instance_id: string;
  instance_name: string;
  phone_number: string | null;
  profile_name: string | null;
  profile_picture_url: string | null;
  status: string;
  qr_code: string | null;
  webhook_url: string | null;
  created_at: string;
  api_url?: string | null;
  api_token?: string | null;
}

export function useWhatsAppInstances() {
  const { profile } = useAuth();
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.client_id) {
      loadInstances();
      
      // Subscribe to real-time changes
      const channel = supabase
        .channel('whatsapp_instances_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'whatsapp_instances',
            filter: `client_id=eq.${profile.client_id}`
          },
          () => {
            loadInstances();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.client_id]);

  const loadInstances = async () => {
    if (!profile?.client_id) return;

    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('client_id', profile.client_id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstances((data || []) as WhatsAppInstance[]);
      
      // Check status of all instances
      if (data && data.length > 0) {
        data.forEach(async (instance) => {
          try {
            const provider = (instance.provider || 'uazap') as any;
            const response = await whatsappClient.getInstanceStatus(instance.api_token || instance.instance_id, provider);
            const isConnected = response?.data?.connected || response?.data?.instance?.status === 'connected' || response?.data?.status === 'connected';
            
            // Update status in database if different
            if ((isConnected && instance.status !== 'connected') || (!isConnected && instance.status === 'connected')) {
              await supabase
                .from('whatsapp_instances')
                .update({ 
                  status: isConnected ? 'connected' : 'disconnected'
                })
                .eq('id', instance.id);
                
              // If connected, update profile info
              if (isConnected && !instance.profile_name) {
                await updateProfileInfo(instance.id, instance.api_token || instance.instance_id);
              }
            }
          } catch (error) {
            // If error checking status, mark as disconnected
            if (instance.status !== 'disconnected') {
              await supabase
                .from('whatsapp_instances')
                .update({ status: 'disconnected' })
                .eq('id', instance.id);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error loading instances:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar conexões",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createInstance = async (
    instanceName: string,
    receiveGroupMessages: boolean = true
  ) => {
    if (!profile?.client_id) return null;

    try {
      // Create instance using whatsappClient (uazap provider by default)
      const apiResponse: any = await whatsappClient.createInstance(instanceName, 'uazap', { receiveGroupMessages });
      
      if (!apiResponse?.data?.token && !apiResponse?.token) {
        throw new Error('Token da instância não foi retornado pela API');
      }

      const instanceToken = apiResponse?.data?.token || apiResponse?.token;

      const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`;

      // Configure webhook with all necessary events
      try {
        await whatsappClient.configureWebhook(instanceToken, 'uazap', webhookUrl, [
          'connection',
          'messages',
          'messages_update',
          'chats'
        ]);
        console.log('Webhook configured successfully for instance:', instanceName);
      } catch (webhookError) {
        console.error('Error configuring webhook:', webhookError);
        // Continue even if webhook configuration fails
      }

      // Store in database
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .insert({
          client_id: profile.client_id,
          instance_id: instanceName, // Nome da instância (usado na URL)
          instance_name: instanceName,
          api_token: instanceToken, // Token de autenticação (usado no header)
          status: 'disconnected',
          webhook_url: webhookUrl,
          api_url: import.meta.env.VITE_UAZAP_API_URL || 'https://atende-julia.uazapi.com',
          provider: 'uazap',
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      await loadInstances();
      
      toast({
        title: "Sucesso",
        description: "Conexão criada com sucesso",
      });

      return data;
    } catch (error) {
      console.error('Error creating instance:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar conexão';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteInstance = async (instanceId: string, instanceToken: string) => {
    if (!profile?.client_id) return;

    try {
      // 1. Verificar se há contatos vinculados
      const { count } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('instance_id', instanceId);

      const hasContacts = count && count > 0;

      // 2. Obter provider da instância
      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('provider')
        .eq('id', instanceId)
        .single();

      const provider = (instance?.provider || 'uazap') as any;

      // 3. Se tem contatos: SOFT DELETE no banco + deletar da API
      if (hasContacts) {
        // Soft delete no banco
        const { error: updateError } = await supabase
          .from('whatsapp_instances')
          .update({ 
            deleted_at: new Date().toISOString(),
            status: 'deleted'
          })
          .eq('id', instanceId);

        if (updateError) throw updateError;

        // Deletar da API
        try {
          await whatsappClient.deleteInstance(instanceToken, provider);
        } catch (apiError) {
          console.warn('Erro ao deletar da API, mas soft delete foi realizado:', apiError);
        }

        toast({
          title: "Conexão arquivada",
          description: `Conexão arquivada com ${count} contato(s) vinculado(s). Você pode importá-los em outra conexão.`,
        });
      } 
      // 4. Se não tem contatos: HARD DELETE no banco + deletar da API
      else {
        // Deletar da API primeiro
        try {
          await whatsappClient.deleteInstance(instanceToken, provider);
        } catch (apiError) {
          console.warn('Erro ao deletar da API, continuando com exclusão do banco:', apiError);
        }

        // Hard delete do banco
        const { error: deleteError } = await supabase
          .from('whatsapp_instances')
          .delete()
          .eq('id', instanceId);

        if (deleteError) throw deleteError;

        toast({
          title: "Conexão excluída",
          description: "Conexão excluída permanentemente.",
        });
      }

      await loadInstances();
    } catch (error) {
      console.error('Error deleting instance:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir conexão",
        variant: "destructive",
      });
    }
  };

  const getInstancesForImport = async (currentInstanceId?: string) => {
    if (!profile?.client_id) return [];

    try {
      let query = supabase
        .from('whatsapp_instances')
        .select('id, instance_name, phone_number, deleted_at, created_at, status')
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false });

      // Se fornecido, excluir a instância atual da lista
      if (currentInstanceId) {
        query = query.neq('id', currentInstanceId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading instances for import:', error);
      return [];
    }
  };

  const importContacts = async (fromInstanceId: string, toInstanceId: string) => {
    try {
      // 1. Atualizar todos os contatos da instância de origem
      const { data: updatedContacts, error: updateError } = await supabase
        .from('contacts')
        .update({ instance_id: toInstanceId })
        .eq('instance_id', fromInstanceId)
        .select();

      if (updateError) throw updateError;

      const contactCount = updatedContacts?.length || 0;

      // 2. Verificar se a instância de origem estava deletada logicamente
      const { data: sourceInstance } = await supabase
        .from('whatsapp_instances')
        .select('deleted_at')
        .eq('id', fromInstanceId)
        .maybeSingle();

      // 3. Se estava deletada logicamente e agora não tem mais contatos, fazer hard delete
      if (sourceInstance?.deleted_at) {
        const { count } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('instance_id', fromInstanceId);

        // Se não há mais contatos, deletar fisicamente
        if (!count || count === 0) {
          await supabase
            .from('whatsapp_instances')
            .delete()
            .eq('id', fromInstanceId);
        }
      }

      await loadInstances();

      toast({
        title: "Importação concluída",
        description: `${contactCount} contato(s) importado(s) com sucesso!`,
      });

      return true;
    } catch (error) {
      console.error('Error importing contacts:', error);
      toast({
        title: "Erro",
        description: "Erro ao importar contatos",
        variant: "destructive",
      });
      return false;
    }
  };

  const getQRCode = async (instanceId: string, instanceToken: string) => {
    try {
      console.log('=== GETTING QR CODE ===');
      console.log('Instance ID:', instanceId);
      console.log('Instance Token:', instanceToken);
      
      // Get instance to know provider
      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('provider')
        .eq('id', instanceId)
        .single();
      
      const provider = (instance?.provider || 'uazap') as any;
      
      const response: any = await whatsappClient.getQRCode(instanceToken, provider);
      
      console.log('QR Code API response:', response);
      
      // Check if already connected
      const instanceStatus = response?.instance?.status || response?.data?.instance?.status || response?.status;
      const isActuallyConnected = instanceStatus === 'connected' || response?.response === 'Already connected';
      
      if (isActuallyConnected) {
        console.log('Instance already connected, updating profile...');
        
        const profileData = response.instance || response;
        await supabase
          .from('whatsapp_instances')
          .update({ 
            phone_number: profileData.owner || null,
            profile_name: profileData.profileName || null,
            profile_picture_url: profileData.profilePicUrl || null,
            status: 'connected',
            qr_code: null
          })
          .eq('id', instanceId);
        
        await loadInstances();
        
        toast({
          title: "Já Conectado",
          description: "WhatsApp já está conectado",
        });
        
        return null;
      }
      
      // Extract QR code from response
      const qrcode = response?.qrcode || 
                   response?.qr_code ||
                   response?.base64 ||
                   response?.data?.qrcode || 
                   response?.data?.qr_code ||
                   response?.data?.base64 ||
                   response?.instance?.qrcode ||
                   response?.instance?.qr_code ||
                   response?.instance?.base64;
      
      if (qrcode) {
        await supabase
          .from('whatsapp_instances')
          .update({ 
            qr_code: qrcode,
            status: 'connecting' 
          })
          .eq('id', instanceId);

        return qrcode;
      }
      
      console.error('QR Code not found in response');
      toast({
        title: "Erro",
        description: "QR Code não encontrado na resposta da API",
        variant: "destructive",
      });
      return null;
    } catch (error) {
      console.error('Error getting QR code:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao gerar QR Code",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateProfileInfo = async (instanceId: string, instanceToken: string) => {
    try {
      console.log('Updating profile info for instance:', instanceId);
      
      // Get instance to know provider
      const { data: instanceData } = await supabase
        .from('whatsapp_instances')
        .select('provider')
        .eq('id', instanceId)
        .single();
      
      const provider = (instanceData?.provider || 'uazap') as any;
      
      const profileResponse = await whatsappClient.getProfileInfo(instanceToken, provider);
      const profile = profileResponse.data;
      
      if (profile) {
        const { data, error } = await supabase
          .from('whatsapp_instances')
          .update({
            phone_number: profile.phone || null,
            profile_name: profile.name || null,
            profile_picture_url: profile.picture || null,
            status: 'connected',
            qr_code: null,
          })
          .eq('id', instanceId)
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Conectado",
          description: "WhatsApp conectado com sucesso",
        });
        
        await loadInstances();
      }
    } catch (error) {
      console.error('Error updating profile info:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar informações do perfil",
        variant: "destructive",
      });
    }
  };

  return {
    instances,
    loading,
    createInstance,
    deleteInstance,
    getQRCode,
    updateProfileInfo,
    refreshInstances: loadInstances,
    getInstancesForImport,
    importContacts,
  };
}