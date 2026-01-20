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

    const { action, moduleData } = await req.json();
    
    console.log('Managing system module:', { action, moduleData });

    if (action === 'create') {
      // Criar módulo na tabela
      const { data: moduleResult, error: moduleError } = await supabaseAdmin
        .from('system_modules')
        .insert({
          module_key: moduleData.module_key,
          label: moduleData.label,
          description: moduleData.description || null,
          icon_name: moduleData.icon_name || null,
          display_order: moduleData.display_order,
          is_active: moduleData.is_active,
        })
        .select()
        .single();

      if (moduleError) {
        console.error('Error creating module:', moduleError);
        if (moduleError.code === '23505') {
          return new Response(
            JSON.stringify({ success: false, error: 'Já existe um módulo com esta chave' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        }
        throw moduleError;
      }

      // Adicionar valor ao enum system_module usando função SQL
      const { error: enumError } = await supabaseAdmin.rpc('add_system_module_enum_value', {
        new_value: moduleData.module_key
      });

      if (enumError) {
        console.error('Error adding enum value:', enumError);
        // Continuar mesmo se houver erro ao adicionar ao enum
        // O módulo já foi criado na tabela
      }

      console.log('Module created successfully:', moduleResult.id);

      return new Response(
        JSON.stringify({ success: true, module: moduleResult }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } else if (action === 'update') {
      // Atualizar módulo existente
      const { error: updateError } = await supabaseAdmin
        .from('system_modules')
        .update({
          label: moduleData.label,
          description: moduleData.description || null,
          icon_name: moduleData.icon_name || null,
          display_order: moduleData.display_order,
          is_active: moduleData.is_active,
        })
        .eq('id', moduleData.id);

      if (updateError) {
        console.error('Error updating module:', updateError);
        throw updateError;
      }

      console.log('Module updated successfully');

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } else if (action === 'delete') {
      // Nota: Não podemos remover valores do enum em PostgreSQL
      // Então apenas marcamos o módulo como inativo
      const { error: deleteError } = await supabaseAdmin
        .from('system_modules')
        .delete()
        .eq('id', moduleData.id);

      if (deleteError) {
        console.error('Error deleting module:', deleteError);
        throw deleteError;
      }

      console.log('Module deleted successfully');
      console.log('Note: O valor do enum system_module não pode ser removido automaticamente');

      return new Response(
        JSON.stringify({ 
          success: true,
          warning: 'O módulo foi excluído, mas o valor permanece no enum system_module (limitação do PostgreSQL)'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Ação inválida' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );

  } catch (error) {
    console.error('Error in manage-system-module function:', error);
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
