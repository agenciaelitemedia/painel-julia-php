import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Loader2, Package } from 'lucide-react';
import { PlanCard } from '@/components/admin/PlanCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CreatePlanData } from '@/hooks/useSubscriptionPlans';

interface SystemModule {
  id: string;
  label: string;
  module_key: string;
  is_active: boolean;
}

export default function AdminPlans() {
  const { profile, loading: authLoading } = useAuth();
  const { plans, loading, createPlan, updatePlan, deletePlan } = useSubscriptionPlans();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [formData, setFormData] = useState<CreatePlanData>({
    name: '',
    description: '',
    price: 0,
    billing_cycle: 'monthly',
    max_connections: 1,
    max_agents: 1,
    max_julia_agents: 1,
    max_team_members: 5,
    max_monthly_contacts: 100,
    release_customization: true,
    enabled_modules: [],
    is_active: true,
    is_featured: false,
    display_order: 0,
    setup_fee: 0,
    trial_days: 0,
    more_info: ''
  });

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    const { data } = await supabase
      .from('system_modules')
      .select('id, label, module_key, is_active')
      .eq('is_active', true)
      .order('label');
    
    if (data) setModules(data);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/welcome" replace />;
  }

  const handleCreate = async () => {
    const result = await createPlan(formData);
    if (result) {
      setCreateDialogOpen(false);
      resetForm();
    }
  };

  const handleEdit = async () => {
    if (!selectedPlanId) return;
    const success = await updatePlan(selectedPlanId, formData, false);
    if (success) {
      setEditDialogOpen(false);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!selectedPlanId) return;
    const success = await deletePlan(selectedPlanId);
    if (success) {
      setDeleteDialogOpen(false);
      setSelectedPlanId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      billing_cycle: 'monthly',
      max_connections: 1,
      max_agents: 1,
      max_julia_agents: 1,
      max_team_members: 5,
      max_monthly_contacts: 100,
      release_customization: true,
      enabled_modules: [],
      is_active: true,
      is_featured: false,
      display_order: 0,
      setup_fee: 0,
      trial_days: 0,
      more_info: ''
    });
    setSelectedPlanId(null);
  };

  const openEditDialog = (plan: any) => {
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      billing_cycle: plan.billing_cycle,
      custom_cycle_days: plan.custom_cycle_days,
      max_connections: plan.max_connections,
      max_agents: plan.max_agents,
      max_julia_agents: plan.max_julia_agents,
      max_team_members: plan.max_team_members,
      max_monthly_contacts: plan.max_monthly_contacts || 100,
      release_customization: plan.release_customization,
      enabled_modules: plan.enabled_modules,
      is_active: plan.is_active,
      is_featured: plan.is_featured,
      display_order: plan.display_order,
      setup_fee: plan.setup_fee || 0,
      trial_days: plan.trial_days || 0,
      more_info: plan.more_info || ''
    });
    setSelectedPlanId(plan.id);
    setEditDialogOpen(true);
  };

  const renderForm = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Nome do Plano</Label>
          <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div className="col-span-2">
          <Label>Descrição</Label>
          <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} />
        </div>
        <div>
          <Label>Preço (R$)</Label>
          <Input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} />
        </div>
        <div>
          <Label>Ordem de Exibição</Label>
          <Input type="number" value={formData.display_order || 0} onChange={e => setFormData({...formData, display_order: parseInt(e.target.value) || 0})} />
        </div>
        <div>
          <Label>Ciclo de Cobrança</Label>
          <Select value={formData.billing_cycle} onValueChange={value => setFormData({...formData, billing_cycle: value as any})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="quarterly">Trimestral</SelectItem>
              <SelectItem value="semiannual">Semestral</SelectItem>
              <SelectItem value="annual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Conexões WhatsApp</Label><Input type="number" value={formData.max_connections} onChange={e => setFormData({...formData, max_connections: parseInt(e.target.value) || 1})} /></div>
        <div><Label>Assistentes IA</Label><Input type="number" value={formData.max_agents} onChange={e => setFormData({...formData, max_agents: parseInt(e.target.value) || 1})} /></div>
        <div><Label>Agentes Julia</Label><Input type="number" value={formData.max_julia_agents} onChange={e => setFormData({...formData, max_julia_agents: parseInt(e.target.value) || 0})} /></div>
        <div><Label>Membros de Equipe</Label><Input type="number" value={formData.max_team_members} onChange={e => setFormData({...formData, max_team_members: parseInt(e.target.value) || 5})} /></div>
        <div><Label>Nº Contatos/mês</Label><Input type="number" value={formData.max_monthly_contacts} onChange={e => setFormData({...formData, max_monthly_contacts: parseInt(e.target.value) || 100})} /></div>
        <div><Label>Taxa de Setup (R$)</Label><Input type="number" step="0.01" value={formData.setup_fee} onChange={e => setFormData({...formData, setup_fee: parseFloat(e.target.value) || 0})} /></div>
        <div><Label>Dias de Trial</Label><Input type="number" value={formData.trial_days} onChange={e => setFormData({...formData, trial_days: parseInt(e.target.value) || 0})} /></div>
      </div>
      <div className="col-span-2">
        <Label>Mais Informações (HTML)</Label>
        <Textarea 
          value={formData.more_info} 
          onChange={e => setFormData({...formData, more_info: e.target.value})} 
          rows={4}
          placeholder="<p>Informações adicionais em HTML...</p>"
        />
        <p className="text-xs text-muted-foreground mt-1">Este conteúdo aparecerá na landing page ao expandir "Mais Informações"</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2"><Switch checked={formData.release_customization} onCheckedChange={c => setFormData({...formData, release_customization: c})} /><Label>Customização de Prompt</Label></div>
        <div className="flex items-center gap-2"><Switch checked={formData.is_active} onCheckedChange={c => setFormData({...formData, is_active: c})} /><Label>Ativo</Label></div>
        <div className="flex items-center gap-2"><Switch checked={formData.is_featured} onCheckedChange={c => setFormData({...formData, is_featured: c})} /><Label>Destaque</Label></div>
      </div>
      <div><Label>Módulos Habilitados</Label>
        <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded p-2">
          {modules.map(module => (
            <div key={module.id} className="flex items-center gap-2">
              <Checkbox checked={formData.enabled_modules.includes(module.module_key)} onCheckedChange={c => {
                setFormData({...formData, enabled_modules: c ? [...formData.enabled_modules, module.module_key] : formData.enabled_modules.filter(m => m !== module.module_key)});
              }} />
              <Label className="text-sm">{module.label}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Planos de Assinatura</h1><p className="text-muted-foreground">Gerencie os planos disponíveis para contratação</p></div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo Plano</Button></DialogTrigger>
          <DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Criar Novo Plano</DialogTitle><DialogDescription>Configure os recursos e precificação do plano</DialogDescription></DialogHeader>{renderForm()}<DialogFooter><Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button><Button onClick={handleCreate}>Criar Plano</Button></DialogFooter></DialogContent>
        </Dialog>
      </div>

      {loading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : plans.length === 0 ? <Card><CardHeader><CardTitle>Nenhum plano cadastrado</CardTitle><CardDescription>Comece criando seu primeiro plano de assinatura</CardDescription></CardHeader></Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{plans.map(plan => <PlanCard key={plan.id} plan={plan} onEdit={() => openEditDialog(plan)} onDelete={() => { setSelectedPlanId(plan.id); setDeleteDialogOpen(true); }} />)}</div>}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Editar Plano</DialogTitle></DialogHeader>{renderForm()}<DialogFooter><Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button><Button onClick={handleEdit}>Salvar Alterações</Button></DialogFooter></DialogContent></Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir este plano?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}
