import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import {
  useAdminExtraModules,
  useCreateExtraModule,
  useUpdateExtraModule,
  useDeleteExtraModule,
  ExtraModule,
} from "@/hooks/useAdminCalculatorData";

const emptyModule: Omit<ExtraModule, "id"> = {
  name: "",
  description: "",
  price: 0,
  icon_name: "Package",
  has_quantity: false,
  quantity_label: "",
  price_per_unit: 0,
  base_quantity: 1,
  max_quantity: 10,
  display_order: 0,
  is_active: true,
};

export default function AdminExtraModules() {
  const { data: modules, isLoading } = useAdminExtraModules();
  const createModule = useCreateExtraModule();
  const updateModule = useUpdateExtraModule();
  const deleteModule = useDeleteExtraModule();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ExtraModule | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<ExtraModule, "id">>(emptyModule);

  const handleOpenCreate = () => {
    setEditingModule(null);
    setFormData(emptyModule);
    setDialogOpen(true);
  };

  const handleOpenEdit = (module: ExtraModule) => {
    setEditingModule(module);
    setFormData({
      name: module.name,
      description: module.description,
      price: module.price,
      icon_name: module.icon_name,
      has_quantity: module.has_quantity,
      quantity_label: module.quantity_label,
      price_per_unit: module.price_per_unit,
      base_quantity: module.base_quantity,
      max_quantity: module.max_quantity,
      display_order: module.display_order,
      is_active: module.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingModule) {
      await updateModule.mutateAsync({ id: editingModule.id, ...formData });
    } else {
      await createModule.mutateAsync(formData);
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (moduleToDelete) {
      await deleteModule.mutateAsync(moduleToDelete);
      setDeleteDialogOpen(false);
      setModuleToDelete(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Módulos Extras</h1>
            <p className="text-muted-foreground">
              Gerencie os módulos extras disponíveis na calculadora de preços
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Módulo
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-20 bg-muted" />
                <CardContent className="h-32" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules?.map((module) => (
              <Card
                key={module.id}
                className={`relative ${!module.is_active ? "opacity-60" : ""}`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{module.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(module)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setModuleToDelete(module.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {module.description}
                  </p>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Preço:</strong> {formatCurrency(module.price)}
                    </p>
                    {module.has_quantity && (
                      <>
                        <p>
                          <strong>Por unidade:</strong>{" "}
                          {formatCurrency(module.price_per_unit || 0)}
                        </p>
                        <p>
                          <strong>Label:</strong> {module.quantity_label}
                        </p>
                      </>
                    )}
                    <p>
                      <strong>Ordem:</strong> {module.display_order}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      {module.is_active ? "Ativo" : "Inativo"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingModule ? "Editar Módulo" : "Novo Módulo"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Preço Base (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="icon_name">Ícone (Lucide)</Label>
                  <Input
                    id="icon_name"
                    value={formData.icon_name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, icon_name: e.target.value })
                    }
                    placeholder="Package"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="has_quantity"
                  checked={formData.has_quantity || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, has_quantity: checked })
                  }
                />
                <Label htmlFor="has_quantity">Tem quantidade variável</Label>
              </div>
              {formData.has_quantity && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="quantity_label">Label da Quantidade</Label>
                    <Input
                      id="quantity_label"
                      value={formData.quantity_label || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity_label: e.target.value })
                      }
                      placeholder="ex: ramais, usuários"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="price_per_unit">Preço/Unidade</Label>
                      <Input
                        id="price_per_unit"
                        type="number"
                        step="0.01"
                        value={formData.price_per_unit || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price_per_unit: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="base_quantity">Qtd Base</Label>
                      <Input
                        id="base_quantity"
                        type="number"
                        value={formData.base_quantity || 1}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            base_quantity: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="max_quantity">Qtd Máxima</Label>
                      <Input
                        id="max_quantity"
                        type="number"
                        value={formData.max_quantity || 10}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            max_quantity: parseInt(e.target.value) || 10,
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="display_order">Ordem de Exibição</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        display_order: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    id="is_active"
                    checked={formData.is_active ?? true}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Ativo</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={createModule.isPending || updateModule.isPending}
              >
                {createModule.isPending || updateModule.isPending
                  ? "Salvando..."
                  : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este módulo? Esta ação não pode ser
                desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
