import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Create client with user's auth token for permissions
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { 
      client_code,
      name, 
      email, 
      cpf_cnpj,
      whatsapp_phone,
      max_connections,
      max_team_members,
      max_agents,
      max_julia_agents,
      max_monthly_contacts,
      password,
      modules,
      julia_agent_codes,
      release_customization
    } = await req.json();

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nome, email e senha são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Creating client:', { name, email });

    // Pre-check: avoid duplicate client email (returns 409 instead of 500)
    const { data: existingClient, error: existingClientError } = await supabaseClient
      .from('clients')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingClientError) {
      console.error('Error checking existing client:', existingClientError);
      throw existingClientError;
    }

    if (existingClient) {
      return new Response(
        JSON.stringify({ success: false, error: 'Já existe um cliente com este email', code: 'CLIENT_EMAIL_EXISTS' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      );
    }

    // 1. Create client in database
    const { data: clientData, error: clientError } = await supabaseClient
      .from('clients')
      .insert({
        client_code: client_code || null,
        name,
        email,
        cpf_cnpj: cpf_cnpj || null,
        whatsapp_phone: whatsapp_phone || null,
        max_connections: max_connections ?? 1,
        max_team_members: max_team_members ?? 5,
        max_agents: max_agents ?? 0,
        max_julia_agents: max_julia_agents ?? 0,
        max_monthly_contacts: max_monthly_contacts ?? 100,
        julia_agent_codes: julia_agent_codes || [],
        release_customization: release_customization ?? true,
      })
      .select()
      .single();

    if (clientError) {
      console.error('Error creating client:', clientError);
      throw clientError;
    }

    console.log('Client created:', clientData.id);

    // 2. Insert client permissions
    if (modules && modules.length > 0) {
      const permissions = modules.map((module: string) => ({
        client_id: clientData.id,
        module: module,
      }));

      const { error: permError } = await supabaseClient
        .from('client_permissions')
        .insert(permissions);

      if (permError) {
        console.error('Error creating permissions:', permError);
        throw permError;
      }
      
      console.log('Permissions created:', modules.length);
    }

    // 3. Create user account using admin API (não faz login automático)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        full_name: name,
        role: 'client',
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw authError;
    }

    console.log('Auth user created:', authData.user?.id);

    // 4. Update user profile with client_id
    if (authData.user) {
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .update({ client_id: clientData.id })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Error updating user profile:', profileError);
        throw profileError;
      }
    }

    console.log('Client creation completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        clientId: clientData.id,
        userId: authData.user?.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in create-client:', error);
    const message = error?.message || 'Erro ao criar cliente';
    const isDuplicateClient = (error?.code === '23505' && String(error?.message).includes('clients_email_key'));
    const status = isDuplicateClient ? 409 : 500;
    const code = isDuplicateClient ? 'CLIENT_EMAIL_EXISTS' : 'INTERNAL_ERROR';
    return new Response(
      JSON.stringify({ success: false, error: message, code }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
    );
  }
});
