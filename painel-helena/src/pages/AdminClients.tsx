import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { PhoneInput } from '@/components/ui/phone-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, Settings as SettingsIcon, Trash2, DollarSign, Search, Filter, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { ClientCard } from '@/components/admin/ClientCard';

interface SystemModuleData {
  module_key: string;
  label: string;
  icon_name: string | null;
}

interface Client {
  id: string;
  client_code?: string;
  name: string;
  email: string;
  cpf_cnpj?: string;
  whatsapp_phone?: string;
  max_connections: number;
  max_team_members: number;
  max_agents: number;
  max_julia_agents: number;
  max_monthly_contacts: number;
  is_active: boolean;
  created_at: string;
  julia_agent_codes?: string[];
  release_customization?: boolean;
}

export default function AdminClients() {
  const { isAdmin, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [availableModules, setAvailableModules] = useState<SystemModuleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<'clients' | 'system'>('clients');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [clientRoles, setClientRoles] = useState<Record<string, string>>({});
  const [newClient, setNewClient] = useState({
    client_code: '',
    name: '',
    email: '',
    cpf_cnpj: '',
    whatsapp_phone: '',
    max_connections: 1,
    max_team_members: 5,
    max_agents: 1,
    max_julia_agents: 1,
    max_monthly_contacts: 100,
    password: '',
    modules: [] as string[],
    julia_agent_codes: [] as string[],
    release_customization: true,
  });
  
  const [newJuliaCodeInput, setNewJuliaCodeInput] = useState('');
  const [editClient, setEditClient] = useState({
    client_code: '',
    name: '',
    email: '',
    cpf_cnpj: '',
    whatsapp_phone: '',
    max_connections: 1,
    max_team_members: 5,
    max_agents: 1,
    max_julia_agents: 1,
    max_monthly_contacts: 100,
    modules: [] as string[],
    password: '', // Nova senha (opcional)
    julia_agent_codes: [] as string[],
    release_customization: true,
  });
  
  const [juliaCodeInput, setJuliaCodeInput] = useState('');

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
      toast.error('Acesso negado. Área restrita para administradores.');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchModules();
      fetchClients();
    }
  }, [isAdmin]);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('system_modules')
        .select('module_key, label, icon_name')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setAvailableModules(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar módulos');
      console.error(error);
    }
  };

  const fetchClients = async () => {
    // Security: Only admins should call this function
    if (!isAdmin) {
      console.warn('Unauthorized attempt to fetch all clients');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);

      // Buscar roles dos clientes
      if (data && data.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('client_id, id')
          .in('client_id', data.map(c => c.id));

        if (usersData) {
          const userIds = usersData.map(u => u.id);
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('user_id, role')
            .in('user_id', userIds);

          const rolesMap: Record<string, string> = {};
          usersData.forEach(user => {
            const userRole = rolesData?.find(r => r.user_id === user.id);
            rolesMap[user.client_id] = userRole?.role || 'user';
          });
          setClientRoles(rolesMap);
        }
      }
    } catch (error: any) {
      toast.error('Erro ao carregar clientes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar módulos antes de enviar
      const validModuleKeys = availableModules.map(m => m.module_key);
      const invalidModules = newClient.modules.filter(m => !validModuleKeys.includes(m));
      
      if (invalidModules.length > 0) {
        toast.error(`Módulos inválidos detectados: ${invalidModules.join(', ')}`);
        setLoading(false);
        return;
      }

      // Chamar edge function para criar cliente sem fazer login automático
      const { data, error } = await supabase.functions.invoke('create-client', {
        body: {
          client_code: newClient.client_code || null,
          name: newClient.name,
          email: newClient.email,
          cpf_cnpj: newClient.cpf_cnpj || null,
          whatsapp_phone: newClient.whatsapp_phone || null,
          max_connections: newClient.max_connections,
          max_team_members: newClient.max_team_members,
          max_agents: newClient.max_agents,
          max_julia_agents: newClient.max_julia_agents,
          max_monthly_contacts: newClient.max_monthly_contacts,
          password: newClient.password,
          modules: newClient.modules,
          julia_agent_codes: newClient.julia_agent_codes,
          release_customization: newClient.release_customization,
        },
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar cliente');
      }

      toast.success('Cliente criado com sucesso!');
      setShowDialog(false);
      setNewClient({ 
        client_code: '',
        name: '', 
        email: '', 
        cpf_cnpj: '',
        whatsapp_phone: '',
        max_connections: 1,
        max_team_members: 5,
        max_agents: 1,
        max_julia_agents: 1,
        max_monthly_contacts: 100,
        password: '',
        modules: [],
        julia_agent_codes: [],
        release_customization: true
      });
      setNewJuliaCodeInput('');
      fetchClients();
    } catch (error: any) {
      console.error('Erro detalhado ao criar cliente:', error);
      toast.error(`Erro ao criar cliente: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleClientStatus = async (clientId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: !currentStatus })
        .eq('id', clientId);

      if (error) throw error;

      toast.success(`Cliente ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`);
      fetchClients();
    } catch (error: any) {
      toast.error('Erro ao atualizar status do cliente');
      console.error(error);
    }
  };

  const handleEditClient = async (client: Client) => {
    setSelectedClient(client);
    
    // Load client permissions
    const { data: permissions } = await supabase
      .from('client_permissions')
      .select('module')
      .eq('client_id', client.id);
    
    setEditClient({
      client_code: client.client_code || '',
      name: client.name,
      email: client.email,
      cpf_cnpj: client.cpf_cnpj || '',
      whatsapp_phone: client.whatsapp_phone || '',
      max_connections: client.max_connections,
      max_team_members: client.max_team_members,
      max_agents: client.max_agents,
      max_julia_agents: client.max_julia_agents,
      max_monthly_contacts: client.max_monthly_contacts,
      modules: permissions?.map(p => p.module) || [],
      password: '', // Limpar campo de senha
      julia_agent_codes: client.julia_agent_codes || [],
      release_customization: client.release_customization ?? true
    });
    setJuliaCodeInput('');
    setShowEditDialog(true);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    setLoading(true);
    try {
      // Validar módulos antes de enviar
      const validModuleKeys = availableModules.map(m => m.module_key);
      const invalidModules = editClient.modules.filter(m => !validModuleKeys.includes(m));
      
      if (invalidModules.length > 0) {
        toast.error(`Módulos inválidos detectados: ${invalidModules.join(', ')}`);
        setLoading(false);
        return;
      }

      // 1. Update client data
      const { error } = await supabase
        .from('clients')
        .update({
          client_code: editClient.client_code || null,
          name: editClient.name,
          email: editClient.email,
          cpf_cnpj: editClient.cpf_cnpj || null,
          whatsapp_phone: editClient.whatsapp_phone || null,
          max_connections: editClient.max_connections,
          max_team_members: editClient.max_team_members,
          max_agents: editClient.max_agents,
          max_julia_agents: editClient.max_julia_agents,
          max_monthly_contacts: editClient.max_monthly_contacts,
          julia_agent_codes: editClient.julia_agent_codes,
          release_customization: editClient.release_customization,
        })
        .eq('id', selectedClient.id);

      if (error) throw error;

      // 2. Update permissions: delete all and re-insert
      const { error: deleteError } = await supabase
        .from('client_permissions')
        .delete()
        .eq('client_id', selectedClient.id);
      
      if (deleteError) {
        console.error('Erro ao deletar permissões antigas:', deleteError);
        throw deleteError;
      }

      if (editClient.modules.length > 0) {
        const permissions = editClient.modules.map(module => ({
          client_id: selectedClient.id,
          module: module as any,
        }));

        const { error: permError } = await supabase
          .from('client_permissions')
          .insert(permissions);

        if (permError) {
          console.error('Erro ao inserir novas permissões:', permError);
          throw permError;
        }
      }

      // 3. Update password if provided
      if (editClient.password && editClient.password.length >= 6) {
        // Get user_id from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('client_id', selectedClient.id)
          .single();

        if (userError) throw userError;

        if (userData) {
          // Update password using admin API
          const { error: passwordError } = await supabase.auth.admin.updateUserById(
            userData.id,
            { password: editClient.password }
          );

          if (passwordError) throw passwordError;
        }
      }

      toast.success('Cliente atualizado com sucesso!');
      setShowEditDialog(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error: any) {
      console.error('Erro detalhado ao atualizar cliente:', error);
      toast.error(`Erro ao atualizar cliente: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (client: Client) => {
    // Bloquear exclusão do próprio usuário
    if (profile?.client_id === client.id) {
      toast.error('Você não pode excluir seu próprio cadastro!');
      return;
    }

    // Bloquear exclusão de clientes admin
    const clientRole = clientRoles[client.id];
    if (clientRole === 'admin') {
      toast.error('Não é permitido excluir cadastros de administradores do sistema!');
      return;
    }

    setSelectedClient(client);
    setShowDeleteDialog(true);
  };

  const confirmDeleteClient = async () => {
    if (!selectedClient) return;

    setLoading(true);
    try {
      // Primeiro, buscar o user_id associado ao cliente
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('client_id', selectedClient.id)
        .maybeSingle();

      if (userError) {
        console.error('Erro ao buscar usuário do cliente:', userError);
      }

      // Se encontrou o usuário, tentar deletar do auth (não bloqueia se falhar)
      if (userData?.id) {
        console.log('Tentando deletar usuário do auth:', userData.id);
        const { data: deleteUserData, error: deleteUserError } = await supabase.functions.invoke('delete-auth-user', {
          body: { user_id: userData.id }
        });

        if (deleteUserError || (deleteUserData && !deleteUserData.success)) {
          console.warn('Aviso ao deletar usuário do auth (continuando):', deleteUserError || deleteUserData?.error);
          // Continua mesmo se falhar (usuário pode já ter sido deletado)
        } else {
          console.log('Usuário deletado do auth com sucesso');
        }
      }

      // Deletar o cliente (cascade irá deletar registros relacionados incluindo users e user_roles)
      const { error: clientDeleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', selectedClient.id);

      if (clientDeleteError) throw clientDeleteError;

      toast.success('Cliente excluído com sucesso!');
      setShowDeleteDialog(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error: any) {
      toast.error(`Erro ao excluir cliente: ${error.message || 'Erro desconhecido'}`);
      console.error('Erro detalhado ao excluir cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar clientes baseado na aba ativa, busca e filtros
  const filteredClients = clients.filter(client => {
    const role = clientRoles[client.id] || 'user';
    
    // Filtro por aba (tipo de cadastro)
    if (activeTab === 'system' && role !== 'admin') return false;
    if (activeTab === 'clients' && role === 'admin') return false;

    // Filtro por status
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && !client.is_active) return false;
      if (statusFilter === 'inactive' && client.is_active) return false;
    }

    // Filtro por busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        client.name.toLowerCase().includes(search) ||
        client.email.toLowerCase().includes(search) ||
        client.client_code?.toLowerCase().includes(search) ||
        client.cpf_cnpj?.toLowerCase().includes(search)
      );
    }

    return true;
  });

  if (authLoading || !isAdmin) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Cadastros</h1>
          <p className="text-muted-foreground">
            Gerencie clientes e administradores do sistema
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cadastro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Cliente</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo cliente no sistema
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateClient} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_code">Código do Cliente</Label>
                  <Input
                    id="client_code"
                    value={newClient.client_code}
                    onChange={(e) => setNewClient({ ...newClient, client_code: e.target.value })}
                    maxLength={20}
                    placeholder="Opcional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                  <Input
                    id="cpf_cnpj"
                    value={newClient.cpf_cnpj}
                    onChange={(e) => setNewClient({ ...newClient, cpf_cnpj: e.target.value })}
                    maxLength={20}
                    placeholder="Opcional"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Cliente</Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  required
                />
              </div>
              
              <PhoneInput
                id="whatsapp-phone"
                label="WhatsApp para Notificações"
                value={newClient.whatsapp_phone}
                onChange={(value) => setNewClient({ ...newClient, whatsapp_phone: value })}
              />
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha Inicial</Label>
                <Input
                  id="password"
                  type="password"
                  value={newClient.password}
                  onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_connections">Nº Conexões</Label>
                  <Input
                    id="max_connections"
                    type="number"
                    min="1"
                    max="99"
                    value={newClient.max_connections}
                    onChange={(e) => setNewClient({ ...newClient, max_connections: parseInt(e.target.value) })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_team_members">Nº Membros</Label>
                  <Input
                    id="max_team_members"
                    type="number"
                    min="0"
                    max="99"
                    value={newClient.max_team_members}
                    onChange={(e) => setNewClient({ ...newClient, max_team_members: parseInt(e.target.value) })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_agents">Nº Agentes</Label>
                  <Input
                    id="max_agents"
                    type="number"
                    min="0"
                    max="99"
                    value={newClient.max_agents}
                    onChange={(e) => {
                      const newMaxAgents = parseInt(e.target.value);
                      setNewClient({ 
                        ...newClient, 
                        max_agents: newMaxAgents,
                        max_julia_agents: Math.min(newClient.max_julia_agents, newMaxAgents)
                      });
                    }}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_julia_agents">Nº Julias</Label>
                  <Input
                    id="max_julia_agents"
                    type="number"
                    min="0"
                    max={newClient.max_agents}
                    value={newClient.max_julia_agents}
                    onChange={(e) => setNewClient({ ...newClient, max_julia_agents: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_monthly_contacts">Nº Contatos (novos por mês)</Label>
                <Input
                  id="max_monthly_contacts"
                  type="number"
                  min="0"
                  max="9999"
                  value={newClient.max_monthly_contacts}
                  onChange={(e) => setNewClient({ ...newClient, max_monthly_contacts: parseInt(e.target.value) })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="julia-codes">Códigos de Agentes Julia</Label>
                <div className="space-y-2">
                  <Input
                    id="julia-codes"
                    type="text"
                    placeholder="Ex: 20250001 (pressione Enter para adicionar)"
                    value={newJuliaCodeInput}
                    onChange={(e) => setNewJuliaCodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const code = newJuliaCodeInput.trim();
                        if (code && /^\d{8}$/.test(code)) {
                          if (!newClient.julia_agent_codes.includes(code)) {
                            setNewClient({
                              ...newClient,
                              julia_agent_codes: [...newClient.julia_agent_codes, code]
                            });
                            setNewJuliaCodeInput('');
                          } else {
                            toast.error('Código já adicionado');
                          }
                        } else {
                          toast.error('Código deve ter 8 dígitos');
                        }
                      }
                    }}
                  />
                  {newClient.julia_agent_codes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newClient.julia_agent_codes.map((code) => (
                        <Badge key={code} variant="secondary" className="gap-1">
                          {code}
                          <button
                            type="button"
                            onClick={() => {
                              setNewClient({
                                ...newClient,
                                julia_agent_codes: newClient.julia_agent_codes.filter(c => c !== code)
                              });
                            }}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between py-3 px-4 rounded-lg border bg-card">
                <div>
                  <Label htmlFor="release-customization">Permitir Customização de Prompt</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Habilita edição do prompt principal para agentes IA custom
                  </p>
                </div>
                <Switch
                  id="release-customization"
                  checked={newClient.release_customization}
                  onCheckedChange={(checked) => setNewClient({ ...newClient, release_customization: checked })}
                />
              </div>
              
              <div className="space-y-3">
                <Label>Módulos Permitidos</Label>
                <div className="grid grid-cols-2 gap-3">
                  {availableModules.map((module) => {
                    const IconComponent = module.icon_name && (LucideIcons as any)[module.icon_name];
                    const Icon = IconComponent || LucideIcons.Package;
                    return (
                      <div key={module.module_key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`new-${module.module_key}`}
                          checked={newClient.modules.includes(module.module_key)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewClient({
                                ...newClient,
                                modules: [...newClient.modules, module.module_key]
                              });
                            } else {
                              setNewClient({
                                ...newClient,
                                modules: newClient.modules.filter(m => m !== module.module_key)
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
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Cliente'}
                </Button>
              <Button type="button" variant="outline" onClick={() => {
                setShowDialog(false);
                setNewClient({ 
                  client_code: '',
                  name: '', 
                  email: '', 
                  cpf_cnpj: '',
                  whatsapp_phone: '',
                  max_connections: 1,
                  max_team_members: 5,
                  max_agents: 1,
                  max_julia_agents: 1,
                  max_monthly_contacts: 100,
                  password: '',
                  modules: [],
                  julia_agent_codes: [],
                  release_customization: true
                });
                setNewJuliaCodeInput('');
              }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'clients' | 'system')} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="clients" className="gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Shield className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* Filtros e Busca */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, código ou CPF/CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="clients" className="space-y-4">
          {filteredClients.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Nenhum cliente encontrado com os filtros aplicados'
                    : 'Nenhum cliente cadastrado'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map((client) => (
                <ClientCard 
                  key={client.id}
                  client={client}
                  clientRole={clientRoles[client.id]}
                  currentUserId={profile?.client_id}
                  onToggleStatus={toggleClientStatus}
                  onEdit={handleEditClient}
                  onDelete={handleDeleteClient}
                  onNavigateBilling={(id) => navigate(`/admin/clients/${id}/billing`)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          {filteredClients.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Nenhum administrador encontrado com os filtros aplicados'
                    : 'Nenhum administrador cadastrado'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map((client) => (
                <ClientCard 
                  key={client.id}
                  client={client}
                  clientRole={clientRoles[client.id]}
                  currentUserId={profile?.client_id}
                  onToggleStatus={toggleClientStatus}
                  onEdit={handleEditClient}
                  onDelete={handleDeleteClient}
                  onNavigateBilling={(id) => navigate(`/admin/clients/${id}/billing`)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Client Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Atualize as informações do cliente
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateClient} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-client-code">Código do Cliente</Label>
                <Input
                  id="edit-client-code"
                  value={editClient.client_code}
                  onChange={(e) => setEditClient({ ...editClient, client_code: e.target.value })}
                  maxLength={20}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cpf-cnpj">CPF/CNPJ</Label>
                <Input
                  id="edit-cpf-cnpj"
                  value={editClient.cpf_cnpj}
                  onChange={(e) => setEditClient({ ...editClient, cpf_cnpj: e.target.value })}
                  maxLength={20}
                  placeholder="Opcional"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do Cliente</Label>
              <Input
                id="edit-name"
                value={editClient.name}
                onChange={(e) => setEditClient({ ...editClient, name: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editClient.email}
                onChange={(e) => setEditClient({ ...editClient, email: e.target.value })}
                disabled
                className="bg-muted cursor-not-allowed"
                required
              />
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado pois é usado para login no sistema
              </p>
            </div>
            
            <PhoneInput
              id="edit-whatsapp-phone"
              label="WhatsApp para Notificações"
              value={editClient.whatsapp_phone}
              onChange={(value) => setEditClient({ ...editClient, whatsapp_phone: value })}
            />
            
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nova Senha (opcional)</Label>
              <Input
                id="edit-password"
                type="password"
                value={editClient.password}
                onChange={(e) => setEditClient({ ...editClient, password: e.target.value })}
                minLength={8}
                placeholder="Deixe em branco para manter a senha atual"
              />
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-max-connections">Nº Conexões</Label>
                <Input
                  id="edit-max-connections"
                  type="number"
                  min="1"
                  max="99"
                  value={editClient.max_connections}
                  onChange={(e) => setEditClient({ ...editClient, max_connections: parseInt(e.target.value) })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-max-team-members">Nº Membros</Label>
                <Input
                  id="edit-max-team-members"
                  type="number"
                  min="0"
                  max="99"
                  value={editClient.max_team_members}
                  onChange={(e) => setEditClient({ ...editClient, max_team_members: parseInt(e.target.value) })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-max-agents">Nº Agentes</Label>
                <Input
                  id="edit-max-agents"
                  type="number"
                  min="0"
                  max="99"
                  value={editClient.max_agents}
                  onChange={(e) => {
                    const newMaxAgents = parseInt(e.target.value);
                    setEditClient({ 
                      ...editClient, 
                      max_agents: newMaxAgents,
                      max_julia_agents: Math.min(editClient.max_julia_agents, newMaxAgents)
                    });
                  }}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-max-julia-agents">Nº Julias</Label>
                <Input
                  id="edit-max-julia-agents"
                  type="number"
                  min="0"
                  max={editClient.max_agents}
                  value={editClient.max_julia_agents}
                  onChange={(e) => setEditClient({ ...editClient, max_julia_agents: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-max-monthly-contacts">Nº Contatos (novos por mês)</Label>
              <Input
                id="edit-max-monthly-contacts"
                type="number"
                min="0"
                max="9999"
                value={editClient.max_monthly_contacts}
                onChange={(e) => setEditClient({ ...editClient, max_monthly_contacts: parseInt(e.target.value) })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-julia-codes">Códigos de Agentes Julia</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="edit-julia-codes"
                    type="text"
                    placeholder="Ex: 20250001"
                    value={juliaCodeInput}
                    onChange={(e) => setJuliaCodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const code = juliaCodeInput.trim();
                        if (code && /^\d{8}$/.test(code)) {
                          if (!editClient.julia_agent_codes.includes(code)) {
                            setEditClient({
                              ...editClient,
                              julia_agent_codes: [...editClient.julia_agent_codes, code]
                            });
                            setJuliaCodeInput('');
                          } else {
                            toast.error('Código já adicionado');
                          }
                        } else {
                          toast.error('Código deve ter 8 dígitos');
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const code = juliaCodeInput.trim();
                      if (code && /^\d{8}$/.test(code)) {
                        if (!editClient.julia_agent_codes.includes(code)) {
                          setEditClient({
                            ...editClient,
                            julia_agent_codes: [...editClient.julia_agent_codes, code]
                          });
                          setJuliaCodeInput('');
                        } else {
                          toast.error('Código já adicionado');
                        }
                      } else {
                        toast.error('Código deve ter 8 dígitos');
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {editClient.julia_agent_codes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editClient.julia_agent_codes.map((code) => (
                      <Badge key={code} variant="secondary" className="gap-1">
                        {code}
                        <button
                          type="button"
                          onClick={() => {
                            setEditClient({
                              ...editClient,
                              julia_agent_codes: editClient.julia_agent_codes.filter(c => c !== code)
                            });
                          }}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between py-3 px-4 rounded-lg border bg-card">
              <div>
                <Label htmlFor="edit-release-customization">Permitir Customização de Prompt</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Habilita edição do prompt principal para agentes IA custom
                </p>
              </div>
              <Switch
                id="edit-release-customization"
                checked={editClient.release_customization}
                onCheckedChange={(checked) => setEditClient({ ...editClient, release_customization: checked })}
              />
            </div>
            
            <div className="space-y-3">
              <Label>Módulos Permitidos</Label>
              <div className="grid grid-cols-2 gap-3">
                {availableModules.map((module) => {
                  const IconComponent = module.icon_name && (LucideIcons as any)[module.icon_name];
                  const Icon = IconComponent || LucideIcons.Package;
                  return (
                    <div key={module.module_key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${module.module_key}`}
                        checked={editClient.modules.includes(module.module_key)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditClient({
                              ...editClient,
                              modules: [...editClient.modules, module.module_key]
                            });
                          } else {
                            setEditClient({
                              ...editClient,
                              modules: editClient.modules.filter(m => m !== module.module_key)
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

      {/* Delete Client Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente <strong>{selectedClient?.name}</strong>?
              Esta ação não pode ser desfeita e irá remover o usuário, todas as conexões WhatsApp e dados relacionados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteClient}
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