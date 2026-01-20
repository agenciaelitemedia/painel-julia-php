import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      helena_count_id, 
      action = 'list',
      member_id,
      sector_id,
      data = {}
    } = await req.json();

    console.log(`[public-tickets-team] Action: ${action}, helena_count_id: ${helena_count_id}`);

    if (!helena_count_id) {
      return new Response(
        JSON.stringify({ error: 'helena_count_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // List team members
    if (action === 'list') {
      let query = supabase
        .from('ticket_team_members')
        .select(`
          *,
          sector:ticket_sectors(id, name, color)
        `)
        .eq('helena_count_id', helena_count_id)
        .order('user_name');

      if (sector_id) {
        query = query.eq('sector_id', sector_id);
      }

      const { data: members, error } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ members }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get available members for assignment
    if (action === 'available') {
      let query = supabase
        .from('ticket_team_members')
        .select(`
          *,
          sector:ticket_sectors(id, name, color)
        `)
        .eq('helena_count_id', helena_count_id)
        .eq('is_active', true)
        .eq('is_available', true)
        .order('user_name');

      if (sector_id) {
        query = query.eq('sector_id', sector_id);
      }

      const { data: members, error } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ members }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create team member
    if (action === 'create') {
      const memberData = {
        helena_count_id,
        sector_id: data.sector_id,
        user_id: data.user_id,
        user_name: data.user_name,
        user_email: data.user_email,
        role: data.role || 'atendente',
        is_available: data.is_available !== false,
        is_active: true
      };

      const { data: member, error } = await supabase
        .from('ticket_team_members')
        .insert(memberData)
        .select(`
          *,
          sector:ticket_sectors(id, name, color)
        `)
        .single();

      if (error) throw error;

      console.log(`[public-tickets-team] Member created: ${member.id}`);

      return new Response(
        JSON.stringify({ member }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update team member
    if (action === 'update' && member_id) {
      const updates: Record<string, any> = {};
      
      if (data.sector_id !== undefined) updates.sector_id = data.sector_id;
      if (data.user_name !== undefined) updates.user_name = data.user_name;
      if (data.user_email !== undefined) updates.user_email = data.user_email;
      if (data.role !== undefined) updates.role = data.role;
      if (data.is_available !== undefined) updates.is_available = data.is_available;
      if (data.is_active !== undefined) updates.is_active = data.is_active;

      const { data: member, error } = await supabase
        .from('ticket_team_members')
        .update(updates)
        .eq('id', member_id)
        .eq('helena_count_id', helena_count_id)
        .select(`
          *,
          sector:ticket_sectors(id, name, color)
        `)
        .single();

      if (error) throw error;

      console.log(`[public-tickets-team] Member updated: ${member_id}`);

      return new Response(
        JSON.stringify({ member }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete team member
    if (action === 'delete' && member_id) {
      const { error } = await supabase
        .from('ticket_team_members')
        .delete()
        .eq('id', member_id)
        .eq('helena_count_id', helena_count_id);

      if (error) throw error;

      console.log(`[public-tickets-team] Member deleted: ${member_id}`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[public-tickets-team] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
