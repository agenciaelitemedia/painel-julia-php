import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Pencil, Trash2, Settings, Check } from "lucide-react";
import {
  useAdminImplementationTypes,
  useCreateImplementationType,
  useUpdateImplementationType,
  useDeleteImplementationType,
  ImplementationType,
} from "@/hooks/useAdminCalculatorData";

const emptyType: Omit<ImplementationType, "id"> = {
  name: "",
  description: "",
  price: 0,
  included_items: [],
  badge_text: "",
  badge_color: "default",
  display_order: 0,
  is_active: true,
};

export default function AdminImplementationTypes() {
  const { data: types, isLoading } = useAdminImplementationTypes();
  const createType = useCreateImplementationType();
  const updateType = useUpdateImplementationType();
  const deleteType = useDeleteImplementationType();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ImplementationType | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<ImplementationType, "id">>(emptyType);
  const [includedItemsText, setIncludedItemsText] = useState("");

  const handleOpenCreate = () => {
    setEditingType(null);
    setFormData(emptyType);
    setIncludedItemsText("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (type: ImplementationType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description,
      price: type.price,
      included_items: type.included_items,
      badge_text: type.badge_text,
      badge_color: type.badge_color,
      display_order: type.display_order,
      is_active: type.is_active,
    });
    setIncludedItemsText(type.included_items?.join("\n") || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const items = includedItemsText
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const dataToSave = { ...formData, included_items: items };

    if (editingType) {
      await updateType.mutateAsync({ id: editingType.id, ...dataToSave });
    } else {
      await createType.mutateAsync(dataToSave);
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (typeToDelete) {
      await deleteType.mutateAsync(typeToDelete);
      setDeleteDialogOpen(false);
      setTypeToDelete(null);
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
            <h1 className="text-2xl font-bold text-foreground">
              Tipos de Implementação
            </h1>
            <p className="text-muted-foreground">
              Gerencie os tipos de implementação disponíveis na calculadora
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Tipo
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
            {types?.map((type) => (
              <Card
                key={type.id}
                className={`relative ${!type.is_active ? "opacity-60" : ""}`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{type.name}</CardTitle>
                    {type.badge_text && (
                      <Badge variant="secondary">{type.badge_text}</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(type)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setTypeToDelete(type.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {type.description}
                  </p>
                  <p className="text-lg font-bold text-primary mb-2">
                    {formatCurrency(type.price)}
                  </p>
                  {type.included_items && type.included_items.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Itens inclusos:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {type.included_items.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-green-500" />
                            {item}
                          </li>
                        ))}
                        {type.included_items.length > 3 && (
                          <li className="text-xs">
                            +{type.included_items.length - 3} mais...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Ordem: {type.display_order} |{" "}
                    {type.is_active ? "Ativo" : "Inativo"}
                  </p>
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
                {editingType ? "Editar Tipo" : "Novo Tipo de Implementação"}
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
              <div className="grid gap-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="included_items">
                  Itens Inclusos (um por linha)
                </Label>
                <Textarea
                  id="included_items"
                  rows={5}
                  value={includedItemsText}
                  onChange={(e) => setIncludedItemsText(e.target.value)}
                  placeholder="Configuração inicial&#10;Treinamento básico&#10;Suporte por 30 dias"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="badge_text">Texto do Badge</Label>
                  <Input
                    id="badge_text"
                    value={formData.badge_text || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, badge_text: e.target.value })
                    }
                    placeholder="ex: Popular"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="badge_color">Cor do Badge</Label>
                  <Input
                    id="badge_color"
                    value={formData.badge_color || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, badge_color: e.target.value })
                    }
                    placeholder="default, secondary, destructive"
                  />
                </div>
              </div>
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
                disabled={createType.isPending || updateType.isPending}
              >
                {createType.isPending || updateType.isPending
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
                Tem certeza que deseja excluir este tipo de implementação? Esta
                ação não pode ser desfeita.
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
