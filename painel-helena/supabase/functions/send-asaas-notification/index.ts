import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type: 'invoice_created' | 'payment_received' | 'payment_overdue' | 'subscription_created' | 'subscription_expiring';
  invoiceId?: string;
  subscriptionId?: string;
  clientId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, invoiceId, subscriptionId, clientId } = await req.json() as NotificationRequest;

    console.log('📨 Processing notification:', { type, invoiceId, subscriptionId, clientId });

    // 1. Buscar configuração do Asaas
    const { data: asaasConfig, error: configError } = await supabase
      .from('asaas_config')
      .select('*')
      .single();

    if (configError || !asaasConfig) {
      console.error('❌ Asaas config not found');
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração Asaas não encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (!asaasConfig.whatsapp_notifications_enabled) {
      console.log('⚠️ WhatsApp notifications disabled');
      return new Response(
        JSON.stringify({ success: false, error: 'Notificações WhatsApp desabilitadas' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 2. Buscar cliente e integração
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      console.error('❌ Client not found');
      return new Response(
        JSON.stringify({ success: false, error: 'Cliente não encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const { data: integration } = await supabase
      .from('client_asaas_integration')
      .select('*')
      .eq('client_id', clientId)
      .single();

    // Verificar se notificações estão habilitadas para o cliente
    if (integration && !integration.whatsapp_notifications_enabled) {
      console.log('⚠️ Client notifications disabled');
      return new Response(
        JSON.stringify({ success: false, error: 'Notificações desabilitadas para este cliente' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 3. Buscar telefone de notificação
    // Prioridade: 1. whatsapp_phone do cliente, 2. notification_phone da integração, 3. primeiro contato
    let phoneNumber = client.whatsapp_phone || integration?.notification_phone;
    
    if (!phoneNumber) {
      // Buscar primeiro contato do cliente
      const { data: contact } = await supabase
        .from('contacts')
        .select('phone')
        .eq('client_id', clientId)
        .limit(1)
        .single();
      
      phoneNumber = contact?.phone;
    }

    if (!phoneNumber) {
      console.error('❌ No phone number found for client');
      return new Response(
        JSON.stringify({ success: false, error: 'Telefone não encontrado para o cliente' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 4. Buscar dados da fatura/assinatura
    let templateData: any = {
      nome: client.name,
    };

    if (invoiceId) {
      const { data: invoice } = await supabase
        .from('asaas_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoice) {
        templateData = {
          ...templateData,
          valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(invoice.value)),
          data_vencimento: new Date(invoice.due_date).toLocaleDateString('pt-BR'),
          link_pagamento: invoice.invoice_url || '',
          numero_fatura: invoice.invoice_number || '',
        };
      }
    }

    if (subscriptionId) {
      const { data: subscription } = await supabase
        .from('asaas_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (subscription) {
        templateData = {
          ...templateData,
          plano: subscription.plan_name,
          valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(subscription.value)),
          proxima_data: subscription.next_due_date ? new Date(subscription.next_due_date).toLocaleDateString('pt-BR') : '',
          dias: subscription.next_due_date ? Math.ceil((new Date(subscription.next_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0,
        };
      }
    }

    // 5. Buscar template e substituir variáveis
    const templates = asaasConfig.notification_templates || {};
    let messageTemplate = templates[type];

    if (!messageTemplate) {
      console.error('❌ Template not found for type:', type);
      return new Response(
        JSON.stringify({ success: false, error: `Template não encontrado para o tipo: ${type}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Substituir variáveis no template
    let messageText = messageTemplate;
    for (const [key, value] of Object.entries(templateData)) {
      messageText = messageText.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }

    console.log('📝 Message prepared:', messageText);

    // 6. Buscar instância WhatsApp admin com is_notifications=true
    let whatsappInstance: any = null;

    // 1. Tentar usar a instância configurada no Asaas (se existir)
    if (asaasConfig.whatsapp_instance_id) {
      const { data: configuredInstance, error: configError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('id', asaasConfig.whatsapp_instance_id)
        .eq('is_notifications', true)
        .eq('status', 'connected')
        .maybeSingle();

      if (configError) {
        console.error('Erro ao buscar conexão configurada:', configError);
      }

      if (configuredInstance) {
        whatsappInstance = configuredInstance;
        console.log('✅ Usando conexão configurada no Asaas:', configuredInstance.instance_name);
      } else {
        console.log('⚠️ Conexão configurada não disponível, buscando alternativas...');
      }
    }

    // 2. Fallback: Tentar buscar a conexão padrão
    if (!whatsappInstance) {
      const { data: defaultInstance, error: defaultError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('is_default_notification', true)
        .eq('is_notifications', true)
        .eq('status', 'connected')
        .maybeSingle();

      if (defaultError) {
        console.error('Erro ao buscar conexão padrão:', defaultError);
      }

      if (defaultInstance) {
        whatsappInstance = defaultInstance;
        console.log('✅ Usando conexão padrão de notificação:', defaultInstance.instance_name);
      }
    }

    // 3. Último fallback: buscar qualquer conexão habilitada para notificações
    if (!whatsappInstance) {
      console.log('⚠️ Tentando qualquer conexão disponível...');
      
      const { data: alternativeInstances, error: altError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('is_notifications', true)
        .eq('status', 'connected')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (altError) {
        console.error('Erro ao buscar conexões alternativas:', altError);
      }

      if (alternativeInstances && alternativeInstances.length > 0) {
        whatsappInstance = alternativeInstances[0];
        console.log('✅ Usando conexão alternativa:', whatsappInstance.instance_name);
      }
    }

    if (!whatsappInstance) {
      console.error('❌ Nenhuma conexão de notificação disponível');
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhuma conexão WhatsApp habilitada para notificações' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 7. Criar registro de notificação (pendente)
    const { data: notification, error: notificationError } = await supabase
      .from('asaas_whatsapp_notifications')
      .insert({
        client_id: clientId,
        notification_type: type,
        phone_number: phoneNumber,
        message_text: messageText,
        status: 'pending',
        invoice_id: invoiceId || null,
        subscription_id: subscriptionId || null,
      })
      .select()
      .single();

    if (notificationError) {
      console.error('❌ Error creating notification record:', notificationError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao criar registro de notificação' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 8. Enviar mensagem via WhatsApp
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const whatsappUrl = `${whatsappInstance.api_url}/message/text`;
      
      const whatsappResponse = await fetch(whatsappUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': whatsappInstance.api_token,
        },
        body: JSON.stringify({
          phone: cleanPhone,
          message: messageText,
        }),
      });

      const whatsappData = await whatsappResponse.json();
      console.log('📱 WhatsApp response:', whatsappData);

      if (whatsappResponse.ok && whatsappData.id) {
        // Atualizar notificação como enviada
        await supabase
          .from('asaas_whatsapp_notifications')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            whatsapp_message_id: whatsappData.id,
          })
          .eq('id', notification.id);

        console.log('✅ Notification sent successfully');

        return new Response(
          JSON.stringify({ 
            success: true, 
            notificationId: notification.id,
            whatsappMessageId: whatsappData.id,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } else {
        throw new Error(whatsappData.message || 'Erro ao enviar mensagem');
      }
    } catch (whatsappError: any) {
      console.error('❌ WhatsApp send error:', whatsappError);
      
      // Atualizar notificação como falha
      await supabase
        .from('asaas_whatsapp_notifications')
        .update({
          status: 'failed',
          error_message: whatsappError.message,
        })
        .eq('id', notification.id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao enviar mensagem WhatsApp',
          details: whatsappError.message,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

  } catch (error: any) {
    console.error('❌ Error in send-asaas-notification:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
