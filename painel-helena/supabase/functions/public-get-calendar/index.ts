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
    const body = await req.json().catch(() => ({}));
    const slug = body.slug ?? body.calendar_slug ?? new URL(req.url).searchParams.get('slug');

    console.log('[public-get-calendar] slug recebido:', slug);

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'slug é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar calendário público
    const { data: calendar, error: calendarError } = await supabase
      .from('calendars')
      .select('id, slug, name, description, timezone, is_public, booking_settings, color')
      .eq('slug', slug)
      .eq('is_public', true)
      .maybeSingle();

    if (calendarError || !calendar) {
      console.error('[public-get-calendar] Calendário não encontrado:', calendarError);
      return new Response(
        JSON.stringify({ error: 'Calendário não encontrado ou indisponível' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar disponibilidade
    const { data: availability, error: availError } = await supabase
      .from('calendar_availability')
      .select('id, day_of_week, start_time, end_time, is_available')
      .eq('calendar_id', calendar.id)
      .eq('is_available', true)
      .order('day_of_week')
      .order('start_time');

    if (availError) {
      console.error('[public-get-calendar] Erro ao buscar disponibilidade:', availError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar disponibilidade' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ calendar, availability }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[public-get-calendar] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});