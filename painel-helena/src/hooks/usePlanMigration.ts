import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PlanChangeType } from '@/lib/utils/plan-utils';
import { determineChangeType } from '@/lib/utils/plan-utils';

export interface MigrationValidation {
  canMigrate: boolean;
  warnings: string[];
  blockers: string[];
  changeType: PlanChangeType;
  requiresAction: boolean;
}

export interface MigrationOptions {
  effectiveDate?: Date;
  reason?: string;
  notes?: string;
  applyImmediately: boolean;
}

export function usePlanMigration() {
  const validateMigration = async (
    clientId: string,
    currentPlanId: string | null,
    newPlanId: string
  ): Promise<MigrationValidation> => {
    try {
      // Buscar dados do cliente com contagens de recursos
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select(`
          *,
          plan:subscription_plans(price, name)
        `)
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;

      // Contar recursos ativos do cliente  
      const instancesQuery = (supabase as any)
        .from('whatsapp_instances')
        .select('id', { count: 'exact' })
        .eq('client_id', clientId)
        .eq('is_active', true);
      const { count: instancesCount } = await instancesQuery;
      
      const agentsQuery = (supabase as any)
        .from('julia_agents')
        .select('id', { count: 'exact' })
        .eq('client_id', clientId)
        .eq('is_active', true);
      const { count: agentsCount } = await agentsQuery;
      
      const membersQuery = (supabase as any)
        .from('team_members')
        .select('id', { count: 'exact' })
        .eq('client_id', clientId)
        .eq('is_active', true);
      const { count: teamMembersCount } = await membersQuery;

      // Buscar dados do novo plano
      const { data: newPlan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', newPlanId)
        .single();

      if (planError) throw planError;

      const blockers: string[] = [];
      const warnings: string[] = [];

      // Validar conexões WhatsApp
      const activeConnections = instancesCount || 0;
      if (activeConnections > newPlan.max_connections) {
        blockers.push(
          `Cliente possui ${activeConnections} conexão(ões) WhatsApp ativa(s). ` +
          `Novo plano permite apenas ${newPlan.max_connections}.`
        );
      }

      // Validar agentes
      const activeAgents = agentsCount || 0;
      if (activeAgents > newPlan.max_agents) {
        blockers.push(
          `Cliente possui ${activeAgents} agente(s) ativo(s). ` +
          `Novo plano permite apenas ${newPlan.max_agents}.`
        );
      }

      // Validar membros de equipe
      const activeMembers = teamMembersCount || 0;
      if (activeMembers > newPlan.max_team_members) {
        blockers.push(
          `Cliente possui ${activeMembers} membro(s) de equipe ativo(s). ` +
          `Novo plano permite apenas ${newPlan.max_team_members}.`
        );
      }

      // Determinar tipo de mudança
      const currentPrice = client.plan?.price || 0;
      const changeType = determineChangeType(currentPrice, newPlan.price);

      // Avisos para downgrades
      if (changeType === 'downgrade') {
        warnings.push('Este é um downgrade. Verifique se o cliente está ciente da redução de recursos.');
        
        if (!newPlan.release_customization && client.release_customization) {
          warnings.push('Cliente perderá a permissão de customização de prompts.');
        }
      }

      return {
        canMigrate: blockers.length === 0,
        warnings,
        blockers,
        changeType,
        requiresAction: blockers.length > 0
      };
    } catch (error: any) {
      console.error('Error validating migration:', error);
      toast.error('Erro ao validar migração: ' + error.message);
      return {
        canMigrate: false,
        warnings: [],
        blockers: ['Erro ao validar migração'],
        changeType: 'change',
        requiresAction: true
      };
    }
  };

  const executeMigration = async (
    clientId: string,
    newPlanId: string,
    options: MigrationOptions
  ): Promise<boolean> => {
    try {
      // Buscar plano atual e novo plano
      const [clientResult, newPlanResult] = await Promise.all([
        supabase
          .from('clients')
          .select('*, plan:subscription_plans(*)')
          .eq('id', clientId)
          .single(),
        supabase
          .from('subscription_plans')
          .select('*')
          .eq('id', newPlanId)
          .single()
      ]);

      if (clientResult.error) throw clientResult.error;
      if (newPlanResult.error) throw newPlanResult.error;

      const client = clientResult.data;
      const newPlan = newPlanResult.data;

      // Preparar dados de atualização do cliente
      const updateData: any = {
        plan_id: newPlanId,
        plan_started_at: options.effectiveDate || new Date().toISOString()
      };

      // Se aplicar imediatamente, atualizar recursos
      if (options.applyImmediately) {
        updateData.max_connections = newPlan.max_connections;
        updateData.max_agents = newPlan.max_agents;
        updateData.max_julia_agents = newPlan.max_julia_agents;
        updateData.max_team_members = newPlan.max_team_members;
        updateData.release_customization = newPlan.release_customization;

        // Atualizar permissões de módulos
        const { error: deleteError } = await supabase
          .from('client_permissions')
          .delete()
          .eq('client_id', clientId);

        if (deleteError) throw deleteError;

        const modulePermissions = newPlan.enabled_modules.map((module: any) => ({
          client_id: clientId,
          module: module as any
        }));

        if (modulePermissions.length > 0) {
          const { error: insertError } = await supabase
            .from('client_permissions')
            .insert(modulePermissions);

          if (insertError) throw insertError;
        }
      }

      // Atualizar cliente (isso vai disparar o trigger que registra no histórico)
      const { error: updateError } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', clientId);

      if (updateError) throw updateError;

      // Se há motivo ou notas, atualizar o registro de histórico criado automaticamente
      if (options.reason || options.notes) {
        const { data: historyRecord } = await supabase
          .from('client_plan_history')
          .select('id')
          .eq('client_id', clientId)
          .eq('new_plan_id', newPlanId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (historyRecord) {
          await supabase
            .from('client_plan_history')
            .update({
              reason: options.reason,
              notes: options.notes
            })
            .eq('id', historyRecord.id);
        }
      }

      toast.success('Migração de plano realizada com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Error executing migration:', error);
      toast.error('Erro ao executar migração: ' + error.message);
      return false;
    }
  };

  return {
    validateMigration,
    executeMigration
  };
}
