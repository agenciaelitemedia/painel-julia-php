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
      ticket_id,
      filters = {},
      page = 1,
      limit = 50
    } = await req.json();

    console.log(`[public-tickets-query] Action: ${action}, helena_count_id: ${helena_count_id}`);

    if (!helena_count_id) {
      return new Response(
        JSON.stringify({ error: 'helena_count_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get single ticket with details
    if (action === 'get' && ticket_id) {
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          sector:ticket_sectors(*),
          assigned_to:ticket_team_members(*)
        `)
        .eq('id', ticket_id)
        .eq('helena_count_id', helena_count_id)
        .single();

      if (ticketError) throw ticketError;

      // Get comments
      const { data: comments } = await supabase
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', ticket_id)
        .order('created_at', { ascending: true });

      // Get history
      const { data: history } = await supabase
        .from('ticket_history')
        .select('*')
        .eq('ticket_id', ticket_id)
        .order('created_at', { ascending: false });

      return new Response(
        JSON.stringify({ ticket, comments, history }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // List tickets with filters
    if (action === 'list') {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          sector:ticket_sectors(id, name, color, slug),
          assigned_to:ticket_team_members(id, user_name, user_email)
        `, { count: 'exact' })
        .eq('helena_count_id', helena_count_id);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.statuses && filters.statuses.length > 0) {
        query = query.in('status', filters.statuses);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.sector_id) {
        query = query.eq('sector_id', filters.sector_id);
      }
      if (filters.assigned_to_id) {
        query = query.eq('assigned_to_id', filters.assigned_to_id);
      }
      if (filters.assigned_user_id) {
        query = query.not('assigned_to_id', 'is', null);
      }
      if (filters.whatsapp_number) {
        query = query.eq('whatsapp_number', filters.whatsapp_number);
      }
      if (filters.helena_contact_id) {
        query = query.eq('helena_contact_id', filters.helena_contact_id);
      }
      if (filters.cod_agent) {
        query = query.eq('cod_agent', filters.cod_agent);
      }
      if (filters.sla_breached === true) {
        query = query.eq('sla_breached', true);
      }
      if (filters.overdue === true) {
        query = query.or(`sla_breached.eq.true,sla_deadline.lt.${new Date().toISOString()}`);
        query = query.not('status', 'in', '("resolvido","cancelado")');
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,contact_name.ilike.%${filters.search}%`);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      // Order by - support overdue_first ordering
      if (filters.order_by === 'overdue_first') {
        // For overdue_first, we order by sla_breached DESC (true first), then sla_deadline ASC (earliest first)
        query = query
          .order('sla_breached', { ascending: false })
          .order('sla_deadline', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data: tickets, error, count } = await query;

      if (error) throw error;

      // Sort by priority in-memory if using overdue_first
      let sortedTickets = tickets || [];
      if (filters.order_by === 'overdue_first') {
        const priorityOrderMap: Record<string, number> = { 'critica': 1, 'alta': 2, 'normal': 3, 'baixa': 4 };
        sortedTickets = [...sortedTickets].sort((a, b) => {
          // First by sla_breached
          if (a.sla_breached !== b.sla_breached) {
            return a.sla_breached ? -1 : 1;
          }
          // Then by sla_deadline (earliest first, nulls last)
          if (a.sla_deadline && b.sla_deadline) {
            const deadlineDiff = new Date(a.sla_deadline).getTime() - new Date(b.sla_deadline).getTime();
            if (deadlineDiff !== 0) return deadlineDiff;
          } else if (a.sla_deadline && !b.sla_deadline) {
            return -1;
          } else if (!a.sla_deadline && b.sla_deadline) {
            return 1;
          }
          // Then by priority
          const aPriority = a.priority as string;
          const bPriority = b.priority as string;
          const priorityDiff = (priorityOrderMap[aPriority] || 99) - (priorityOrderMap[bPriority] || 99);
          if (priorityDiff !== 0) return priorityDiff;
          // Finally by created_at DESC
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      } else {
        // Default sorting by priority then date
        const priorityOrderMap: Record<string, number> = { 'critica': 1, 'alta': 2, 'normal': 3, 'baixa': 4 };
        sortedTickets = [...sortedTickets].sort((a, b) => {
          const aPriority = a.priority as string;
          const bPriority = b.priority as string;
          const priorityDiff = (priorityOrderMap[aPriority] || 99) - (priorityOrderMap[bPriority] || 99);
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      }

      return new Response(
        JSON.stringify({ 
          tickets: sortedTickets, 
          total: count,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get stats
    if (action === 'stats') {
      const { data: allTickets, error } = await supabase
        .from('tickets')
        .select('status, priority, sector_id, created_at, resolved_at, sla_breached')
        .eq('helena_count_id', helena_count_id);

      if (error) throw error;

      const now = new Date();
      const stats: {
        total: number;
        by_status: Record<string, number>;
        by_priority: Record<string, number>;
        overdue: number;
        avg_resolution_time_hours: number;
      } = {
        total: allTickets?.length || 0,
        by_status: {
          aberto: 0,
          em_atendimento: 0,
          aguardando: 0,
          resolvido: 0,
          cancelado: 0
        },
        by_priority: {
          baixa: 0,
          normal: 0,
          alta: 0,
          critica: 0
        },
        overdue: 0,
        avg_resolution_time_hours: 0
      };

      let totalResolutionTime = 0;
      let resolvedCount = 0;

      allTickets?.forEach(ticket => {
        const status = ticket.status as string;
        const priority = ticket.priority as string;
        stats.by_status[status] = (stats.by_status[status] || 0) + 1;
        stats.by_priority[priority] = (stats.by_priority[priority] || 0) + 1;
        
        if (ticket.sla_breached) {
          stats.overdue++;
        }

        if (ticket.status === 'resolvido' && ticket.resolved_at && ticket.created_at) {
          const resTime = new Date(ticket.resolved_at).getTime() - new Date(ticket.created_at).getTime();
          totalResolutionTime += resTime;
          resolvedCount++;
        }
      });

      if (resolvedCount > 0) {
        stats.avg_resolution_time_hours = Math.round((totalResolutionTime / resolvedCount) / (1000 * 60 * 60) * 10) / 10;
      }

      return new Response(
        JSON.stringify(stats),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get contact-specific stats
    if (action === 'contact_stats') {
      let query = supabase
        .from('tickets')
        .select('status, priority, sla_breached')
        .eq('helena_count_id', helena_count_id);

      // Filter by contact
      if (filters.helena_contact_id) {
        query = query.eq('helena_contact_id', filters.helena_contact_id);
      } else if (filters.whatsapp_number) {
        query = query.eq('whatsapp_number', filters.whatsapp_number);
      }

      const { data: contactTickets, error } = await query;

      if (error) throw error;

      const contactStats: {
        total: number;
        pending: number;
        resolved: number;
        by_status: Record<string, number>;
        by_priority: Record<string, number>;
        overdue: number;
      } = {
        total: contactTickets?.length || 0,
        pending: 0,
        resolved: 0,
        by_status: {
          aberto: 0,
          em_atendimento: 0,
          aguardando: 0,
          resolvido: 0,
          cancelado: 0
        },
        by_priority: {
          baixa: 0,
          normal: 0,
          alta: 0,
          critica: 0
        },
        overdue: 0
      };

      contactTickets?.forEach(ticket => {
        const status = ticket.status as string;
        const priority = ticket.priority as string;
        contactStats.by_status[status] = (contactStats.by_status[status] || 0) + 1;
        contactStats.by_priority[priority] = (contactStats.by_priority[priority] || 0) + 1;
        
        if (ticket.sla_breached && !['resolvido', 'cancelado'].includes(status)) {
          contactStats.overdue++;
        }

        if (['resolvido', 'cancelado'].includes(status)) {
          contactStats.resolved++;
        } else {
          contactStats.pending++;
        }
      });

      return new Response(
        JSON.stringify(contactStats),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get tickets by sector
    if (action === 'by_sector') {
      const { data: sectors, error: sectorsError } = await supabase
        .from('ticket_sectors')
        .select('*')
        .eq('helena_count_id', helena_count_id)
        .eq('is_active', true)
        .order('position');

      if (sectorsError) throw sectorsError;

      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, status, priority, sector_id, sla_breached')
        .eq('helena_count_id', helena_count_id)
        .not('status', 'in', '("resolvido","cancelado")');

      if (ticketsError) throw ticketsError;

      const sectorStats = sectors?.map(sector => {
        const sectorTickets = tickets?.filter(t => t.sector_id === sector.id) || [];
        return {
          ...sector,
          ticket_count: sectorTickets.length,
          by_status: {
            aberto: sectorTickets.filter(t => t.status === 'aberto').length,
            em_atendimento: sectorTickets.filter(t => t.status === 'em_atendimento').length,
            aguardando: sectorTickets.filter(t => t.status === 'aguardando').length
          },
          overdue_count: sectorTickets.filter(t => t.sla_breached).length
        };
      });

      return new Response(
        JSON.stringify({ sectors: sectorStats }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[public-tickets-query] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
