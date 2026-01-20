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
    const dateStr = body.date ?? new URL(req.url).searchParams.get('date');

    console.log('[public-get-events] slug:', slug, 'date:', dateStr);

    if (!slug || !dateStr) {
      return new Response(
        JSON.stringify({ error: 'slug e date são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return new Response(
        JSON.stringify({ error: 'date inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obter calendário
    const { data: calendar, error: calendarError } = await supabase
      .from('calendars')
      .select('id')
      .eq('slug', slug)
      .eq('is_public', true)
      .maybeSingle();

    if (calendarError || !calendar) {
      return new Response(
        JSON.stringify({ error: 'Calendário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar eventos do dia
    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select('start_time, end_time, status')
      .eq('calendar_id', calendar.id)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .neq('status', 'cancelled');

    if (eventsError) {
      console.error('[public-get-events] Erro ao buscar eventos:', eventsError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar eventos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ events }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[public-get-events] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});