import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AdminAgentJulia } from "@/hooks/usePublicAdminAgentsJulia";
import { User, Building2, FileText, Mail, Phone, MapPin, Package, BarChart3, Calendar, Smartphone, Hash } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: AdminAgentJulia | null;
}

export function AgentDetailsDialog({ open, onOpenChange, agent }: AgentDetailsDialogProps) {
  if (!agent) return null;

  const isActive = agent.status === true || agent.status === 'active' || agent.status === 'ativo' || agent.status === 't';
  const usagePercent = agent.limit > 0 ? (agent.used / agent.limit) * 100 : 0;

  const getUsageColor = () => {
    if (usagePercent >= 90) return "bg-destructive";
    if (usagePercent >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatDueDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = parseISO(dateStr);
      return format(date, "dd 'de' MMMM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '-';
    // Format phone for display
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const formatFederalId = (federalId: string) => {
    if (!federalId) return '-';
    const cleaned = federalId.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
    }
    if (cleaned.length === 14) {
      return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
    }
    return federalId;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-xl">Detalhes do Agente</span>
            <Badge variant="outline" className="font-mono">
              Cód: {agent.cod_agent}
            </Badge>
            <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-500" : ""}>
              {isActive ? "Ativo" : "Inativo"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Informações do Cliente */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações do Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="font-medium">{agent.name || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Escritório</p>
                  <p className="font-medium">{agent.business_name || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">CPF/CNPJ</p>
                  <p className="font-medium font-mono">{formatFederalId(agent.federal_id)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{agent.email || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="font-medium">{formatPhone(agent.phone)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Localização</p>
                  <p className="font-medium">
                    {agent.city && agent.state ? `${agent.city} - ${agent.state}` : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Plano e Uso */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Package className="h-4 w-4" />
              Plano e Uso
            </h3>
            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Plano</p>
                    <Badge variant="default" className="mt-1">{agent.plan || 'Sem plano'}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Vencimento</p>
                    <p className="font-medium">{formatDueDate(agent.due_date)}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Uso do Plano</span>
                  </div>
                  <span className="text-sm font-mono">
                    {agent.used} / {agent.limit} ({Math.round(usagePercent)}%)
                  </span>
                </div>
                <Progress 
                  value={Math.min(usagePercent, 100)} 
                  className="h-3"
                  indicatorClassName={getUsageColor()}
                />
              </div>

              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Último Uso</p>
                  <p className="font-medium font-mono">{agent.total_last_used || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Configuração Atende Julia */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Configuração Atende Julia
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Smartphone className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">WhatsApp</p>
                  <p className="font-medium font-mono">{agent.wp_number || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Hash className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Atende Julia Count ID</p>
                  <p className="font-medium font-mono">{agent.helena_count_id || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Hash className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Atende Julia User ID</p>
                  <p className="font-medium font-mono">{agent.helena_user_id || '-'}</p>
                </div>
              </div>

              {agent.agent_id && (
                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Agent ID (interno)</p>
                    <p className="font-medium font-mono">{agent.agent_id}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
