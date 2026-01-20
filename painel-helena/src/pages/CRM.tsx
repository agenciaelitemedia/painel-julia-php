import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors, rectIntersection } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, ArrowLeft } from 'lucide-react';
import { PipelineColumn } from '@/components/crm/PipelineColumn';
import { CreatePipelineDialog } from '@/components/crm/CreatePipelineDialog';
import { CreateDealDialog } from '@/components/crm/CreateDealDialog';
import { useCRMData } from '@/hooks/useCRMData';
import { useCRMBoards } from '@/hooks/useCRMBoards';
import { BoardCard } from '@/components/crm/BoardCard';
import { CreateBoardCard } from '@/components/crm/CreateBoardCard';
import { CreateBoardDialog } from '@/components/crm/CreateBoardDialog';

export default function CRM() {
  const { boards, loading: boardsLoading, createBoard, updateBoard, deleteBoard } = useCRMBoards();
  const {
    pipelines,
    deals,
    loading,
    createPipeline,
    updatePipeline,
    deletePipeline,
    createDeal,
    updateDeal,
    moveDeal,
    deleteDeal,
  } = useCRMData();

  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [pipelineDialogOpen, setPipelineDialogOpen] = useState(false);
  const [dealDialogOpen, setDealDialogOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [editingBoard, setEditingBoard] = useState<any>(null);
  const [editingPipeline, setEditingPipeline] = useState<any>(null);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [dealToDelete, setDealToDelete] = useState<string | null>(null);
  const [pipelineToDelete, setPipelineToDelete] = useState<{ id: string; hasDeals: boolean } | null>(null);
  const [showSecondConfirmation, setShowSecondConfirmation] = useState(false);
  const [confirmDeleteDeals, setConfirmDeleteDeals] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [overPipelineId, setOverPipelineId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setOverId(null);
      setOverPipelineId(null);
      return;
    }

    setOverId(over.id as string);

    // Find which pipeline the over element belongs to
    const overDeal = deals.find(d => d.id === over.id);
    const overPipeline = pipelines.find(p => p.id === over.id);
    
    if (overDeal) {
      setOverPipelineId(overDeal.pipeline_id);
    } else if (overPipeline) {
      setOverPipelineId(overPipeline.id);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setOverId(null);
    setOverPipelineId(null);
    
    if (!over || active.id === over.id) {
      setActiveDragId(null);
      return;
    }

    const activeDeal = deals.find(d => d.id === active.id);
    if (!activeDeal) {
      setActiveDragId(null);
      return;
    }

    const overPipeline = pipelines.find(p => p.id === over.id);
    const overDeal = deals.find(d => d.id === over.id);

    if (overPipeline) {
      const pipelineDeals = deals.filter(d => d.pipeline_id === overPipeline.id && d.id !== activeDeal.id);
      const newPosition = pipelineDeals.length;
      await moveDeal(activeDeal.id, overPipeline.id, newPosition);
    } else if (overDeal) {
      const targetPipelineId = overDeal.pipeline_id;
      const pipelineDeals = deals.filter(d => d.pipeline_id === targetPipelineId);
      const oldIndex = pipelineDeals.findIndex(d => d.id === active.id);
      const newIndex = pipelineDeals.findIndex(d => d.id === over.id);
      
      if (activeDeal.pipeline_id === targetPipelineId) {
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          await moveDeal(activeDeal.id, targetPipelineId, newIndex);
        }
      } else {
        await moveDeal(activeDeal.id, targetPipelineId, newIndex);
      }
    }
    setActiveDragId(null);
  };

  const handleAddDeal = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId);
    setEditingDeal(null);
    setDealDialogOpen(true);
  };

  const handleEditDeal = (deal: any) => {
    setEditingDeal(deal);
    setSelectedPipelineId(deal.pipeline_id);
    setDealDialogOpen(true);
  };

  const handleCreateDeal = async (
    title: string,
    description: string,
    value: number | null,
    contactId: string | null,
    priority: string
  ) => {
    if (editingDeal) {
      await updateDeal(editingDeal.id, {
        title,
        description,
        value,
        contact_id: contactId,
        priority,
      });
    } else {
      await createDeal(selectedPipelineId, title, description, value, contactId, priority);
    }
  };

  const handleDeleteDeal = async () => {
    if (dealToDelete) {
      await deleteDeal(dealToDelete);
      setDealToDelete(null);
    }
  };

  const handleDeletePipelineRequest = (pipelineId: string) => {
    const pipelineDeals = deals.filter(d => d.pipeline_id === pipelineId);
    setPipelineToDelete({ id: pipelineId, hasDeals: pipelineDeals.length > 0 });
    setShowSecondConfirmation(false);
    setConfirmDeleteDeals(false);
  };

  const handleFirstConfirmation = () => {
    if (!pipelineToDelete) return;

    if (pipelineToDelete.hasDeals) {
      setShowSecondConfirmation(true);
    } else {
      handleDeletePipelineConfirm();
    }
  };

  const handleDeletePipelineConfirm = async () => {
    if (!pipelineToDelete) return;

    try {
      // Delete all deals in the pipeline first
      if (pipelineToDelete.hasDeals) {
        const pipelineDeals = deals.filter(d => d.pipeline_id === pipelineToDelete.id);
        
        // Delete all deals in parallel
        await Promise.all(
          pipelineDeals.map(deal => 
            supabase
              .from('crm_deals')
              .delete()
              .eq('id', deal.id)
          )
        );
      }

      // Then delete the pipeline
      await deletePipeline(pipelineToDelete.id);
      setPipelineToDelete(null);
      setShowSecondConfirmation(false);
    } catch (error) {
      console.error('Erro ao excluir etapa:', error);
      toast.error('Erro ao excluir etapa');
    }
  };

  const handleCancelDeletePipeline = () => {
    setPipelineToDelete(null);
    setShowSecondConfirmation(false);
  };

  const handleCreateBoard = async (
    name: string,
    description: string | null,
    icon: string,
    color: string
  ) => {
    if (editingBoard) {
      await updateBoard(editingBoard.id, { name, description, icon, color });
      setEditingBoard(null);
    } else {
      await createBoard(name, description, icon, color);
    }
  };

  const handleEditBoard = (board: any) => {
    setEditingBoard(board);
    setBoardDialogOpen(true);
  };

  const handleReorderPipelines = async (reorderedPipelines: any[]) => {
    for (const pipeline of reorderedPipelines) {
      await updatePipeline(pipeline.id, { position: pipeline.position });
    }
  };

  const handleOpenBoard = (boardId: string) => {
    setSelectedBoardId(boardId);
  };

  const handleBackToBoards = () => {
    setSelectedBoardId('');
  };

  const handleCreatePipeline = async (name: string, color: string) => {
    if (!selectedBoardId) return;
    if (editingPipeline) {
      await updatePipeline(editingPipeline.id, { name, color });
      setEditingPipeline(null);
    } else {
      await createPipeline(name, color, selectedBoardId);
    }
  };

  const handleEditPipeline = (pipeline: any) => {
    setEditingPipeline(pipeline);
    setPipelineDialogOpen(true);
  };

  const activeDeal = activeDragId ? deals.find(d => d.id === activeDragId) : null;
  const currentBoard = boards.find(b => b.id === selectedBoardId);
  const boardPipelines = pipelines.filter(p => p.board_id === selectedBoardId);

  if (boardsLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Carregando CRM...</p>
      </div>
    );
  }

  if (!selectedBoardId) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Painéis</h1>
            <p className="text-muted-foreground mt-2">
              Controle suas vendas, crie funis, tarefas e atividades utilizando os novos painéis
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto auto-rows-fr">
            <CreateBoardCard onClick={() => setBoardDialogOpen(true)} />
            
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onOpen={handleOpenBoard}
                onEdit={handleEditBoard}
                onDelete={deleteBoard}
              />
            ))}
          </div>

          {boards.length === 0 && (
            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">
                Nenhum painel criado ainda
              </p>
            </div>
          )}
        </div>

        <CreateBoardDialog
          open={boardDialogOpen}
          onOpenChange={(open) => {
            setBoardDialogOpen(open);
            if (!open) setEditingBoard(null);
          }}
          onSubmit={handleCreateBoard}
          initialData={editingBoard}
          pipelines={editingBoard ? pipelines.filter(p => p.board_id === editingBoard.id) : []}
          onReorderPipelines={handleReorderPipelines}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToBoards}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <span className="text-2xl">{currentBoard?.icon}</span>
                {currentBoard?.name}
              </h1>
              <p className="text-muted-foreground">
                {currentBoard?.description || 'Gerencie suas etapas e negócios'}
              </p>
            </div>
          </div>
          <Button onClick={() => setPipelineDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Etapa
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-x-auto bg-background">
        {boardPipelines.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground mb-4">
              Nenhuma etapa criada neste painel
            </p>
            <Button onClick={() => setPipelineDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Etapa
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            collisionDetection={rectIntersection}
          >
            <div className="flex gap-4 h-full">
              {boardPipelines.map((pipeline) => {
                const pipelineDeals = deals.filter(d => d.pipeline_id === pipeline.id);
                
                // If dragging over this pipeline, include the dragged item in the sortable items
                const sortableItems = overPipelineId === pipeline.id && activeDragId && !pipelineDeals.find(d => d.id === activeDragId)
                  ? [...pipelineDeals.map(d => d.id), activeDragId]
                  : pipelineDeals.map(d => d.id);
                
                return (
                  <PipelineColumn
                    key={pipeline.id}
                    pipeline={pipeline}
                    deals={pipelineDeals}
                    sortableItems={sortableItems}
                    onAddDeal={handleAddDeal}
                    onEditDeal={handleEditDeal}
                    onDeleteDeal={(id) => setDealToDelete(id)}
                    onEditPipeline={handleEditPipeline}
                    onDeletePipeline={handleDeletePipelineRequest}
                    activeDragId={activeDragId}
                    overId={overId}
                  />
                );
              })}
              <div className="w-6 flex-shrink-0" />
            </div>
            <DragOverlay dropAnimation={null}>
              {activeDeal ? (
                <div className="w-80 rotate-3 scale-105 shadow-2xl">
                  <div className="bg-card border-2 border-primary rounded-lg p-3 space-y-2 opacity-90">
                    <h4 className="font-semibold text-sm">{activeDeal.title}</h4>
                    {activeDeal.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {activeDeal.description}
                      </p>
                    )}
                    {activeDeal.value && (
                      <div className="text-sm font-semibold text-green-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(Number(activeDeal.value))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <CreatePipelineDialog
        open={pipelineDialogOpen}
        onOpenChange={(open) => {
          setPipelineDialogOpen(open);
          if (!open) setEditingPipeline(null);
        }}
        onSubmit={handleCreatePipeline}
        initialData={editingPipeline}
      />

      <CreateDealDialog
        open={dealDialogOpen}
        onOpenChange={(open) => {
          setDealDialogOpen(open);
          if (!open) setEditingDeal(null);
        }}
        pipelineId={selectedPipelineId}
        onSubmit={handleCreateDeal}
        initialData={editingDeal}
      />

      <AlertDialog open={!!dealToDelete} onOpenChange={(open) => !open && setDealToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDeal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pipelineToDelete} onOpenChange={(open) => !open && handleCancelDeletePipeline()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão da etapa</AlertDialogTitle>
            <AlertDialogDescription>
              Ao excluir esta etapa, <strong>todos os cards desta etapa também serão excluídos permanentemente</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-start gap-3 rounded-md border p-3 bg-muted/40">
            <Checkbox id="confirm-delete-deals" checked={confirmDeleteDeals} onCheckedChange={(v) => setConfirmDeleteDeals(!!v)} />
            <label htmlFor="confirm-delete-deals" className="text-sm leading-5 select-none">
              Confirmo que todos os cards desta etapa serão apagados definitivamente junto com a etapa.
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDeletePipeline}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePipelineConfirm} 
              disabled={!confirmDeleteDeals}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
