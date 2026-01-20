import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DealCard } from './DealCard';
import { Pipeline, Deal } from '@/hooks/useCRMData';

interface PipelineColumnProps {
  pipeline: Pipeline;
  deals: Deal[];
  sortableItems: string[];
  onAddDeal: (pipelineId: string) => void;
  onEditDeal: (deal: Deal) => void;
  onDeleteDeal: (id: string) => void;
  onEditPipeline: (pipeline: Pipeline) => void;
  onDeletePipeline: (id: string) => void;
  activeDragId?: string | null;
  overId?: string | null;
}

export function PipelineColumn({
  pipeline,
  deals,
  sortableItems,
  onAddDeal,
  onEditDeal,
  onDeleteDeal,
  onEditPipeline,
  onDeletePipeline,
  activeDragId,
  overId,
}: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: pipeline.id,
  });

  const isOverPipeline = overId === pipeline.id || deals.some(d => d.id === overId);

  const totalValue = deals.reduce(
    (sum, deal) => sum + (Number(deal.value) || 0),
    0
  );

  return (
    <div className="flex-shrink-0 w-80">
      <div className={`h-full flex flex-col bg-muted/50 rounded-2xl transition-all duration-300 ${isOver ? 'ring-2 ring-primary bg-primary/5 scale-[1.02] shadow-lg' : ''}`}>
        <div className="p-3 pb-2 rounded-t-2xl" style={{ backgroundColor: pipeline.color + '15' }}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-1">
              <h3 className="font-semibold text-sm">{pipeline.name}</h3>
              <span className="text-xs text-muted-foreground">({deals.length})</span>
            </div>
            {totalValue > 0 && (
              <span className="text-xs font-medium">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalValue)}
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditPipeline(pipeline)}>
                  Editar etapa
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDeletePipeline(pipeline.id)}
                >
                  Excluir etapa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div
          ref={setNodeRef}
          className="flex-1 px-3 pb-3 space-y-2 overflow-y-auto min-h-[200px] rounded-b-2xl"
          style={{ backgroundColor: pipeline.color + '15' }}
        >
          <SortableContext
            items={sortableItems}
            strategy={verticalListSortingStrategy}
          >
            {deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onEdit={onEditDeal}
                onDelete={onDeleteDeal}
              />
            ))}
          </SortableContext>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground h-9 text-sm"
            onClick={() => onAddDeal(pipeline.id)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo item
          </Button>
        </div>
      </div>
    </div>
  );
}
