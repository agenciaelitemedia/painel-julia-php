import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Phone, User, Clock, MessageCircle } from "lucide-react";
import { CRMCard } from "@/hooks/usePublicCRMCardsOptimized";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CRMLeadCardCompactProps {
  card: CRMCard;
  onViewDetails: (card: CRMCard) => void;
  onOpenChatModal: (card: CRMCard) => void;
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

export const CRMLeadCardCompact = memo(({ card, onViewDetails, onOpenChatModal }: CRMLeadCardCompactProps) => {
  const stageEnteredDate = parseExternalDbDate(card.stage_entered_at);
  const createdDate = parseExternalDbDate(card.created_at);
  const updatedDate = parseExternalDbDate(card.updated_at);

  const timeInStage = stageEnteredDate
    ? formatDistanceToNow(stageEnteredDate, { locale: ptBR, addSuffix: false })
    : '-';

  return (
    <Card className="p-3 bg-card hover:shadow-md transition-shadow border border-border/50 cursor-pointer group">
      <div className="space-y-2">
        {/* Contact Name */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium truncate">
              {card.contact_name || 'Sem nome'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChatModal(card);
              }}
              title="Abrir chat"
            >
              <MessageCircle className="h-3.5 w-3.5 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(card);
              }}
              title="Ver detalhes"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Phone className="h-3 w-3" />
          <span>{card.whatsapp_number || '-'}</span>
        </div>

        {/* Cod Agent Badge */}
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {card.cod_agent}
        </Badge>

        {/* Dates */}
        <div className="pt-1 border-t border-border/30 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Criado:</span>
            <span>{formatDate(createdDate)}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Atualizado:</span>
            <span>{formatDate(updatedDate)}</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              Na fase:
            </span>
            <span className="font-medium text-foreground">{timeInStage}</span>
          </div>
        </div>
      </div>
    </Card>
  );
});

CRMLeadCardCompact.displayName = "CRMLeadCardCompact";
