import { useState, useMemo, memo } from "react";
import { CRMCard } from "@/hooks/usePublicCRMCardsOptimized";
import { CRMStage } from "@/hooks/usePublicCRMStages";
import { CRMLeadCardCompact } from "./CRMLeadCardCompact";
import { Button } from "@/components/ui/button";
import { ChevronDown, Loader2 } from "lucide-react";

interface CRMPipelineColumnOptimizedProps {
  stage: CRMStage;
  cards: CRMCard[];
  onViewDetails: (card: CRMCard) => void;
  onOpenChatModal: (card: CRMCard) => void;
  initialVisibleCount?: number;
}

const CARDS_PER_PAGE = 20;

export const CRMPipelineColumnOptimized = memo(({
  stage,
  cards,
  onViewDetails,
  onOpenChatModal,
  initialVisibleCount = CARDS_PER_PAGE,
}: CRMPipelineColumnOptimizedProps) => {
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const [isLoading, setIsLoading] = useState(false);

  const visibleCards = useMemo(() => {
    return cards.slice(0, visibleCount);
  }, [cards, visibleCount]);

  const hasMore = cards.length > visibleCount;
  const remainingCount = cards.length - visibleCount;

  const handleLoadMore = () => {
    setIsLoading(true);
    // Simulate async load for smoother UX
    setTimeout(() => {
      setVisibleCount((prev) => prev + CARDS_PER_PAGE);
      setIsLoading(false);
    }, 100);
  };

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] bg-muted/30 rounded-lg border border-border/50">
      {/* Column Header */}
      <div 
        className="p-3 border-b border-border/50 rounded-t-lg"
        style={{ backgroundColor: `${stage.color}15` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: stage.color }}
            />
            <h3 className="font-medium text-sm">{stage.name}</h3>
          </div>
          <span 
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ 
              backgroundColor: stage.color,
              color: 'white'
            }}
          >
            {cards.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="p-2 space-y-2">
        {cards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum lead nesta fase
          </div>
        ) : (
          <>
            {visibleCards.map((card) => (
              <CRMLeadCardCompact 
                key={card.id} 
                card={card} 
                onViewDetails={onViewDetails}
                onOpenChatModal={onOpenChatModal}
              />
            ))}
            
            {/* Load More Button */}
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoading}
                className="w-full mt-2 text-xs"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 mr-1" />
                )}
                Ver mais ({remainingCount})
              </Button>
            )}
          </>
        )}
      </div>

      {/* Visible indicator */}
      {cards.length > 0 && (
        <div className="px-3 py-2 border-t border-border/30 text-[10px] text-muted-foreground text-center bg-muted/20">
          Exibindo {Math.min(visibleCount, cards.length)} de {cards.length}
        </div>
      )}
    </div>
  );
});

CRMPipelineColumnOptimized.displayName = "CRMPipelineColumnOptimized";
