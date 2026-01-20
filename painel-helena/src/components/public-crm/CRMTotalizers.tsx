import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Loader2 } from "lucide-react";
import { CRMStage } from "@/hooks/usePublicCRMStages";
import { CRMCard } from "@/hooks/usePublicCRMCardsOptimized";

interface CRMTotalizersProps {
  stages: CRMStage[] | null;
  cards: CRMCard[] | null;
  isLoading: boolean;
}

export const CRMTotalizers = ({ stages, cards, isLoading }: CRMTotalizersProps) => {
  // Group cards by stage for counts
  const cardsByStage = useMemo(() => {
    const grouped: Record<number, number> = {};
    if (stages) {
      stages.forEach((stage) => {
        grouped[stage.id] = 0;
      });
    }
    if (cards) {
      cards.forEach((card) => {
        if (grouped[card.stage_id] !== undefined) {
          grouped[card.stage_id]++;
        }
      });
    }
    return grouped;
  }, [stages, cards]);

  const totalCards = cards?.length || 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="border-l-4 border-l-muted">
            <CardContent className="p-3">
              <div className="h-4 bg-muted animate-pulse rounded mb-2" />
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
      {stages?.map((stage) => {
        const count = cardsByStage[stage.id] || 0;
        return (
          <Card 
            key={stage.id} 
            className="border-l-4 transition-shadow hover:shadow-md" 
            style={{ borderLeftColor: stage.color }}
          >
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground truncate" title={stage.name}>
                {stage.name}
              </div>
              <div className="text-2xl font-bold" style={{ color: stage.color }}>
                {count}
              </div>
            </CardContent>
          </Card>
        );
      })}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-3">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" /> Total
          </div>
          <div className="text-2xl font-bold text-primary">{totalCards}</div>
        </CardContent>
      </Card>
    </div>
  );
};
