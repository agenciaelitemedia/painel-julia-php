import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TicketStatusBadge } from "@/components/public-tickets/shared/TicketStatusBadge";
import { TicketPriorityBadge } from "@/components/public-tickets/shared/TicketPriorityBadge";
import { Clock, User, Phone, AlertTriangle, Eye, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import type { Ticket } from "@/hooks/usePublicTickets";

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
  onViewChat?: () => void;
  compact?: boolean;
}

export function TicketCard({ ticket, onClick, onViewChat, compact = false }: TicketCardProps) {
  const isOverdue = ticket.sla_breached || (ticket.sla_deadline && new Date(ticket.sla_deadline) < new Date());
  const isOpen = ticket.status !== 'resolvido' && ticket.status !== 'cancelado';
  
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  const handleViewChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewChat?.();
  };
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${isOverdue && isOpen ? 'border-red-300 dark:border-red-800' : ''}`}
      onClick={onClick}
    >
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground font-mono">
                #{ticket.ticket_number}
              </span>
              {isOverdue && isOpen && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  SLA
                </Badge>
              )}
            </div>
            
            {/* Title */}
            <h4 className={`font-medium truncate ${compact ? 'text-sm' : ''}`}>
              {ticket.title}
            </h4>
            
            {/* Contact */}
            {ticket.contact_name && (
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                <span className="truncate">{ticket.contact_name}</span>
                {ticket.whatsapp_number && (
                  <>
                    <Phone className="h-3 w-3 ml-2" />
                    <span>{ticket.whatsapp_number}</span>
                  </>
                )}
              </div>
            )}
            
            {/* Badges */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <TicketStatusBadge status={ticket.status} size="sm" />
              <TicketPriorityBadge priority={ticket.priority} size="sm" showIcon={false} />
              {ticket.sector && (
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ 
                    borderColor: ticket.sector.color,
                    color: ticket.sector.color
                  }}
                >
                  {ticket.sector.name}
                </Badge>
              )}
            </div>
            
            {/* Tags */}
            {ticket.tags && ticket.tags.length > 0 && !compact && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {ticket.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                    {tag}
                  </Badge>
                ))}
                {ticket.tags.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{ticket.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Right side */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* Action Icons */}
            <TooltipProvider>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleViewDetails}
                    >
                      <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ver detalhes</TooltipContent>
                </Tooltip>
                
                {ticket.whatsapp_number && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleViewChat}
                      >
                        <MessageCircle className="h-4 w-4 text-green-600 hover:text-green-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ver conversa</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>

            {/* Assignee */}
            {ticket.assigned_to && (
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {ticket.assigned_to.user_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            
            {/* Time */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {formatDistanceToNow(new Date(ticket.created_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
