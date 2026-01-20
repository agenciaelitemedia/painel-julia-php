import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface HelenaDepartment {
  id: string;
  companyId: string;
  name: string;
  isDefault: boolean;
  agents: Array<{
    userId: string;
    departmentId: string;
    isAgent: boolean;
    isSupervisor: boolean;
  }>;
}

interface HelenaAgent {
  id: string;
  userId: string;
  name: string;
  shortName: string;
  email: string;
  phoneNumber: string;
  phoneNumberFormatted: string;
  profile: string;
  isOwner: boolean;
  departments: Array<{
    agentId: string;
    departmentId: string;
    isAgent: boolean;
    isSupervisor: boolean;
  }>;
}

async function getExternalDbClient() {
  const rawCaCert = Deno.env.get('EXTERNAL_DB_CA_CERT');

  if (!rawCaCert) {
    throw new Error('Missing EXTERNAL_DB_CA_CERT secret');
  }

  const normalizeCaCertificates = (input: string): string[] => {
    const cleaned = input.replace(/\\n/g, '\n').replace(/\r/g, '\n');
    const blocks: string[] = [];
    const regex = /-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(cleaned)) !== null) {
      const body = match[1].replace(/[^A-Za-z0-9+/=]/g, '');
      const wrapped = (body.match(/.{1,64}/g) || [body]).join('\n');
      blocks.push(`-----BEGIN CERTIFICATE-----\n${wrapped}\n-----END CERTIFICATE-----\n`);
    }

    if (blocks.length === 0) {
      blocks.push(cleaned.trim());
    }

    return blocks;
  };

  const caCertificates = normalizeCaCertificates(rawCaCert);

  const client = new Client({
    hostname: Deno.env.get('EXTERNAL_DB_HOST'),
    port: parseInt(Deno.env.get('EXTERNAL_DB_PORT') || '25060'),
    database: Deno.env.get('EXTERNAL_DB_NAME'),
    user: Deno.env.get('EXTERNAL_DB_USER'),
    password: Deno.env.get('EXTERNAL_DB_PASSWORD'),
    tls: {
      enabled: true,
      enforce: true,
      caCertificates,
    },
    connection: {
      attempts: 1,
    },
  });

  await client.connect();
  return client;
}

async function getHelenaToken(helenaCountId: string): Promise<string | null> {
  let client: Client | null = null;
  
  try {
    client = await getExternalDbClient();
    
    // Query external database for helena_token (without wp_number constraint)
    const tokenResult = await client.queryObject<{ helena_token: string }>(
      `SELECT helena_token FROM public.agents_helena 
       WHERE helena_count_id = $1 
       AND status = true 
       AND helena_token IS NOT NULL 
       AND helena_token <> ''
       ORDER BY updated_at DESC
       LIMIT 1`,
      [helenaCountId]
    );

    if (!tokenResult.rows.length || !tokenResult.rows[0].helena_token) {
      console.log('[Helena Sync] Token not found for helena_count_id:', helenaCountId);
      return null;
    }

    return tokenResult.rows[0].helena_token;
  } catch (error) {
    console.error('[Helena Sync] Error getting token from external DB:', error);
    return null;
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (e) {
        console.error('[Helena Sync] Error closing connection:', e);
      }
    }
  }
}

