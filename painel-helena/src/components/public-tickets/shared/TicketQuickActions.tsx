import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  ArrowUp, 
  ArrowDown,
  User,
  FolderOpen
} from "lucide-react";
import type { Ticket } from "@/hooks/usePublicTickets";
import type { TicketSector } from "@/hooks/usePublicTicketSectors";
import type { TicketTeamMember } from "@/hooks/usePublicTicketTeam";

interface TicketQuickActionsProps {
  ticket: Ticket;
  sectors?: TicketSector[];
  teamMembers?: TicketTeamMember[];
  onUpdateStatus: (status: string) => void;
  onUpdatePriority: (priority: string) => void;
  onAssign: (memberId: string | null) => void;
  onChangeSector: (sectorId: string) => void;
  disabled?: boolean;
}

export function TicketQuickActions({
  ticket,
  sectors = [],
  teamMembers = [],
  onUpdateStatus,
  onUpdatePriority,
  onAssign,
  onChangeSector,
  disabled = false
}: TicketQuickActionsProps) {
  const isOpen = ticket.status === 'aberto' || ticket.status === 'em_atendimento' || ticket.status === 'aguardando';
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={disabled}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Status actions */}
        {isOpen && (
          <>
            {ticket.status === 'aberto' && (
              <DropdownMenuItem onClick={() => onUpdateStatus('em_atendimento')}>
                <Play className="h-4 w-4 mr-2" />
                Iniciar Atendimento
              </DropdownMenuItem>
            )}
            {ticket.status === 'em_atendimento' && (
              <DropdownMenuItem onClick={() => onUpdateStatus('aguardando')}>
                <Pause className="h-4 w-4 mr-2" />
                Aguardando
              </DropdownMenuItem>
            )}
            {ticket.status === 'aguardando' && (
              <DropdownMenuItem onClick={() => onUpdateStatus('em_atendimento')}>
                <Play className="h-4 w-4 mr-2" />
                Retomar Atendimento
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onUpdateStatus('resolvido')}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolver
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus('cancelado')}>
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Priority submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <ArrowUp className="h-4 w-4 mr-2" />
            Prioridade
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem 
              onClick={() => onUpdatePriority('baixa')}
              disabled={ticket.priority === 'baixa'}
            >
              <ArrowDown className="h-4 w-4 mr-2" />
              Baixa
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onUpdatePriority('normal')}
              disabled={ticket.priority === 'normal'}
            >
              Normal
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onUpdatePriority('alta')}
              disabled={ticket.priority === 'alta'}
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              Alta
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onUpdatePriority('critica')}
              disabled={ticket.priority === 'critica'}
            >
              <ArrowUp className="h-4 w-4 mr-2 text-red-500" />
              Crítica
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Assign submenu */}
        {teamMembers.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <User className="h-4 w-4 mr-2" />
              Atribuir
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => onAssign(null)}>
                <User className="h-4 w-4 mr-2 opacity-50" />
                Remover atribuição
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {teamMembers.map((member) => (
                <DropdownMenuItem 
                  key={member.id}
                  onClick={() => onAssign(member.id)}
                  disabled={ticket.assigned_to_id === member.id}
                >
                  <User className="h-4 w-4 mr-2" />
                  {member.user_name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {/* Sector submenu */}
        {sectors.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FolderOpen className="h-4 w-4 mr-2" />
              Setor
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {sectors.map((sector) => (
                <DropdownMenuItem 
                  key={sector.id}
                  onClick={() => onChangeSector(sector.id)}
                  disabled={ticket.sector_id === sector.id}
                >
                  <div 
                    className="h-3 w-3 rounded-full mr-2" 
                    style={{ backgroundColor: sector.color }} 
                  />
                  {sector.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
