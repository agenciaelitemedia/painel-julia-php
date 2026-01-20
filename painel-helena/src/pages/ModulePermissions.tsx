import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Shield, Users, UserCog, Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface Client {
  id: string;
  name: string;
  email: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  client_id: string;
}

interface SystemModuleData {
  module_key: string;
  label: string;
  description: string | null;
}

export default function ModulePermissions() {
  const { isAdmin } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [availableModules, setAvailableModules] = useState<SystemModuleData[]>([]);
  const [clientPermissions, setClientPermissions] = useState<Record<string, Set<string>>>({});
  const [teamPermissions, setTeamPermissions] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Redirecionar se não for admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Buscar módulos ativos do sistema
      const { data: modulesData, error: modulesError } = await supabase
        .from('system_modules')
        .select('module_key, label, description')
        .eq('is_active', true)
        .order('display_order');

      if (modulesError) throw modulesError;
      setAvailableModules(modulesData || []);

      // Buscar clientes (only admins can access this page due to RLS)
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, email')
        .order('name');

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Buscar permissões de clientes
      const { data: clientPermsData, error: clientPermsError } = await supabase
        .from('client_permissions')
        .select('client_id, module');

      if (clientPermsError) throw clientPermsError;

      const clientPermsMap: Record<string, Set<string>> = {};
      clientsData?.forEach(client => {
        clientPermsMap[client.id] = new Set();
      });
      clientPermsData?.forEach(perm => {
        if (!clientPermsMap[perm.client_id]) {
          clientPermsMap[perm.client_id] = new Set();
        }
        clientPermsMap[perm.client_id].add(perm.module);
      });
      setClientPermissions(clientPermsMap);

      // Buscar membros de equipe
      const { data: teamData, error: teamError } = await supabase
        .from('team_members')
        .select('id, name, email, client_id')
        .order('name');

      if (teamError) throw teamError;
      setTeamMembers(teamData || []);

      // Buscar permissões de membros de equipe
      const { data: teamPermsData, error: teamPermsError } = await supabase
        .from('team_member_permissions')
        .select('team_member_id, module');

      if (teamPermsError) throw teamPermsError;

      const teamPermsMap: Record<string, Set<string>> = {};
      teamData?.forEach(member => {
        teamPermsMap[member.id] = new Set();
      });
      teamPermsData?.forEach(perm => {
        if (!teamPermsMap[perm.team_member_id]) {
          teamPermsMap[perm.team_member_id] = new Set();
        }
        teamPermsMap[perm.team_member_id].add(perm.module);
      });
      setTeamPermissions(teamPermsMap);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleClientPermissionToggle = async (clientId: string, module: string) => {
    try {
      setSaving(true);
      const currentPerms = clientPermissions[clientId] || new Set();
      const hasPermission = currentPerms.has(module);

      if (hasPermission) {
        // Remover permissão
        const { error } = await supabase
          .from('client_permissions')
          .delete()
          .eq('client_id', clientId)
          .eq('module', module as any);

        if (error) throw error;

        const newPerms = new Set(currentPerms);
        newPerms.delete(module);
        setClientPermissions({
          ...clientPermissions,
          [clientId]: newPerms,
        });
      } else {
        // Adicionar permissão
        const { error } = await supabase
          .from('client_permissions')
          .insert({ client_id: clientId, module: module as any });

        if (error) throw error;

        const newPerms = new Set(currentPerms);
        newPerms.add(module);
        setClientPermissions({
          ...clientPermissions,
          [clientId]: newPerms,
        });
      }

      toast.success('Permissão atualizada com sucesso');
    } catch (error: any) {
      console.error('Error updating permission:', error);
      toast.error('Erro ao atualizar permissão');
    } finally {
      setSaving(false);
    }
  };

  const handleTeamPermissionToggle = async (teamMemberId: string, module: string) => {
    try {
      setSaving(true);
      const currentPerms = teamPermissions[teamMemberId] || new Set();
      const hasPermission = currentPerms.has(module);

      if (hasPermission) {
        // Remover permissão
        const { error } = await supabase
          .from('team_member_permissions')
          .delete()
          .eq('team_member_id', teamMemberId)
          .eq('module', module as any);

        if (error) throw error;

        const newPerms = new Set(currentPerms);
        newPerms.delete(module);
        setTeamPermissions({
          ...teamPermissions,
          [teamMemberId]: newPerms,
        });
      } else {
        // Adicionar permissão
        const { error } = await supabase
          .from('team_member_permissions')
          .insert({ team_member_id: teamMemberId, module: module as any });

        if (error) throw error;

        const newPerms = new Set(currentPerms);
        newPerms.add(module);
        setTeamPermissions({
          ...teamPermissions,
          [teamMemberId]: newPerms,
        });
      }

      toast.success('Permissão atualizada com sucesso');
    } catch (error: any) {
      console.error('Error updating permission:', error);
      toast.error('Erro ao atualizar permissão');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Permissões</h1>
          <p className="text-muted-foreground">
            Configure quais módulos cada cliente e membro de equipe pode acessar
          </p>
        </div>
      </div>

      <Tabs defaultValue="clients" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Membros de Equipe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4 mt-6">
          {clients.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Nenhum cliente cadastrado
                </p>
              </CardContent>
            </Card>
          ) : (
            clients.map((client) => (
              <Card key={client.id}>
                <CardHeader>
                  <CardTitle>{client.name}</CardTitle>
                  <CardDescription>{client.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableModules.map((module) => (
                      <div key={module.module_key} className="flex items-start space-x-3">
                        <Checkbox
                          id={`client-${client.id}-${module.module_key}`}
                          checked={clientPermissions[client.id]?.has(module.module_key) || false}
                          onCheckedChange={() => handleClientPermissionToggle(client.id, module.module_key)}
                          disabled={saving}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={`client-${client.id}-${module.module_key}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {module.label}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {module.description || ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-4 mt-6">
          {teamMembers.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Nenhum membro de equipe cadastrado
                </p>
              </CardContent>
            </Card>
          ) : (
            teamMembers.map((member) => {
              const client = clients.find(c => c.id === member.client_id);
              return (
                <Card key={member.id}>
                  <CardHeader>
                    <CardTitle>{member.name}</CardTitle>
                    <CardDescription>
                      {member.email}
                      {client && ` • Cliente: ${client.name}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableModules.map((module) => (
                        <div key={module.module_key} className="flex items-start space-x-3">
                          <Checkbox
                            id={`team-${member.id}-${module.module_key}`}
                            checked={teamPermissions[member.id]?.has(module.module_key) || false}
                            onCheckedChange={() => handleTeamPermissionToggle(member.id, module.module_key)}
                            disabled={saving}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor={`team-${member.id}-${module.module_key}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {module.label}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              {module.description || ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
