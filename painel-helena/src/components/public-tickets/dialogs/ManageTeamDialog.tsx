import { useState } from "react";
import { Pencil, Loader2, User, RefreshCw, Users, Info, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePublicTicketTeam } from "@/hooks/usePublicTicketTeam";
import { usePublicTicketSectors } from "@/hooks/usePublicTicketSectors";
import { useHelenaSyncData } from "@/hooks/useHelenaSyncData";
import { toast } from "sonner";

interface ManageTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  helenaCountId: string;
}

export function ManageTeamDialog({
  open,
  onOpenChange,
  helenaCountId,
}: ManageTeamDialogProps) {
  const { members: teamMembers, isLoading, updateMember, fetchMembers } =
    usePublicTicketTeam(helenaCountId);
  const { sectors } = usePublicTicketSectors(helenaCountId);
  const { syncAgents, isSyncingAgents } = useHelenaSyncData(helenaCountId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterSector, setFilterSector] = useState<string>("todos");

  const [formData, setFormData] = useState({
    sector_id: "",
    role: "atendente",
    is_available: true,
  });

  const resetForm = () => {
    setFormData({
      sector_id: "",
      role: "atendente",
      is_available: true,
    });
    setEditingId(null);
  };

  const handleEdit = (member: any) => {
    setEditingId(member.id);
    setFormData({
      sector_id: member.sector_id || "",
      role: member.role,
      is_available: member.is_available,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setIsSubmitting(true);
    try {
      await updateMember(editingId, {
        sector_id: formData.sector_id || undefined,
        role: formData.role as 'atendente' | 'lider' | 'admin',
        is_available: formData.is_available,
      });
      toast.success("Agente atualizado");
      resetForm();
    } catch (error) {
      toast.error("Erro ao salvar agente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSync = async () => {
    const success = await syncAgents();
    if (success) {
      await fetchMembers();
    }
  };

  const handleToggleAvailability = async (member: any) => {
    try {
      await updateMember(member.id, {
        is_available: !member.is_available,
      });
      toast.success(
        member.is_available ? "Agente marcado como indisponível" : "Agente disponível"
      );
    } catch (error) {
      toast.error("Erro ao atualizar disponibilidade");
    }
  };

  const filteredMembers = teamMembers.filter(
    (member) => filterSector === "todos" || member.sector_id === filterSector
  );

  const getSectorName = (sectorId: string | null) => {
    if (!sectorId) return "Sem equipe";
    return sectors.find((s) => s.id === sectorId)?.name || "Sem equipe";
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      admin: { label: "Admin", variant: "default" },
      lider: { label: "Líder", variant: "secondary" },
      atendente: { label: "Atendente", variant: "outline" },
    };
    const config = variants[role] || variants.atendente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciar Agentes
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncingAgents}
            >
              {isSyncingAgents ? (
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
            Os agentes são gerenciados no Atende Julia. Use o botão "Sincronizar" para importar.
            Você pode personalizar equipe, função e disponibilidade localmente.
          </AlertDescription>
        </Alert>

        {editingId && (
          <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <h4 className="text-sm font-medium">Editar Configurações Locais</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Equipe</Label>
                <Select
                  value={formData.sector_id}
                  onValueChange={(v) => setFormData({ ...formData, sector_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((sector) => (
                      <SelectItem key={sector.id} value={sector.id}>
                        {sector.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Função</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData({ ...formData, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atendente">Atendente</SelectItem>
                    <SelectItem value="lider">Líder</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Disponível</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={formData.is_available}
                    onCheckedChange={(v) =>
                      setFormData({ ...formData, is_available: v })
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.is_available ? "Sim" : "Não"}
                  </span>
                </div>
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">
              Agentes Sincronizados ({teamMembers.length})
            </h4>
            <Select value={filterSector} onValueChange={setFilterSector}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por equipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Equipes</SelectItem>
                {sectors.map((sector) => (
                  <SelectItem key={sector.id} value={sector.id}>
                    {sector.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {filterSector === "todos" 
                  ? "Nenhum agente sincronizado" 
                  : "Nenhum agente nesta equipe"}
              </p>
              {filterSector === "todos" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleSync}
                  disabled={isSyncingAgents}
                >
                  {isSyncingAgents ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sincronizar Agora
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 p-3 bg-muted rounded-lg ${
                    editingId === member.id ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{member.user_name}</p>
                      {getRoleBadge(member.role)}
                      {(member as any).is_supervisor && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Supervisor
                        </Badge>
                      )}
                      {(member as any).helena_agent_id && (
                        <Badge variant="outline" className="text-xs">Atende Julia</Badge>
                      )}
                      {!member.is_available && (
                        <Badge variant="outline" className="text-muted-foreground">
                          Indisponível
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {getSectorName(member.sector_id)}
                      {member.user_email && ` • ${member.user_email}`}
                      {(member as any).phone_number && ` • ${(member as any).phone_number}`}
                    </p>
                  </div>
                  <Switch
                    checked={member.is_available}
                    onCheckedChange={() => handleToggleAvailability(member)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(member)}
                    disabled={editingId === member.id}
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
