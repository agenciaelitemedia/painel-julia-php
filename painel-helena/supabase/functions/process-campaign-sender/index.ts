import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('Process Campaign Sender: Iniciando execução...');

interface Campaign {
  id: string;
  client_id: string;
  whatsapp_instance_id: string;
  batch_size: number;
  interval_between_messages_ms: number;
  interval_between_batches_ms: number;
  total_records: number;
  sent_count: number;
  failed_count: number;
}

interface ProcessRecord {
  id: string;
  campaign_id: string;
  phone_number: string;
  message_text: string;
  retry_count: number;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendWhatsAppMessage(instanceId: string, phone: string, message: string) {
  try {
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('api_token, api_url, provider')
      .eq('id', instanceId)
      .single();

    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;

    const response = await fetch(`${instance.api_url}/message/sendText/${instance.api_token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: message,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao enviar mensagem: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, error: errorMessage };
  }
}

async function processCampaign(campaign: Campaign) {
  console.log(`📋 Processando campanha: ${campaign.id}`);

  const { data: records, error: recordsError } = await supabase
    .from('process_records')
    .select('*')
    .eq('campaign_id', campaign.id)
    .eq('send_status', 'pending')
    .order('created_at', { ascending: true })
    .limit(campaign.batch_size);

  if (recordsError) {
    console.error('Erro ao buscar registros:', recordsError);
    return;
  }

  if (!records || records.length === 0) {
    console.log('✅ Campanha concluída - sem registros pendentes');
    await supabase
      .from('process_campaigns')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', campaign.id);
    return;
  }

  console.log(`📤 Enviando ${records.length} mensagens...`);

  let sentCount = 0;
  let failedCount = 0;

  for (const record of records) {
    await supabase
      .from('process_records')
      .update({ send_status: 'sending' })
      .eq('id', record.id);

    const result = await sendWhatsAppMessage(
      campaign.whatsapp_instance_id,
      record.phone_number,
      record.message_text
    );

    if (result.success) {
      await supabase
        .from('process_records')
        .update({
          send_status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', record.id);
      sentCount++;
      console.log(`✅ Enviado para ${record.phone_number}`);
    } else {
      const newRetryCount = (record.retry_count || 0) + 1;
      const shouldRetry = newRetryCount < 3;

      await supabase
        .from('process_records')
        .update({
          send_status: shouldRetry ? 'pending' : 'failed',
          error_message: result.error,
          retry_count: newRetryCount,
        })
        .eq('id', record.id);
      
      if (!shouldRetry) {
        failedCount++;
        console.error(`❌ Falha definitiva para ${record.phone_number}: ${result.error}`);
      } else {
        console.warn(`⚠️ Falha temporária para ${record.phone_number} (tentativa ${newRetryCount}/3)`);
      }
    }

    if (records.indexOf(record) < records.length - 1) {
      await sleep(campaign.interval_between_messages_ms);
    }
  }

  await supabase
    .from('process_campaigns')
    .update({
      sent_count: campaign.sent_count + sentCount,
      failed_count: campaign.failed_count + failedCount,
    })
    .eq('id', campaign.id);

  console.log(`✅ Batch concluído: ${sentCount} enviados, ${failedCount} falhas`);

  await sleep(campaign.interval_between_batches_ms);
}

async function main() {
  const now = new Date().toISOString();

  const { data: scheduledCampaigns } = await supabase
    .from('process_campaigns')
    .update({ status: 'running', started_at: now })
    .eq('status', 'scheduled')
    .lte('scheduled_start_at', now)
    .select();

  if (scheduledCampaigns && scheduledCampaigns.length > 0) {
    console.log(`⏰ ${scheduledCampaigns.length} campanhas agendadas iniciadas`);
  }

  const { data: runningCampaigns } = await supabase
    .from('process_campaigns')
    .select('*')
    .eq('status', 'running')
    .order('created_at', { ascending: true });

  if (!runningCampaigns || runningCampaigns.length === 0) {
    console.log('💤 Nenhuma campanha em execução');
    return;
  }

  console.log(`🚀 Processando ${runningCampaigns.length} campanhas...`);

  for (const campaign of runningCampaigns) {
    await processCampaign(campaign);
  }

  console.log('✅ Execução concluída');
}

main().catch(console.error);
