import { CRMCard } from "@/hooks/usePublicCRMCards";
import { CRMStage } from "@/hooks/usePublicCRMStages";
import { CRMLeadCard } from "./CRMLeadCard";

interface CRMPipelineColumnProps {
  stage: CRMStage;
  cards: CRMCard[];
  onViewDetails: (card: CRMCard) => void;
}

export const CRMPipelineColumn = ({ stage, cards, onViewDetails }: CRMPipelineColumnProps) => {
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
          cards.map((card) => (
            <CRMLeadCard 
              key={card.id} 
              card={card} 
              onViewDetails={onViewDetails}
            />
          ))
        )}
      </div>
    </div>
  );
};
