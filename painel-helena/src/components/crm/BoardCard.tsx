import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Board } from '@/hooks/useCRMBoards';
import { useState } from 'react';
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

interface BoardCardProps {
  board: Board;
  onOpen: (boardId: string) => void;
  onEdit: (board: Board) => void;
  onDelete: (boardId: string) => void;
}

export function BoardCard({ board, onOpen, onEdit, onDelete }: BoardCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    onDelete(board.id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                style={{ backgroundColor: board.color }}
              >
                {board.icon || '📊'}
              </div>
              <div>
                <CardTitle className="text-lg">{board.name}</CardTitle>
                {board.description && (
                  <CardDescription className="mt-1">{board.description}</CardDescription>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-auto">
          <div className="flex items-center justify-end gap-1">
            <Button 
              onClick={() => onOpen(board.id)}
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Painel
            </Button>
            <Button 
              onClick={() => onEdit(board)}
              variant="outline" 
              size="icon"
              className="text-primary hover:text-primary hover:bg-primary/10 bg-primary/5"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => setDeleteDialogOpen(true)}
              variant="outline" 
              size="icon"
              className="text-primary hover:text-primary hover:bg-primary/10 bg-primary/5"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o painel "{board.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
