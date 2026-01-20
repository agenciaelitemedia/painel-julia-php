import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, UserPlus, Settings as SettingsIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import * as LucideIcons from 'lucide-react';
import { z } from 'zod';

interface SystemModuleData {
  module_key: string;
  label: string;
  icon_name: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  user_id: string;
  created_at: string;
}

// Input validation schemas
const teamMemberSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72, 'Password must be less than 72 characters'),
});

const updateMemberSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72, 'Password must be less than 72 characters').optional().or(z.literal('')),
});

export default function Team() {
  const { profile, isAdmin } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [clientModules, setClientModules] = useState<string[]>([]);
  const [availableModules, setAvailableModules] = useState<SystemModuleData[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    password: '',
    modules: [] as string[],
  });
  const [editMember, setEditMember] = useState({
    name: '',
    email: '',
    password: '',
    modules: [] as string[],
  });

  useEffect(() => {
    if (profile?.client_id || isAdmin) {
      fetchModules();
      if (!isAdmin) {
        loadClientModules();
      }
      loadTeamMembers();
    }
  }, [profile?.client_id, isAdmin]);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('system_modules')
        .select('module_key, label, icon_name')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      // Se for cliente, filtrar pelos módulos que ele tem permissão
      if (!isAdmin && profile?.client_id) {
        const { data: clientPerms, error: permsError } = await supabase
          .from('client_permissions')
          .select('module')
          .eq('client_id', profile.client_id);
        
        if (permsError) throw permsError;
        
        const allowedModules = clientPerms?.map(p => p.module as string) || [];
        setAvailableModules((data || []).filter(m => allowedModules.includes(m.module_key)));
      } else {
        // Admin vê todos os módulos
        setAvailableModules(data || []);
      }
    } catch (error: any) {
      toast.error('Erro ao carregar módulos');
      console.error(error);
    }
  };

  const loadClientModules = async () => {
    if (!profile?.client_id) return;

    try {
      const { data, error } = await supabase
        .from('client_permissions')
        .select('module')
        .eq('client_id', profile.client_id);

      if (error) throw error;
      setClientModules(data?.map(p => p.module as string) || []);
    } catch (error: any) {
      toast.error('Erro ao carregar permissões');
      console.error(error);
    }
  };

  const loadTeamMembers = async () => {
    try {
      let query = supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });

      // Se não for admin, filtrar pelo client_id
      if (!isAdmin && profile?.client_id) {
        query = query.eq('client_id', profile.client_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar equipe');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const validation = teamMemberSchema.safeParse({
      name: newMember.name,
      email: newMember.email,
      password: newMember.password,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    
    // Para cliente, sempre usa o client_id do profile
    const targetClientId = profile?.client_id;

    setLoading(true);
    try {
      // Chamar Edge Function para criar usuário sem fazer logout
      const { data, error } = await supabase.functions.invoke('create-team-member', {
        body: {
          email: newMember.email,
          password: newMember.password,
          name: newMember.name,
          client_id: targetClientId,
          modules: newMember.modules,
        },
      });

      // Se houver erro de rede ou comunicação
      if (error) {
        console.error('Network/communication error:', error);
        throw new Error('Erro ao comunicar com o servidor');
      }

      // Se a resposta contém um erro da função
      if (data?.error) {
        console.error('Function returned error:', data.error);
        throw new Error(data.error);
      }

      // Se não há indicação de sucesso
      if (!data?.success) {
        console.error('Unexpected response:', data);
        throw new Error('Erro ao criar membro da equipe');
      }

      toast.success('Membro da equipe criado com sucesso!');
      setShowDialog(false);
      setNewMember({ name: '', email: '', password: '', modules: [] });
      loadTeamMembers();
    } catch (error: any) {
      console.error('Error creating team member:', error);
      toast.error(error.message || 'Erro ao criar membro da equipe');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMember = async (member: TeamMember) => {
    setSelectedMember(member);
    
    // Load member permissions
    const { data: permissions } = await supabase
      .from('team_member_permissions')
      .select('module')
      .eq('team_member_id', member.id);
    
    setEditMember({
      name: member.name,
      email: member.email,
      password: '',
      modules: permissions?.map(p => p.module) || [],
    });
    setShowEditDialog(true);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    // Validate input
    const validation = updateMemberSchema.safeParse({
      name: editMember.name,
      email: editMember.email,
      password: editMember.password || '',
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      // 1. Update password if provided
      if (editMember.password && editMember.password.trim() !== '') {
        const { data: passwordData, error: passwordError } = await supabase.functions.invoke('update-user-password', {
          body: {
            user_id: selectedMember.user_id,
            new_password: editMember.password,
          },
        });

        if (passwordError) {
          console.error('Network/communication error:', passwordError);
          throw new Error('Erro ao comunicar com o servidor');
        }

        if (passwordData?.error) {
          console.error('Function returned error:', passwordData.error);
          throw new Error(passwordData.error);
        }

        if (!passwordData?.success) {
          console.error('Unexpected response:', passwordData);
          throw new Error('Erro ao atualizar senha');
        }
      }

      // 2. Update team member data
      const { error } = await supabase
        .from('team_members')
        .update({
          name: editMember.name,
          email: editMember.email,
        })
        .eq('id', selectedMember.id);

      if (error) throw error;

      // 3. Update permissions: delete all and re-insert
      await supabase
        .from('team_member_permissions')
        .delete()
        .eq('team_member_id', selectedMember.id);

      if (editMember.modules.length > 0) {
        const permissions = editMember.modules.map(module => ({
          team_member_id: selectedMember.id,
          module: module as any,
        }));

        const { error: permError } = await supabase
          .from('team_member_permissions')
          .insert(permissions);

        if (permError) throw permError;
      }

      toast.success('Membro atualizado com sucesso!');
      setShowEditDialog(false);
      setSelectedMember(null);
      loadTeamMembers();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar membro');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMemberStatus = async (memberId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: !currentStatus })
        .eq('id', memberId);

      if (error) throw error;

      toast.success(`Membro ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`);
      loadTeamMembers();
    } catch (error: any) {
      toast.error('Erro ao atualizar status do membro');
      console.error(error);
    }
  };

  const handleDeleteMember = (member: TeamMember) => {
    setSelectedMember(member);
    setShowDeleteDialog(true);
  };

  const confirmDeleteMember = async () => {
    if (!selectedMember) return;

    setLoading(true);
    try {
      // Primeiro, deletar o usuário do Supabase Auth
      const { data: deleteUserData, error: deleteUserError } = await supabase.functions.invoke('delete-auth-user', {
        body: { user_id: selectedMember.user_id }
      });

      if (deleteUserError || (deleteUserData && !deleteUserData.success)) {
        console.error('Erro ao deletar usuário do auth:', deleteUserError || deleteUserData?.error);
        toast.error('Erro ao excluir usuário do sistema');
        return;
      }

      // Depois deletar o registro de team_member
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', selectedMember.id);

      if (error) throw error;

      toast.success('Membro excluído com sucesso!');
      setShowDeleteDialog(false);
      setSelectedMember(null);
      loadTeamMembers();
    } catch (error: any) {
      toast.error('Erro ao excluir membro');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Determinar módulos disponíveis baseado no contexto
  // Admin: todos os módulos do sistema
  // Cliente: apenas módulos do sistema que o cliente tem permissão

  if (loading && teamMembers.length === 0) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Equipe</h1>
          <p className="text-muted-foreground">
            Adicione e gerencie os membros da sua equipe
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Membro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Membro da Equipe</DialogTitle>
              <DialogDescription>
                Crie uma conta para um novo membro da equipe
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateMember} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha Inicial</Label>
                <Input
                  id="password"
                  type="password"
                  value={newMember.password}
                  onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              
              <div className="space-y-3">
                <Label>Permissões de Acesso</Label>
                {isAdmin && (
                  <div className="mb-3 p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
                      <strong>Admin:</strong> Todos os módulos disponíveis (exceto Gerenciar Equipe)
                    </p>
                  </div>
                )}
                {availableModules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum módulo disponível. Entre em contato com o administrador.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {availableModules.map((module) => {
                      const IconComponent = module.icon_name && (LucideIcons as any)[module.icon_name];
                      const Icon = IconComponent || LucideIcons.Package;
                      return (
                        <div key={module.module_key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`new-${module.module_key}`}
                            checked={newMember.modules.includes(module.module_key)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewMember({
                                  ...newMember,
                                  modules: [...newMember.modules, module.module_key]
                                });
                              } else {
                                setNewMember({
                                  ...newMember,
                                  modules: newMember.modules.filter(m => m !== module.module_key)
                                });
                              }
                            }}
                          />
                          <Label 
                            htmlFor={`new-${module.module_key}`} 
                            className="flex items-center gap-2 cursor-pointer font-normal"
                          >
                            <Icon className="h-4 w-4" />
                            {module.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={loading || availableModules.length === 0}>
                  {loading ? 'Criando...' : 'Criar Membro'}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowDialog(false);
                  setNewMember({ name: '', email: '', password: '', modules: [] });
                }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teamMembers.map((member) => (
          <Card key={member.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <CardDescription>{member.email}</CardDescription>
                  </div>
                </div>
                <Badge variant={member.is_active ? "default" : "secondary"}>
                  {member.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleMemberStatus(member.id, member.is_active)}
                  className="flex-1"
                >
                  {member.is_active ? 'Desativar' : 'Ativar'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleEditMember(member)}
                  className="flex-1"
                >
                  <SettingsIcon className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteMember(member)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Member Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Membro</DialogTitle>
            <DialogDescription>
              Atualize as informações e permissões do membro
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateMember} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome Completo</Label>
              <Input
                id="edit-name"
                value={editMember.name}
                onChange={(e) => setEditMember({ ...editMember, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editMember.email}
                onChange={(e) => setEditMember({ ...editMember, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nova Senha (deixe em branco para não alterar)</Label>
              <Input
                id="edit-password"
                type="password"
                value={editMember.password}
                onChange={(e) => setEditMember({ ...editMember, password: e.target.value })}
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            
            <div className="space-y-3">
              <Label>Permissões de Acesso</Label>
              <div className="grid grid-cols-2 gap-3">
                {availableModules.map((module) => {
                  const IconComponent = module.icon_name && (LucideIcons as any)[module.icon_name];
                  const Icon = IconComponent || LucideIcons.Package;
                  return (
                    <div key={module.module_key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${module.module_key}`}
                        checked={editMember.modules.includes(module.module_key)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditMember({
                              ...editMember,
                              modules: [...editMember.modules, module.module_key]
                            });
                          } else {
                            setEditMember({
                              ...editMember,
                              modules: editMember.modules.filter(m => m !== module.module_key)
                            });
                          }
                        }}
                      />
                      <Label 
                        htmlFor={`edit-${module.module_key}`} 
                        className="flex items-center gap-2 cursor-pointer font-normal"
                      >
                        <Icon className="h-4 w-4" />
                        {module.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Atualizando...' : 'Atualizar'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Member Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{selectedMember?.name}</strong> da equipe?
              Esta ação não pode ser desfeita e irá excluir o usuário do sistema permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}