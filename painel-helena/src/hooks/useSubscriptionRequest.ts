import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateRequestData {
  plan_id: string;
  full_name: string;
  cpf_cnpj: string;
  email: string;
  whatsapp_phone: string;
}

interface PaymentData {
  payment_url?: string;
  invoice_url?: string;
  pix_code?: string;
  pix_qrcode?: string;
  boleto_url?: string;
  due_date?: string;
  value?: number;
}

export function useSubscriptionRequest() {
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  const createRequest = async (data: CreateRequestData) => {
    try {
      setLoading(true);

      const { data: response, error } = await supabase.functions.invoke(
        'create-subscription-request',
        {
          body: data
        }
      );

      if (error) throw error;

      if (response?.success) {
        setRequestId(response.request_id);
        setTrackingToken(response.tracking_token);
        
        if (response.existing) {
          toast.info('Já existe um pedido em andamento. Use o código enviado anteriormente.');
        } else {
          toast.success('Código de verificação enviado via WhatsApp!');
        }
        
        return {
          success: true,
          request_id: response.request_id,
          tracking_token: response.tracking_token,
          tracking_url: response.tracking_url,
          existing: response.existing || false
        };
      }

      throw new Error(response?.error || 'Erro ao criar pedido');
    } catch (error: any) {
      console.error('Erro ao criar pedido:', error);
      toast.error(error.message || 'Erro ao criar pedido. Tente novamente.');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (request_id: string, verification_code: string) => {
    try {
      setLoading(true);

      const { data: response, error } = await supabase.functions.invoke(
        'verify-subscription-code',
        {
          body: { request_id, verification_code }
        }
      );

      if (error) throw error;

      if (response?.success) {
        setPaymentData(response.payment_data);
        toast.success('Código verificado! Prossiga com o pagamento.');
        return {
          success: true,
          payment_data: response.payment_data
        };
      }

      throw new Error(response?.error || 'Código inválido');
    } catch (error: any) {
      console.error('Erro ao verificar código:', error);
      toast.error(error.message || 'Código inválido');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async (request_id: string) => {
    try {
      setLoading(true);

      // Buscar dados do pedido
      const { data: request } = await supabase
        .from('subscription_requests')
        .select('*')
        .eq('id', request_id)
        .single();

      if (!request) {
        throw new Error('Pedido não encontrado');
      }

      // Gerar novo código
      const { data: newCode } = await supabase.rpc('generate_verification_code');

      // Atualizar pedido
      const { error: updateError } = await supabase
        .from('subscription_requests')
        .update({
          verification_code: newCode,
          verification_sent_at: new Date().toISOString(),
          verification_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        })
        .eq('id', request_id);

      if (updateError) throw updateError;

      // Enviar novo código
      const { data: trackingData } = await supabase
        .from('subscription_request_tracking')
        .select('tracking_token')
        .eq('request_id', request_id)
        .single();

      await supabase.functions.invoke('send-verification-code', {
        body: {
          request_id,
          verification_code: newCode,
          tracking_token: trackingData?.tracking_token || ''
        }
      });

      toast.success('Novo código enviado via WhatsApp!');
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao reenviar código:', error);
      toast.error(error.message || 'Erro ao reenviar código');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (request_id: string) => {
    try {
      const { data: request } = await supabase
        .from('subscription_requests')
        .select('status')
        .eq('id', request_id)
        .single();

      return request?.status || null;
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return null;
    }
  };

  return {
    loading,
    requestId,
    trackingToken,
    paymentData,
    createRequest,
    verifyCode,
    resendCode,
    checkPaymentStatus
  };
}