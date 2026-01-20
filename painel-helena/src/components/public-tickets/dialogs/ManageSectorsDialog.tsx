import { useState } from "react";
import { Pencil, Loader2, GripVertical, RefreshCw, Building2, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePublicTicketSectors } from "@/hooks/usePublicTicketSectors";
import { useHelenaSyncData } from "@/hooks/useHelenaSyncData";
import { toast } from "sonner";

interface ManageSectorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  helenaCountId: string;
}

export function ManageSectorsDialog({
  open,
  onOpenChange,
  helenaCountId,
}: ManageSectorsDialogProps) {
  const { sectors, isLoading, updateSector, fetchSectors } =
    usePublicTicketSectors(helenaCountId);
  const { syncDepartments, isSyncingDepartments } = useHelenaSyncData(helenaCountId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    color: "#6366f1",
    sla_hours: 24,
    default_priority: "normal",
  });

  const resetForm = () => {
    setFormData({
      color: "#6366f1",
      sla_hours: 24,
      default_priority: "normal",
    });
    setEditingId(null);
  };

  const handleEdit = (sector: any) => {
    setEditingId(sector.id);
    setFormData({
      color: sector.color || "#6366f1",
      sla_hours: sector.sla_hours || 24,
      default_priority: sector.default_priority || "normal",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setIsSubmitting(true);
    try {
      await updateSector(editingId, {
        color: formData.color,
        sla_hours: formData.sla_hours,
        default_priority: formData.default_priority as any,
      });
      toast.success("Equipe atualizada");
      resetForm();
    } catch (error) {
      toast.error("Erro ao salvar equipe");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSync = async () => {
    const success = await syncDepartments();
    if (success) {
      await fetchSectors();
    }
  };

  const colorOptions = [
    { value: "#6366f1", label: "Roxo" },
    { value: "#3b82f6", label: "Azul" },
    { value: "#22c55e", label: "Verde" },
    { value: "#f59e0b", label: "Amarelo" },
    { value: "#ef4444", label: "Vermelho" },
    { value: "#ec4899", label: "Rosa" },
    { value: "#8b5cf6", label: "Violeta" },
    { value: "#06b6d4", label: "Ciano" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Gerenciar Equipes
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncingDepartments}
            >
              {isSyncingDepartments ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sincronizar com Atende Julia
            </Button>
          </div>
        </DialogHeader>

        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
            As equipes são gerenciadas no Atende Julia. Use o botão "Sincronizar" para importar.
            Você pode personalizar cor, SLA e prioridade localmente.
          </AlertDescription>
        </Alert>

        {editingId && (
          <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <h4 className="text-sm font-medium">Editar Configurações Locais</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cor</Label>
                <Select
                  value={formData.color}
                  onValueChange={(v) => setFormData({ ...formData, color: v })}
                >
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: formData.color }}
                        />
                        {colorOptions.find((c) => c.value === formData.color)?.label}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: color.value }}
                          />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>SLA (horas)</Label>
                <Input
                  type="number"
                  value={formData.sla_hours}
                  onChange={(e) =>
                    setFormData({ ...formData, sla_hours: parseInt(e.target.value) || 24 })
                  }
                  min={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Prioridade Padrão</Label>
                <Select
                  value={formData.default_priority}
                  onValueChange={(v) =>
                    setFormData({ ...formData, default_priority: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Equipes Sincronizadas ({sectors.length})
          </h4>

          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sectors.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma equipe sincronizada
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={handleSync}
                disabled={isSyncingDepartments}
              >
                {isSyncingDepartments ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sincronizar Agora
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {sectors.map((sector) => (
                <div
                  key={sector.id}
                  className={`flex items-center gap-3 p-3 bg-muted rounded-lg ${
                    editingId === sector.id ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: sector.color || "#6366f1" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{sector.name}</p>
                      {(sector as any).is_default && (
                        <Badge variant="secondary" className="text-xs">Padrão</Badge>
                      )}
                      {(sector as any).helena_department_id && (
                        <Badge variant="outline" className="text-xs">Atende Julia</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      SLA: {sector.sla_hours}h • Prioridade: {sector.default_priority}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(sector)}
                    disabled={editingId === sector.id}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
