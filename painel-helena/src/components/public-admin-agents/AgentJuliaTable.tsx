import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminAgentJulia } from "@/hooks/usePublicAdminAgentsJulia";
import { AgentJuliaRow } from "./AgentJuliaRow";

interface AgentJuliaTableProps {
  agents: AdminAgentJulia[];
  onEdit: (agent: AdminAgentJulia) => void;
  onViewDetails: (agent: AdminAgentJulia) => void;
  onDelete: (agent: AdminAgentJulia) => void;
  onStatusChange: (agent: AdminAgentJulia, newStatus: boolean) => void;
}

export function AgentJuliaTable({ 
  agents, 
  onEdit, 
  onViewDetails, 
  onDelete, 
  onStatusChange 
}: AgentJuliaTableProps) {
  if (agents.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Nenhum agente encontrado
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Status</TableHead>
            <TableHead className="w-[100px]">Cód.</TableHead>
            <TableHead>Nome / Escritório</TableHead>
            <TableHead className="w-[140px]">Plano</TableHead>
            <TableHead className="w-[150px]">Limite / Uso</TableHead>
            <TableHead className="w-[80px] text-center">Last</TableHead>
            <TableHead className="w-[100px]">Venci.</TableHead>
            <TableHead className="w-[60px]">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => (
            <AgentJuliaRow
              key={agent.cod_agent}
              agent={agent}
              onEdit={onEdit}
              onViewDetails={onViewDetails}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
