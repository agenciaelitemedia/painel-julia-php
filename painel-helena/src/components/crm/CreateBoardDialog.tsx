import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface Pipeline {
  id: string;
  name: string;
  color: string;
  position: number;
}

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, description: string | null, icon: string, color: string) => void;
  initialData?: {
    id?: string;
    name: string;
    description: string | null;
    icon: string;
    color: string;
  } | null;
  pipelines?: Pipeline[];
  onReorderPipelines?: (pipelines: Pipeline[]) => void;
}

const BOARD_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6',
];

const BOARD_ICONS = ['📊', '💼', '🎯', '📈', '💰', '🚀', '⭐', '🔥'];

function SortablePipelineItem({ pipeline }: { pipeline: Pipeline }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pipeline.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: pipeline.color }}
      />
      <span className="text-sm font-medium flex-1">{pipeline.name}</span>
    </div>
  );
}

export function CreateBoardDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  initialData,
  pipelines = [],
  onReorderPipelines 
}: CreateBoardDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(BOARD_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(BOARD_ICONS[0]);
  const [localPipelines, setLocalPipelines] = useState<Pipeline[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setSelectedColor(initialData.color);
      setSelectedIcon(initialData.icon);
    } else {
      setName('');
      setDescription('');
      setSelectedColor(BOARD_COLORS[0]);
      setSelectedIcon(BOARD_ICONS[0]);
    }
    setLocalPipelines(pipelines);
  }, [initialData, open, pipelines]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localPipelines.findIndex(p => p.id === active.id);
    const newIndex = localPipelines.findIndex(p => p.id === over.id);

    const newPipelines = [...localPipelines];
    const [movedPipeline] = newPipelines.splice(oldIndex, 1);
    newPipelines.splice(newIndex, 0, movedPipeline);

    const reorderedPipelines = newPipelines.map((p, index) => ({
      ...p,
      position: index,
    }));

    setLocalPipelines(reorderedPipelines);
    onReorderPipelines?.(reorderedPipelines);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit(name, description || null, selectedIcon, selectedColor);
    setName('');
    setDescription('');
    setSelectedColor(BOARD_COLORS[0]);
    setSelectedIcon(BOARD_ICONS[0]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Painel' : 'Novo Painel'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Painel</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Vendas, Projetos..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Gerencie aqui suas tarefas..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="flex gap-2 flex-wrap">
              {BOARD_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                    selectedIcon === icon
                      ? 'ring-2 ring-primary scale-110'
                      : 'hover:scale-105 bg-muted'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2 flex-wrap">
              {BOARD_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    selectedColor === color
                      ? 'ring-2 ring-primary scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {initialData && localPipelines.length > 0 && (
            <div className="space-y-2">
              <Label>Etapas (arraste para reordenar)</Label>
              <div className="max-h-64 overflow-y-auto space-y-2 p-2 border rounded-lg">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={localPipelines.map(p => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {localPipelines.map((pipeline) => (
                      <SortablePipelineItem key={pipeline.id} pipeline={pipeline} />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!name.trim()}>
              {initialData ? 'Salvar Alterações' : 'Criar Painel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
