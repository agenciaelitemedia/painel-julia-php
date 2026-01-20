import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Scale, FileCheck, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type DocumentType = "resume" | "legal_report" | "initial_petition";

interface DocumentViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string | null;
  documentType: DocumentType;
  clientName?: string;
}

const documentConfig: Record<
  DocumentType,
  { title: string; icon: React.ReactNode; color: string }
> = {
  resume: {
    title: "Resumo do Caso",
    icon: <FileText className="h-5 w-5" />,
    color: "text-blue-500",
  },
  legal_report: {
    title: "Laudo Jurídico",
    icon: <Scale className="h-5 w-5" />,
    color: "text-purple-500",
  },
  initial_petition: {
    title: "Petição Inicial",
    icon: <FileCheck className="h-5 w-5" />,
    color: "text-green-500",
  },
};

export function DocumentViewerDialog({
  open,
  onOpenChange,
  content,
  documentType,
  clientName,
}: DocumentViewerDialogProps) {
  const [copied, setCopied] = useState(false);
  const config = documentConfig[documentType];

  const handleCopy = async () => {
    if (!content) return;
    
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Texto copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Erro ao copiar texto");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={config.color}>{config.icon}</span>
            {config.title}
            {clientName && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                - {clientName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!content}
              className="gap-2"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copiado!" : "Copiar"}
            </Button>
          </div>

          <ScrollArea className="h-[400px] rounded-md border border-border bg-muted/30 p-4">
            {content ? (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {content}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Nenhum conteúdo disponível.
              </p>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
