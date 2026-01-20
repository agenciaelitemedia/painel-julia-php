import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Pencil, Save, Loader2 } from "lucide-react";

interface CaseNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteCase: string | null;
  recordId: number;
  onSave: (note: string) => Promise<void>;
  isSaving?: boolean;
}

export function CaseNotesDialog({
  open,
  onOpenChange,
  noteCase,
  recordId,
  onSave,
  isSaving = false,
}: CaseNotesDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState(noteCase || "");
  const hasExistingNote = noteCase && noteCase.trim().length > 0;

  useEffect(() => {
    if (open) {
      setNoteText(noteCase || "");
      setIsEditing(!hasExistingNote);
    }
  }, [open, noteCase, hasExistingNote]);

  const handleSave = async () => {
    await onSave(noteText);
    setIsEditing(false);
  };

  const handleClose = () => {
    setIsEditing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-amber-500" />
            Notas do Caso
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Adicione anotações importantes sobre este caso.
          </p>

          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Digite suas anotações aqui..."
                className="min-h-[200px] resize-y"
                maxLength={2000}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {noteText.length}/2000 caracteres
                </span>
                <div className="flex gap-2">
                  {hasExistingNote && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNoteText(noteCase || "");
                        setIsEditing(false);
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 rounded-md border border-border bg-muted/30 p-4 min-h-[200px]">
                  <p className="text-sm whitespace-pre-wrap">{noteCase}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 shrink-0"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
