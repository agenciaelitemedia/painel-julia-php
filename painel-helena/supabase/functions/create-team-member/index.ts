import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { email, password, name, client_id, modules } = await req.json();

    console.log('Creating team member:', { email, name, client_id, hasModules: !!modules });

    // Verificar limite de membros da equipe
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('max_team_members')
      .eq('id', client_id)
      .single();

    if (clientError) {
      console.error('Error fetching client:', clientError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao verificar limite de membros' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Se max_team_members não for 0 (ilimitado), verificar o limite
    if (clientData.max_team_members !== 0) {
      const { count, error: countError } = await supabaseAdmin
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client_id)
        .eq('is_active', true);

      if (countError) {
        console.error('Error counting team members:', countError);
      } else if (count !== null && count >= clientData.max_team_members) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Limite de ${clientData.max_team_members} membros da equipe atingido. Entre em contato com o suporte para aumentar o limite.` 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
    }

    // Criar usuário usando admin API (não faz login automático)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirma email automaticamente
      user_metadata: {
        full_name: name,
      }
    });

    if (authError) {
      console.error('Error creating user:', authError);
      
      // Check if user already exists - verificar tanto message quanto code
      const errorMessage = authError.message || '';
      const errorCode = (authError as any).code || '';
      
      if (errorMessage.includes('already been registered') || errorCode === 'email_exists') {
        return new Response(
          JSON.stringify({ success: false, error: 'Este email já está registrado no sistema. Use outro email.' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
      
      // Retornar erro genérico para outros casos
      return new Response(
        JSON.stringify({ success: false, error: authError.message || 'Erro ao criar usuário' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    if (!authData.user) {
      console.error('No user data returned from createUser');
      throw new Error('Erro ao criar usuário');
    }

    console.log('User created successfully:', authData.user.id);

    // Atualizar perfil do usuário com client_id
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .update({ client_id })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Error updating user profile:', profileError);
      throw profileError;
    }

    console.log('User profile updated successfully');

    // Add 'team_member' role for this user
    const { error: addRoleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: authData.user.id, role: 'team_member' })
      .select()
      .single();

    if (addRoleError) {
      console.error('Error adding team_member role:', addRoleError);
      throw addRoleError;
    }

    console.log('Team member role added successfully');

    // Criar registro de membro da equipe
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('team_members')
      .insert({
        client_id,
        user_id: authData.user.id,
        name,
        email,
      })
      .select()
      .single();

    if (memberError) {
      console.error('Error creating team member:', memberError);
      throw memberError;
    }

    console.log('Team member created successfully:', memberData.id);

    // Inserir permissões do membro da equipe
    if (modules && modules.length > 0) {
      console.log('Inserting permissions:', modules.length);
      
      const permissions = modules.map((module: string) => ({
        team_member_id: memberData.id,
        module,
      }));

      const { error: permError } = await supabaseAdmin
        .from('team_member_permissions')
        .insert(permissions);

      if (permError) {
        console.error('Error creating permissions:', permError);
        throw permError;
      }
      
      console.log('Permissions created successfully');
    }

    return new Response(
      JSON.stringify({ success: true, member: memberData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in create-team-member function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});
