import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  UserCheck, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TicketHistory } from "@/hooks/usePublicTickets";

interface TicketTimelineProps {
  history: TicketHistory[];
  maxHeight?: string;
}

const actionConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  criado: { 
    icon: <Plus className="h-3.5 w-3.5" />, 
    color: 'bg-green-500' 
  },
  status_alterado: { 
    icon: <ArrowRight className="h-3.5 w-3.5" />, 
    color: 'bg-blue-500' 
  },
  prioridade_alterada: { 
    icon: <AlertTriangle className="h-3.5 w-3.5" />, 
    color: 'bg-orange-500' 
  },
  atribuido: { 
    icon: <UserCheck className="h-3.5 w-3.5" />, 
    color: 'bg-purple-500' 
  },
  comentario: { 
    icon: <MessageSquare className="h-3.5 w-3.5" />, 
    color: 'bg-gray-500' 
  },
  setor_alterado: { 
    icon: <ArrowRight className="h-3.5 w-3.5" />, 
    color: 'bg-indigo-500' 
  },
  resolvido: { 
    icon: <CheckCircle className="h-3.5 w-3.5" />, 
    color: 'bg-green-500' 
  },
  cancelado: { 
    icon: <XCircle className="h-3.5 w-3.5" />, 
    color: 'bg-red-500' 
  }
};

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    criado: 'Ticket criado',
    status_alterado: 'Status alterado',
    prioridade_alterada: 'Prioridade alterada',
    atribuido: 'Atribuído',
    comentario: 'Comentário',
    setor_alterado: 'Setor alterado',
    resolvido: 'Ticket resolvido',
    cancelado: 'Ticket cancelado'
  };
  return labels[action] || action;
}

export function TicketTimeline({ history, maxHeight = "300px" }: TicketTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
        <Clock className="h-4 w-4 mr-2" />
        Nenhuma atividade registrada
      </div>
    );
  }

  return (
    <ScrollArea className={`pr-4`} style={{ maxHeight }}>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
        
        <div className="space-y-4">
          {history.map((item) => {
            const config = actionConfig[item.action] || { 
              icon: <ArrowRight className="h-3.5 w-3.5" />, 
              color: 'bg-gray-500' 
            };
            
            return (
              <div key={item.id} className="relative flex gap-3">
                {/* Icon */}
                <div className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full ${config.color} text-white flex-shrink-0`}>
                  {config.icon}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {getActionLabel(item.action)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      por {item.user_name}
                    </span>
                  </div>
                  
                  {(item.old_value || item.new_value) && (
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {item.old_value && item.new_value ? (
                        <>
                          <span className="line-through">{item.old_value}</span>
                          <ArrowRight className="inline h-3 w-3 mx-1" />
                          <span className="font-medium">{item.new_value}</span>
                        </>
                      ) : (
                        <span>{item.new_value || item.old_value}</span>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(item.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
