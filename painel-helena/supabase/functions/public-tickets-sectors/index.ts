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
      sector_id,
      data = {}
    } = await req.json();

    console.log(`[public-tickets-sectors] Action: ${action}, helena_count_id: ${helena_count_id}`);

    if (!helena_count_id) {
      return new Response(
        JSON.stringify({ error: 'helena_count_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // List sectors
    if (action === 'list') {
      const { data: sectors, error } = await supabase
        .from('ticket_sectors')
        .select('*')
        .eq('helena_count_id', helena_count_id)
        .order('position');

      if (error) throw error;

      return new Response(
        JSON.stringify({ sectors }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create sector
    if (action === 'create') {
      // Generate slug from name
      const slug = data.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Get max position
      const { data: maxPos } = await supabase
        .from('ticket_sectors')
        .select('position')
        .eq('helena_count_id', helena_count_id)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const sectorData = {
        helena_count_id,
        name: data.name,
        slug,
        color: data.color || '#6366f1',
        sla_hours: data.sla_hours || 24,
        default_priority: data.default_priority || 'normal',
        is_active: true,
        position: (maxPos?.position || 0) + 1
      };

      const { data: sector, error } = await supabase
        .from('ticket_sectors')
        .insert(sectorData)
        .select()
        .single();

      if (error) throw error;

      console.log(`[public-tickets-sectors] Sector created: ${sector.id}`);

      return new Response(
        JSON.stringify({ sector }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update sector
    if (action === 'update' && sector_id) {
      const updates: Record<string, any> = {};
      
      if (data.name !== undefined) {
        updates.name = data.name;
        updates.slug = data.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }
      if (data.color !== undefined) updates.color = data.color;
      if (data.sla_hours !== undefined) updates.sla_hours = data.sla_hours;
      if (data.default_priority !== undefined) updates.default_priority = data.default_priority;
      if (data.is_active !== undefined) updates.is_active = data.is_active;
      if (data.position !== undefined) updates.position = data.position;

      const { data: sector, error } = await supabase
        .from('ticket_sectors')
        .update(updates)
        .eq('id', sector_id)
        .eq('helena_count_id', helena_count_id)
        .select()
        .single();

      if (error) throw error;

      console.log(`[public-tickets-sectors] Sector updated: ${sector_id}`);

      return new Response(
        JSON.stringify({ sector }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete sector
    if (action === 'delete' && sector_id) {
      const { error } = await supabase
        .from('ticket_sectors')
        .delete()
        .eq('id', sector_id)
        .eq('helena_count_id', helena_count_id);

      if (error) throw error;

      console.log(`[public-tickets-sectors] Sector deleted: ${sector_id}`);

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
    console.error('[public-tickets-sectors] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
