import { MoreVertical, Edit, Eye, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { AdminAgentJulia } from "@/hooks/usePublicAdminAgentsJulia";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgentJuliaRowProps {
  agent: AdminAgentJulia;
  onEdit: (agent: AdminAgentJulia) => void;
  onViewDetails: (agent: AdminAgentJulia) => void;
  onDelete: (agent: AdminAgentJulia) => void;
  onStatusChange: (agent: AdminAgentJulia, newStatus: boolean) => void;
}

export function AgentJuliaRow({ 
  agent, 
  onEdit, 
  onViewDetails, 
  onDelete, 
  onStatusChange 
}: AgentJuliaRowProps) {
  const isActive = agent.status === true || agent.status === 'active' || agent.status === 'ativo' || agent.status === 't';
  const usagePercent = agent.limit > 0 ? (agent.used / agent.limit) * 100 : 0;
  
  const getUsageColor = () => {
    if (usagePercent >= 90) return "bg-destructive";
    if (usagePercent >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPlanBadgeVariant = (plan: string) => {
    if (plan?.toLowerCase().includes('ultra')) return 'default';
    if (plan?.toLowerCase().includes('start')) return 'secondary';
    return 'outline';
  };

  const formatDueDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = parseISO(dateStr);
      return `Dia ${format(date, 'd', { locale: ptBR })}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <TableRow>
      {/* Status Switch */}
      <TableCell>
        <Switch
          checked={isActive}
          onCheckedChange={(checked) => onStatusChange(agent, checked)}
          className="data-[state=checked]:bg-green-500"
        />
      </TableCell>

      {/* Código */}
      <TableCell className="font-mono font-medium">
        {agent.cod_agent}
      </TableCell>

      {/* Nome / Escritório */}
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{agent.name}</span>
          {agent.business_name && (
            <span className="text-xs text-muted-foreground">{agent.business_name}</span>
          )}
        </div>
      </TableCell>

      {/* Plano */}
      <TableCell>
        <Badge variant={getPlanBadgeVariant(agent.plan)}>
          {agent.plan || 'Sem plano'}
        </Badge>
      </TableCell>

      {/* Limite / Uso */}
      <TableCell>
        <div className="flex flex-col gap-1 min-w-[120px]">
          <div className="flex justify-between text-xs">
            <span>{agent.used}</span>
            <span className="text-muted-foreground">/ {agent.limit}</span>
          </div>
          <Progress 
            value={Math.min(usagePercent, 100)} 
            className="h-2"
            indicatorClassName={getUsageColor()}
          />
        </div>
      </TableCell>

      {/* Last */}
      <TableCell className="text-center">
        <span className="font-mono">{agent.total_last_used || 0}</span>
      </TableCell>

      {/* Vencimento */}
      <TableCell>
        <span className="text-sm">{formatDueDate(agent.due_date)}</span>
      </TableCell>

      {/* Ações */}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(agent)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewDetails(agent)}>
              <Eye className="h-4 w-4 mr-2" />
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(agent)}
              disabled={agent.hasSessions}
              className={agent.hasSessions ? "opacity-50 cursor-not-allowed" : "text-destructive focus:text-destructive"}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
              {agent.hasSessions && (
                <span className="text-xs ml-2">(possui sessões)</span>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
