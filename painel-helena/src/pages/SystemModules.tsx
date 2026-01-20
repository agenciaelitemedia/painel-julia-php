import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Shield, Plus, Pencil, Trash2, Loader2, Package } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SystemModule {
  id: string;
  module_key: string;
  label: string;
  description: string | null;
  icon_name: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const moduleSchema = z.object({
  module_key: z.string()
    .trim()
    .min(1, 'Chave do módulo é obrigatória')
    .max(50, 'Chave deve ter no máximo 50 caracteres')
    .regex(/^[a-z_-]+$/, 'Use apenas letras minúsculas, underscore e hífen'),
  label: z.string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string()
    .trim()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  icon_name: z.string()
    .trim()
    .max(50, 'Nome do ícone deve ter no máximo 50 caracteres')
    .optional(),
  display_order: z.number()
    .int('Ordem deve ser um número inteiro')
    .min(0, 'Ordem deve ser maior ou igual a 0'),
  is_active: z.boolean(),
});

type ModuleFormData = z.infer<typeof moduleSchema>;

export default function SystemModules() {
  const { isAdmin } = useAuth();
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<SystemModule | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<SystemModule | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ModuleFormData>({
    module_key: '',
    label: '',
    description: '',
    icon_name: '',
    display_order: 0,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ModuleFormData, string>>>({});

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_modules')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setModules(data || []);
    } catch (error: any) {
      console.error('Error fetching modules:', error);
      toast.error('Erro ao carregar módulos');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    try {
      moduleSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof ModuleFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as keyof ModuleFormData] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const handleOpenDialog = (module?: SystemModule) => {
    if (module) {
      setEditingModule(module);
      setFormData({
        module_key: module.module_key,
        label: module.label,
        description: module.description || '',
        icon_name: module.icon_name || '',
        display_order: module.display_order,
        is_active: module.is_active,
      });
    } else {
      setEditingModule(null);
      setFormData({
        module_key: '',
        label: '',
        description: '',
        icon_name: '',
        display_order: modules.length,
        is_active: true,
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingModule(null);
    setFormErrors({});
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    try {
      setSaving(true);

      const { data, error } = await supabase.functions.invoke('manage-system-module', {
        body: {
          action: editingModule ? 'update' : 'create',
          moduleData: editingModule ? {
            id: editingModule.id,
            ...formData
          } : formData
        }
      });

      if (error) throw error;

      if (!data.success) {
        toast.error(data.error || 'Erro ao salvar módulo');
        return;
      }

      if (data.warning) {
        toast.warning(data.warning);
      }

      toast.success(editingModule ? 'Módulo atualizado com sucesso' : 'Módulo criado com sucesso');
      handleCloseDialog();
      fetchModules();
    } catch (error: any) {
      console.error('Error saving module:', error);
      toast.error('Erro ao salvar módulo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!moduleToDelete) return;

    try {
      setSaving(true);
      
      const { data, error } = await supabase.functions.invoke('manage-system-module', {
        body: {
          action: 'delete',
          moduleData: { id: moduleToDelete.id }
        }
      });

      if (error) throw error;

      if (!data.success) {
        toast.error(data.error || 'Erro ao excluir módulo');
        return;
      }

      if (data.warning) {
        toast.warning(data.warning, { duration: 5000 });
      }

      toast.success('Módulo excluído com sucesso');
      setDeleteDialogOpen(false);
      setModuleToDelete(null);
      fetchModules();
    } catch (error: any) {
      console.error('Error deleting module:', error);
      toast.error('Erro ao excluir módulo');
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Módulos do Sistema</h1>
            <p className="text-muted-foreground">
              Gerencie os módulos disponíveis no sistema
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Módulo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Card key={module.id} className={!module.is_active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{module.label}</CardTitle>
                  <CardDescription className="mt-1">
                    <code className="text-xs">{module.module_key}</code>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(module)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setModuleToDelete(module);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {module.description && (
                <p className="text-sm text-muted-foreground">{module.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Ordem: {module.display_order}</span>
                <span className={module.is_active ? 'text-green-600' : 'text-red-600'}>
                  {module.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              {module.icon_name && (
                <p className="text-xs text-muted-foreground">Ícone: {module.icon_name}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingModule ? 'Editar Módulo' : 'Novo Módulo'}
            </DialogTitle>
            <DialogDescription>
              {editingModule
                ? 'Atualize as informações do módulo'
                : 'Preencha as informações do novo módulo'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="module_key">Chave do Módulo *</Label>
              <Input
                id="module_key"
                value={formData.module_key}
                onChange={(e) => setFormData({ ...formData, module_key: e.target.value })}
                disabled={!!editingModule}
                placeholder="ex: meu_modulo"
              />
              {formErrors.module_key && (
                <p className="text-xs text-destructive">{formErrors.module_key}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Nome *</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="ex: Meu Módulo"
              />
              {formErrors.label && (
                <p className="text-xs text-destructive">{formErrors.label}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do módulo"
                rows={3}
              />
              {formErrors.description && (
                <p className="text-xs text-destructive">{formErrors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon_name">Nome do Ícone (Lucide)</Label>
              <Input
                id="icon_name"
                value={formData.icon_name}
                onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                placeholder="ex: Package"
              />
              {formErrors.icon_name && (
                <p className="text-xs text-destructive">{formErrors.icon_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Ordem de Exibição *</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              />
              {formErrors.display_order && (
                <p className="text-xs text-destructive">{formErrors.display_order}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Módulo ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o módulo "{moduleToDelete?.label}"?
              Esta ação não pode ser desfeita e pode afetar as permissões configuradas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving} className="bg-destructive hover:bg-destructive/90">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
