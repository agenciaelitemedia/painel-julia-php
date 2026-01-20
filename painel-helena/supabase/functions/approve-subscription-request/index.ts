import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para gerar senha forte
function generateStrongPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%&*';
  const all = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  for (let i = 4; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Ler body antecipadamente para saber se é automático
    const { request_id: reqIdFromBody, requestId: reqIdAlt, is_automatic = false } = await req.json();
    const request_id = reqIdFromBody || reqIdAlt;

    // Para chamadas automáticas (via webhook), não exigir Authorization
    if (!is_automatic) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Não autorizado' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Não autorizado' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Injeta user no escopo local para uso abaixo
      (globalThis as any).requestingUser = user;
    } else {
      (globalThis as any).requestingUser = null;
    }

    // Buscar pedido
    const { data: request, error: requestError } = await supabaseClient
      .from('subscription_requests')
      .select('*, subscription_plans(*)')
      .eq('id', request_id)
      .single();

    if (requestError || !request) {
      return new Response(
        JSON.stringify({ error: 'Pedido não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se pagamento foi confirmado
    if (request.status !== 'payment_confirmed') {
      return new Response(
        JSON.stringify({ error: 'Pagamento ainda não confirmado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar senha temporária
    const tempPassword = generateStrongPassword();

    // Criar usuário no auth.users (ou reutilizar se já existir)
    let userAlreadyExists = false;
    let userId: string | null = null;

    const { data: newUser, error: createUserError } = await supabaseClient.auth.admin.createUser({
      email: request.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: request.full_name,
        role: 'client'
      }
    });

    if (createUserError) {
      const msg = String(createUserError.message || '').toLowerCase();
      if (msg.includes('already') || msg.includes('exist')) {
        userAlreadyExists = true;
        // Buscar usuário existente por email
        const { data: usersList, error: listErr } = await supabaseClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listErr) {
          console.error('Erro ao listar usuários:', listErr);
          return new Response(
            JSON.stringify({ error: 'Usuário já existe mas não foi possível localizá-lo' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const existing = usersList.users.find((u: any) => (u.email || '').toLowerCase() === (request.email || '').toLowerCase());
        if (!existing) {
          return new Response(
            JSON.stringify({ error: 'Usuário já existe mas não foi possível localizá-lo' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        userId = existing.id;
      } else {
        console.error('Erro ao criar usuário:', createUserError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar conta de usuário' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      userId = newUser.user?.id ?? null;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Falha ao determinar usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter ou criar cliente
    const { data: existingClient, error: existingClientErr } = await supabaseClient
      .from('clients')
      .select('id')
      .eq('email', request.email)
      .maybeSingle();

    if (existingClientErr) {
      console.error('Erro ao verificar cliente existente:', existingClientErr);
    }

    let clientId: string | null = existingClient?.id || null;

    if (!clientId) {
      // Aplicar configurações do plano ao cliente
      const plan = request.subscription_plans;
      
      const { data: createdClient, error: clientInsertError } = await supabaseClient
        .from('clients')
        .insert({
          name: request.full_name,
          email: request.email,
          cpf_cnpj: request.cpf_cnpj || null,
          whatsapp_phone: request.whatsapp_phone || null,
          plan_id: request.plan_id || null,
          // Aplicar limites do plano
          max_connections: plan?.max_connections || 1,
          max_agents: (plan?.max_agents || 0) + (plan?.max_julia_agents || 0),
          max_julia_agents: plan?.max_julia_agents ?? 0,
          max_team_members: plan?.max_team_members || 5,
          max_monthly_contacts: plan?.max_monthly_contacts || 100,
          release_customization: plan?.release_customization ?? true,
          // Datas do plano
          plan_started_at: new Date().toISOString(),
          plan_expires_at: plan?.billing_cycle === 'monthly' 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : plan?.billing_cycle === 'yearly'
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            : null,
        })
        .select()
        .single();

      if (clientInsertError || !createdClient) {
        console.error('Erro ao criar cliente:', clientInsertError);
        // Reverter criação do usuário apenas se foi criado agora
        if (!userAlreadyExists && userId) {
          await supabaseClient.auth.admin.deleteUser(userId);
        }
        return new Response(
          JSON.stringify({ error: 'Erro ao criar cliente' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      clientId = createdClient.id;

      // Criar permissões de módulos baseadas no plano
      if (plan?.enabled_modules && Array.isArray(plan.enabled_modules) && plan.enabled_modules.length > 0) {
        const modulePermissions = plan.enabled_modules.map((module: string) => ({
          client_id: clientId,
          module: module
        }));

        const { error: permissionsError } = await supabaseClient
          .from('client_permissions')
          .insert(modulePermissions);

        if (permissionsError) {
          console.error('Erro ao criar permissões de módulos:', permissionsError);
          // Não falha a aprovação, apenas loga o erro
        } else {
          console.log(`✅ ${plan.enabled_modules.length} módulos configurados para o cliente`);
        }
      }

      // Criar cliente no Asaas
      try {
        console.log('🔗 Criando cliente no Asaas...');
        const { data: asaasCustomerData, error: asaasCustomerError } = await supabaseClient.functions.invoke(
          'create-asaas-customer',
          {
            body: { clientId: clientId }
          }
        );

        if (asaasCustomerError || !asaasCustomerData?.success) {
          console.error('⚠️ Erro ao criar cliente no Asaas:', asaasCustomerError || asaasCustomerData);
          // Não falha a aprovação, apenas loga o erro
        } else {
          console.log('✅ Cliente criado no Asaas:', asaasCustomerData.customerId);

          // Criar assinatura no Asaas
          try {
            console.log('📋 Criando assinatura no Asaas...');
            
            // Calcular próximo vencimento (30 dias)
            const nextDueDate = new Date();
            nextDueDate.setDate(nextDueDate.getDate() + 30);
            
            const { data: subscriptionData, error: subscriptionError } = await supabaseClient.functions.invoke(
              'create-asaas-subscription',
              {
                body: {
                  clientId: clientId,
                  planName: plan.name,
                  value: plan.price,
                  cycle: plan.billing_cycle === 'monthly' ? 'MONTHLY' : plan.billing_cycle === 'yearly' ? 'YEARLY' : 'MONTHLY',
                  billingType: 'PIX',
                  description: `Assinatura ${plan.name} - Vencimento em 30 dias`
                }
              }
            );

            if (subscriptionError || !subscriptionData?.success) {
              console.error('⚠️ Erro ao criar assinatura no Asaas:', subscriptionError || subscriptionData);
            } else {
              console.log('✅ Assinatura criada no Asaas:', subscriptionData.subscription?.asaas_subscription_id);
            }
          } catch (subError) {
            console.error('⚠️ Erro ao criar assinatura (não bloqueante):', subError);
          }
        }
      } catch (customerError) {
        console.error('⚠️ Erro ao criar cliente no Asaas (não bloqueante):', customerError);
      }
    }

    // Vincular usuário ao cliente
    const { error: linkError } = await supabaseClient
      .from('users')
      .update({ client_id: clientId })
      .eq('id', userId);

    if (linkError) {
      console.error('Erro ao vincular usuário ao cliente:', linkError);
      return new Response(
        JSON.stringify({ error: 'Erro ao vincular usuário ao cliente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar pedido
    const { error: updateError } = await supabaseClient
      .from('subscription_requests')
      .update({
        status: 'completed',
        approved_by: is_automatic ? null : (globalThis as any).requestingUser?.id || null,
        approved_at: new Date().toISOString()
      })
      .eq('id', request_id);

    if (updateError) {
      console.error('Erro ao atualizar pedido:', updateError);
    }

    // Registrar auditoria
    await supabaseClient
      .from('approval_audit_log')
      .insert({
        request_id: request_id,
        approval_type: is_automatic ? 'automatic' : 'manual',
        approved_by: is_automatic ? null : (globalThis as any).requestingUser?.id || null,
        approval_criteria_met: {
          payment_confirmed: true,
          user_created: true,
          client_created: true
        }
      });

    // Enviar credenciais via WhatsApp (apenas se usuário foi criado agora)
    if (!userAlreadyExists) {
      try {
        await supabaseClient.functions.invoke(
          'send-access-credentials',
          {
            body: {
              request_id: request_id,
              email: request.email,
              temp_password: tempPassword,
              full_name: request.full_name,
              whatsapp_phone: request.whatsapp_phone
            }
          }
        );
      } catch (credentialsError) {
        console.error('⚠️ Erro ao enviar credenciais (não bloqueante):', credentialsError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pedido aprovado e conta criada com sucesso',
        // user_id mantido quando aplicável
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});