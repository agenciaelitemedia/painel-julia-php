import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CRMCard } from "@/hooks/usePublicCRMCardsOptimized";
import { usePublicCRMHistory, CRMHistoryEntry } from "@/hooks/usePublicCRMHistory";
import { User, Phone, Building, Clock, ArrowRight, Loader2, Calendar, Hash, ExternalLink } from "lucide-react";

interface CRMLeadDetailsDialogFullProps {
  card: CRMCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionToken: string | null;
  generateFreshToken?: (() => string | null) | null;
  onOpenChatModal?: (card: CRMCard) => void;
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

export const CRMLeadDetailsDialogFull = ({
  card,
  open,
  onOpenChange,
  sessionToken,
  generateFreshToken,
  onOpenChatModal,
}: CRMLeadDetailsDialogFullProps) => {
  const { data: history, isLoading: historyLoading, refetch } = usePublicCRMHistory(
    card?.id || null,
    sessionToken,
    generateFreshToken
  );

  // Refetch data when modal opens
  useEffect(() => {
    if (open && card?.id) {
      refetch();
    }
  }, [open, card?.id, refetch]);

  if (!card) return null;

  const createdDate = parseExternalDbDate(card.created_at);
  const stageEnteredDate = parseExternalDbDate(card.stage_entered_at);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Lead
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Lead Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs flex items-center gap-1">
                <User className="h-3 w-3" /> Nome
              </span>
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
              <span className="text-muted-foreground text-xs flex items-center gap-1">
                <Hash className="h-3 w-3" /> Cod. Agente
              </span>
              <Badge variant="outline">{card.cod_agent}</Badge>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Criado em
              </span>
              <p className="font-medium">{formatDate(createdDate)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">ID</span>
              <p className="font-mono text-xs">{card.helena_count_id}</p>
            </div>
          </div>

          <Separator />

          {/* Current Stage */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Fase Atual</span>
            <div className="flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Badge 
                  className="text-sm px-3 py-1"
                  style={{ 
                    backgroundColor: card.stage_color,
                    color: 'white'
                  }}
                >
                  {card.stage_name}
                </Badge>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  desde {formatDate(stageEnteredDate)}
                </div>
              </div>
              {onOpenChatModal && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  onClick={() => onOpenChatModal(card)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir atendimento
                </Button>
              )}
            </div>
          </div>

          {/* Notes */}
          {card.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm font-medium">Observações</span>
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                  {card.notes}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* History */}
          <div className="space-y-3">
            <span className="text-sm font-medium">Histórico de Movimentações</span>
            
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !history || history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6 bg-muted/30 rounded-lg">
                Nenhuma movimentação registrada
              </p>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {history.map((entry: CRMHistoryEntry) => {
                  const changedDate = parseExternalDbDate(entry.changed_at);
                  return (
                    <div 
                      key={entry.id}
                      className="flex items-center gap-3 text-sm bg-muted/30 p-3 rounded-lg"
                    >
                      <span className="text-muted-foreground text-xs whitespace-nowrap min-w-[100px]">
                        {formatDate(changedDate)}
                      </span>
                      <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                        {entry.from_stage_name ? (
                          <>
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ borderColor: entry.from_stage_color || undefined }}
                            >
                              {entry.from_stage_name}
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </>
                        ) : (
                          <span className="text-muted-foreground text-xs">Entrada →</span>
                        )}
                        <Badge 
                          className="text-xs"
                          style={{ 
                            backgroundColor: entry.to_stage_color,
                            color: 'white'
                          }}
                        >
                          {entry.to_stage_name}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {entry.changed_by}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
