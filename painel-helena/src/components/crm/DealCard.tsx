import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreVertical, GripVertical, DollarSign, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Deal } from '@/hooks/useCRMData';

interface DealCardProps {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: (id: string) => void;
}

export function DealCard({ deal, onEdit, onDelete }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ 
    id: deal.id,
    data: {
      type: 'deal',
      deal,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
  };

  const priorityColors = {
    low: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    high: 'bg-red-500/10 text-red-700 dark:text-red-400',
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing transition-all ${
        isDragging 
          ? 'opacity-30 scale-95 border-2 border-dashed border-primary' 
          : 'hover:shadow-md hover:scale-[1.02]'
      }`}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div {...attributes} {...listeners} className="cursor-grab">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <h4 className="font-semibold text-sm line-clamp-2">{deal.title}</h4>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(deal)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(deal.id)}
              >
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {deal.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {deal.description}
          </p>
        )}

        {deal.value && (
          <div className="flex items-center gap-1 text-sm font-semibold text-green-600 dark:text-green-400">
            <DollarSign className="h-3 w-3" />
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(Number(deal.value))}
          </div>
        )}

        <div className="flex items-center justify-between">
          {deal.contact ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={deal.contact.avatar || undefined} />
                <AvatarFallback className="text-xs">
                  {deal.contact.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {deal.contact.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>Sem contato</span>
            </div>
          )}

          <Badge
            variant="secondary"
            className={`text-xs ${priorityColors[deal.priority as keyof typeof priorityColors] || priorityColors.medium}`}
          >
            {deal.priority === 'low' ? 'Baixa' : deal.priority === 'high' ? 'Alta' : 'Média'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
