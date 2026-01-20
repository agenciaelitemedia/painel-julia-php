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
      action,
      ticket_id,
      data = {},
      user_id,
      user_name = 'Sistema'
    } = await req.json();

    console.log(`[public-tickets-mutation] Action: ${action}, helena_count_id: ${helena_count_id}`);

    if (!helena_count_id) {
      return new Response(
        JSON.stringify({ error: 'helena_count_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Helper to add history entry
    const addHistory = async (ticketId: string, historyAction: string, oldValue: string | null, newValue: string | null) => {
      await supabase.from('ticket_history').insert({
        ticket_id: ticketId,
        action: historyAction,
        old_value: oldValue,
        new_value: newValue,
        user_id: user_id || 'system',
        user_name: user_name
      });
    };

    // Create ticket
    if (action === 'create') {
      // Get sector for SLA
      let slaDeadline = null;
      if (data.sector_id) {
        const { data: sector } = await supabase
          .from('ticket_sectors')
          .select('sla_hours, default_priority')
          .eq('id', data.sector_id)
          .single();
        
        if (sector?.sla_hours) {
          slaDeadline = new Date(Date.now() + sector.sla_hours * 60 * 60 * 1000).toISOString();
        }
        if (!data.priority && sector?.default_priority) {
          data.priority = sector.default_priority;
        }
      }

      const ticketData = {
        helena_count_id,
        title: data.title,
        description: data.description,
        sector_id: data.sector_id,
        priority: data.priority || 'normal',
        status: 'aberto',
        whatsapp_number: data.whatsapp_number,
        contact_name: data.contact_name,
        cod_agent: data.cod_agent,
        chat_context: data.chat_context,
        assigned_to_id: data.assigned_to_id,
        assigned_at: data.assigned_to_id ? new Date().toISOString() : null,
        sla_deadline: slaDeadline,
        tags: data.tags || [],
        created_by_id: user_id,
        created_by_name: user_name,
        helena_contact_id: data.helena_contact_id || null,
        session_id: data.session_id || null
      };

      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select()
        .single();

      if (error) throw error;

      // Add history
      await addHistory(ticket.id, 'criado', null, `Ticket criado: ${data.title}`);

      if (data.assigned_to_id) {
        const { data: assignee } = await supabase
          .from('ticket_team_members')
          .select('user_name')
          .eq('id', data.assigned_to_id)
          .single();
        await addHistory(ticket.id, 'atribuido', null, assignee?.user_name || 'Usuário');
      }

      console.log(`[public-tickets-mutation] Ticket created: ${ticket.id}`);

      return new Response(
        JSON.stringify({ ticket }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update ticket
    if (action === 'update' && ticket_id) {
      // Get current ticket
      const { data: currentTicket, error: fetchError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticket_id)
        .eq('helena_count_id', helena_count_id)
        .single();

      if (fetchError) throw fetchError;

      const updates: Record<string, any> = {};
      const historyEntries: { action: string; old: string | null; new: string | null }[] = [];

      // Check each field for changes
      if (data.status && data.status !== currentTicket.status) {
        updates.status = data.status;
        historyEntries.push({ action: 'status_alterado', old: currentTicket.status, new: data.status });
        
        if (data.status === 'resolvido') {
          updates.resolved_at = new Date().toISOString();
          updates.resolved_by_id = user_id;
          updates.resolved_by_name = user_name;
        }
      }

      if (data.priority && data.priority !== currentTicket.priority) {
        updates.priority = data.priority;
        historyEntries.push({ action: 'prioridade_alterada', old: currentTicket.priority, new: data.priority });
      }

      if (data.sector_id && data.sector_id !== currentTicket.sector_id) {
        updates.sector_id = data.sector_id;
        
        // Get sector names for history
        const { data: sectors } = await supabase
          .from('ticket_sectors')
          .select('id, name')
          .in('id', [currentTicket.sector_id, data.sector_id].filter(Boolean));
        
        const oldSector = sectors?.find(s => s.id === currentTicket.sector_id)?.name || 'Nenhum';
        const newSector = sectors?.find(s => s.id === data.sector_id)?.name || 'Nenhum';
        historyEntries.push({ action: 'setor_alterado', old: oldSector, new: newSector });

        // Update SLA
        const { data: sector } = await supabase
          .from('ticket_sectors')
          .select('sla_hours')
          .eq('id', data.sector_id)
          .single();
        
        if (sector?.sla_hours) {
          updates.sla_deadline = new Date(Date.now() + sector.sla_hours * 60 * 60 * 1000).toISOString();
          updates.sla_breached = false;
        }
      }

      if (data.assigned_to_id !== undefined && data.assigned_to_id !== currentTicket.assigned_to_id) {
        updates.assigned_to_id = data.assigned_to_id;
        updates.assigned_at = data.assigned_to_id ? new Date().toISOString() : null;
        
        // Get assignee names for history
        let oldName = 'Ninguém';
        let newName = 'Ninguém';
        
        if (currentTicket.assigned_to_id || data.assigned_to_id) {
          const ids = [currentTicket.assigned_to_id, data.assigned_to_id].filter(Boolean);
          const { data: members } = await supabase
            .from('ticket_team_members')
            .select('id, user_name')
            .in('id', ids);
          
          oldName = members?.find(m => m.id === currentTicket.assigned_to_id)?.user_name || 'Ninguém';
          newName = members?.find(m => m.id === data.assigned_to_id)?.user_name || 'Ninguém';
        }
        
        historyEntries.push({ action: 'atribuido', old: oldName, new: newName });
      }

      if (data.title !== undefined) updates.title = data.title;
      if (data.description !== undefined) updates.description = data.description;
      if (data.tags !== undefined) updates.tags = data.tags;

      if (Object.keys(updates).length > 0) {
        const { data: ticket, error } = await supabase
          .from('tickets')
          .update(updates)
          .eq('id', ticket_id)
          .select()
          .single();

        if (error) throw error;

        // Add history entries
        for (const entry of historyEntries) {
          await addHistory(ticket_id, entry.action, entry.old, entry.new);
        }

        console.log(`[public-tickets-mutation] Ticket updated: ${ticket_id}`);

        return new Response(
          JSON.stringify({ ticket }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ ticket: currentTicket }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add comment
    if (action === 'add_comment' && ticket_id) {
      const { data: comment, error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id,
          user_id: user_id || 'system',
          user_name,
          content: data.content,
          is_internal: data.is_internal !== false
        })
        .select()
        .single();

      if (error) throw error;

      await addHistory(ticket_id, 'comentario', null, `Comentário adicionado por ${user_name}`);

      console.log(`[public-tickets-mutation] Comment added to ticket: ${ticket_id}`);

      return new Response(
        JSON.stringify({ comment }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete ticket
    if (action === 'delete' && ticket_id) {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticket_id)
        .eq('helena_count_id', helena_count_id);

      if (error) throw error;

      console.log(`[public-tickets-mutation] Ticket deleted: ${ticket_id}`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Escalate ticket
    if (action === 'escalate' && ticket_id) {
      const { target_level, target_sector_id, target_user_id, reason } = data;

      // Get current ticket
      const { data: currentTicket, error: fetchError } = await supabase
        .from('tickets')
        .select('*, sector:ticket_sectors(id, name, support_level)')
        .eq('id', ticket_id)
        .eq('helena_count_id', helena_count_id)
        .single();

      if (fetchError) throw fetchError;

      // Create escalation record
      const { error: escalationError } = await supabase
        .from('ticket_escalations')
        .insert({
          ticket_id,
          from_sector_id: currentTicket.sector_id,
          to_sector_id: target_sector_id || currentTicket.sector_id,
          from_user_id: currentTicket.assigned_to_id,
          to_user_id: target_user_id || null,
          from_level: currentTicket.current_level || 'n1',
          to_level: target_level,
          escalation_type: 'manual',
          reason,
          escalated_by_id: user_id,
          escalated_by_name: user_name
        });

      if (escalationError) {
        console.error('[public-tickets-mutation] Error creating escalation:', escalationError);
      }

      // Update ticket
      const updates: Record<string, any> = {
        current_level: target_level,
        escalation_count: (currentTicket.escalation_count || 0) + 1
      };

      if (target_sector_id) {
        updates.sector_id = target_sector_id;
      }
      if (target_user_id) {
        updates.assigned_to_id = target_user_id;
        updates.assigned_at = new Date().toISOString();
      }

      const { data: ticket, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticket_id)
        .select()
        .single();

      if (error) throw error;

      // Add history
      await addHistory(ticket_id, 'escalonado', currentTicket.current_level || 'n1', target_level);

      console.log(`[public-tickets-mutation] Ticket escalated: ${ticket_id} to ${target_level}`);

      return new Response(
        JSON.stringify({ ticket }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transfer ticket
    if (action === 'transfer' && ticket_id) {
      const { target_sector_id, target_user_id, reason } = data;

      // Get current ticket
      const { data: currentTicket, error: fetchError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticket_id)
        .eq('helena_count_id', helena_count_id)
        .single();

      if (fetchError) throw fetchError;

      // Create transfer record (using escalations table with type = transfer)
      const { error: transferError } = await supabase
        .from('ticket_escalations')
        .insert({
          ticket_id,
          from_sector_id: currentTicket.sector_id,
          to_sector_id: target_sector_id || currentTicket.sector_id,
          from_user_id: currentTicket.assigned_to_id,
          to_user_id: target_user_id || null,
          from_level: currentTicket.current_level || 'n1',
          to_level: currentTicket.current_level || 'n1',
          escalation_type: 'transfer',
          reason,
          escalated_by_id: user_id,
          escalated_by_name: user_name
        });

      if (transferError) {
        console.error('[public-tickets-mutation] Error creating transfer record:', transferError);
      }

      // Update ticket
      const updates: Record<string, any> = {};

      if (target_sector_id) {
        updates.sector_id = target_sector_id;
      }
      if (target_user_id !== undefined) {
        updates.assigned_to_id = target_user_id || null;
        updates.assigned_at = target_user_id ? new Date().toISOString() : null;
      }

      const { data: ticket, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticket_id)
        .select()
        .single();

      if (error) throw error;

      // Get sector names for history
      const sectorIds = [currentTicket.sector_id, target_sector_id].filter(Boolean);
      let historyNew = 'Transferido';
      
      if (target_sector_id) {
        const { data: sectors } = await supabase
          .from('ticket_sectors')
          .select('id, name')
          .in('id', sectorIds);
        
        const fromSector = sectors?.find(s => s.id === currentTicket.sector_id)?.name || 'Setor anterior';
        const toSector = sectors?.find(s => s.id === target_sector_id)?.name || 'Novo setor';
        historyNew = `${fromSector} → ${toSector}`;
      }

      await addHistory(ticket_id, 'transferido', null, historyNew);

      console.log(`[public-tickets-mutation] Ticket transferred: ${ticket_id}`);

      return new Response(
        JSON.stringify({ ticket }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[public-tickets-mutation] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
