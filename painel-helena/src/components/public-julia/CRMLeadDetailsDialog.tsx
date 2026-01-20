import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CRMCard } from "@/hooks/usePublicCRMCards";
import { usePublicCRMHistory, CRMHistoryEntry } from "@/hooks/usePublicCRMHistory";
import { User, Phone, Building, Clock, ArrowRight, Loader2 } from "lucide-react";

interface CRMLeadDetailsDialogProps {
  card: CRMCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionToken: string | null;
  generateFreshToken?: (() => string | null) | null;
}

const parseExternalDbDate = (dateString: string | null): Date | null => {
  if (!dateString) return null;
  const cleanDate = dateString.replace('Z', '');
  return new Date(cleanDate);
};

const formatDate = (date: Date | null) => {
  if (!date) return '-';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const CRMLeadDetailsDialog = ({
  card,
  open,
  onOpenChange,
  sessionToken,
  generateFreshToken,
}: CRMLeadDetailsDialogProps) => {
  const { data: history, isLoading: historyLoading } = usePublicCRMHistory(
    card?.id || null,
    sessionToken,
    generateFreshToken
  );

  if (!card) return null;

  const createdDate = parseExternalDbDate(card.created_at);
  const stageEnteredDate = parseExternalDbDate(card.stage_entered_at);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Lead
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lead Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Nome</span>
              <p className="font-medium">{card.contact_name || 'Sem nome'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs flex items-center gap-1">
                <Phone className="h-3 w-3" /> WhatsApp
              </span>
              <p className="font-medium">{card.whatsapp_number || '-'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs flex items-center gap-1">
                <Building className="h-3 w-3" /> Empresa
              </span>
              <p className="font-medium">{card.business_name || '-'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Cod. Agente</span>
              <Badge variant="outline">{card.cod_agent}</Badge>
            </div>
          </div>

          <Separator />

          {/* Current Stage */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Fase Atual</span>
            <div className="flex items-center gap-2">
              <Badge 
                style={{ 
                  backgroundColor: card.stage_color,
                  color: 'white'
                }}
              >
                {card.stage_name}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                desde {formatDate(stageEnteredDate)}
              </span>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Criado em</span>
              <p>{formatDate(createdDate)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Entrou na fase</span>
              <p>{formatDate(stageEnteredDate)}</p>
            </div>
          </div>

          {/* Notes */}
          {card.notes && (
            <>
              <Separator />
              <div className="space-y-1">
                <span className="text-sm font-medium">Observações</span>
                <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                  {card.notes}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* History */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Histórico de Movimentações</span>
            
            {historyLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !history || history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma movimentação registrada
              </p>
            ) : (
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-2">
                  {history.map((entry: CRMHistoryEntry) => {
                    const changedDate = parseExternalDbDate(entry.changed_at);
                    return (
                      <div 
                        key={entry.id}
                        className="flex items-center gap-2 text-xs bg-muted/30 p-2 rounded"
                      >
                        <span className="text-muted-foreground whitespace-nowrap">
                          {formatDate(changedDate)}
                        </span>
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          {entry.from_stage_name ? (
                            <>
                              <Badge 
                                variant="outline" 
                                className="text-[10px] px-1"
                                style={{ borderColor: entry.from_stage_color || undefined }}
                              >
                                {entry.from_stage_name}
                              </Badge>
                              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            </>
                          ) : (
                            <span className="text-muted-foreground">Entrada →</span>
                          )}
                          <Badge 
                            className="text-[10px] px-1"
                            style={{ 
                              backgroundColor: entry.to_stage_color,
                              color: 'white'
                            }}
                          >
                            {entry.to_stage_name}
                          </Badge>
                        </div>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {entry.changed_by}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