async function fetchHelenaDepartments(token: string): Promise<HelenaDepartment[]> {
  const response = await fetch("https://api.wts.chat/core/v2/department", {
    method: "GET",
    headers: {
      "Authorization": token,
      "accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Helena API error: ${response.status}`);
  }

  return response.json();
}

async function fetchHelenaAgents(token: string): Promise<HelenaAgent[]> {
  const response = await fetch("https://api.wts.chat/core/v1/agent", {
    method: "GET",
    headers: {
      "Authorization": token,
      "accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Helena API error: ${response.status}`);
  }

  return response.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, helena_count_id } = await req.json();

    if (!helena_count_id) {
      return new Response(
        JSON.stringify({ error: "helena_count_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('[Helena Sync] Action:', action, 'helena_count_id:', helena_count_id);

    const helenaToken = await getHelenaToken(helena_count_id);

    if (!helenaToken) {
      return new Response(
        JSON.stringify({ error: "Helena token not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('[Helena Sync] Token found, executing action:', action);

    switch (action) {
      case "sync_departments": {
        const departments = await fetchHelenaDepartments(helenaToken);
        const syncedSectors: any[] = [];

        for (const dept of departments) {
          const slug = dept.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

          // Check if sector exists
          const { data: existing } = await supabase
            .from("ticket_sectors")
            .select("*")
            .eq("helena_count_id", helena_count_id)
            .eq("helena_department_id", dept.id)
            .single();

          if (existing) {
            // Update name only, keep local configs (color, sla, priority)
            const { data: updated } = await supabase
              .from("ticket_sectors")
              .update({
                name: dept.name,
                is_default: dept.isDefault,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existing.id)
              .select()
              .single();
            
            syncedSectors.push(updated);
          } else {
            // Create new sector with Helena data
            const { data: created } = await supabase
              .from("ticket_sectors")
              .insert({
                helena_count_id: helena_count_id,
                helena_department_id: dept.id,
                name: dept.name,
                slug: slug,
                color: "#6366f1",
                sla_hours: 24,
                default_priority: "normal",
                is_default: dept.isDefault,
                is_active: true,
                position: syncedSectors.length,
              })
              .select()
              .single();

            syncedSectors.push(created);
          }
        }

        // Fetch final list
        const { data: sectors } = await supabase
          .from("ticket_sectors")
          .select("*")
          .eq("helena_count_id", helena_count_id)
          .order("position");

        return new Response(
          JSON.stringify({ 
            success: true, 
            synced_count: departments.length,
            sectors 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "sync_agents": {
        const agents = await fetchHelenaAgents(helenaToken);
        const syncedMembers: any[] = [];

        // Get sectors mapping
        const { data: sectors } = await supabase
          .from("ticket_sectors")
          .select("id, helena_department_id")
          .eq("helena_count_id", helena_count_id);

        const sectorMap = new Map(
          sectors?.map((s: any) => [s.helena_department_id, s.id]) || []
        );

        for (const agent of agents) {
          // Get first department's sector_id
          const firstDept = agent.departments?.[0];
          const sectorId = firstDept ? sectorMap.get(firstDept.departmentId) : null;
          const isSupervisor = firstDept?.isSupervisor || false;

          // Check if member exists
          const { data: existing } = await supabase
            .from("ticket_team_members")
            .select("*")
            .eq("helena_count_id", helena_count_id)
            .eq("helena_agent_id", agent.id)
            .single();

          if (existing) {
            // Update from Helena, keep local configs (role, is_available)
            const { data: updated } = await supabase
              .from("ticket_team_members")
              .update({
                user_name: agent.name,
                user_email: agent.email,
                helena_user_id: agent.userId,
                phone_number: agent.phoneNumber,
                sector_id: sectorId || existing.sector_id,
                is_supervisor: isSupervisor,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existing.id)
              .select()
              .single();

            syncedMembers.push(updated);
          } else {
            // Create new member
            const { data: created } = await supabase
              .from("ticket_team_members")
              .insert({
                helena_count_id: helena_count_id,
                helena_agent_id: agent.id,
                helena_user_id: agent.userId,
                user_id: agent.userId,
                user_name: agent.name,
                user_email: agent.email,
                phone_number: agent.phoneNumber,
                sector_id: sectorId,
                role: isSupervisor ? "lider" : "atendente",
                is_supervisor: isSupervisor,
                is_available: true,
                is_active: true,
              })
              .select()
              .single();

            syncedMembers.push(created);
          }
        }

        // Fetch final list with sector info
        const { data: members } = await supabase
          .from("ticket_team_members")
          .select(`
            *,
            sector:ticket_sectors(id, name, color)
          `)
          .eq("helena_count_id", helena_count_id)
          .order("user_name");

        return new Response(
          JSON.stringify({ 
            success: true, 
            synced_count: agents.length,
            members 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("[Helena Sync] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
