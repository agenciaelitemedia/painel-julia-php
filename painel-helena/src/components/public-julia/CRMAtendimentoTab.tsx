import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Loader2, Users } from "lucide-react";
import { usePublicCRMStages, CRMStage } from "@/hooks/usePublicCRMStages";
import { usePublicCRMCards, CRMCard } from "@/hooks/usePublicCRMCards";
import { CRMPipelineColumn } from "./CRMPipelineColumn";
import { CRMLeadDetailsDialog } from "./CRMLeadDetailsDialog";
import { getNowInBrazil } from "@/lib/utils/timezone";
import { format } from "date-fns";

interface CRMAtendimentoTabProps {
  countId: string | null;
  codAgents: string[] | null;
  sessionToken: string | null;
  generateFreshToken?: (() => string | null) | null;
}

// Get today's date in Brazil timezone formatted as YYYY-MM-DD
const getTodayInBrazil = (): string => {
  const now = getNowInBrazil();
  return format(now, "yyyy-MM-dd");
};

export const CRMAtendimentoTab = ({
  countId,
  codAgents,
  sessionToken,
  generateFreshToken,
}: CRMAtendimentoTabProps) => {
  // Get today's date for default filters
  const today = getTodayInBrazil();
  
  // Filters state - default to today
  const [selectedCodAgent, setSelectedCodAgent] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Dialog state
  const [selectedCard, setSelectedCard] = useState<CRMCard | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Get effective cod_agents filter
  const effectiveCodAgents = useMemo(() => {
    if (selectedCodAgent === "all") return codAgents;
    return [selectedCodAgent];
  }, [selectedCodAgent, codAgents]);

  // Fetch stages
  const { data: stages, isLoading: stagesLoading } = usePublicCRMStages(
    sessionToken,
    generateFreshToken
  );

  // Fetch cards with filters
  const { data: cards, isLoading: cardsLoading, refetch } = usePublicCRMCards({
    countId,
    codAgents: effectiveCodAgents,
    startDate: startDate || null,
    endDate: endDate || null,
    searchTerm: searchTerm || null,
    sessionToken,
    generateFreshToken,
  });

  // Group cards by stage
  const cardsByStage = useMemo(() => {
    const grouped: Record<number, CRMCard[]> = {};
    if (stages) {
      stages.forEach((stage: CRMStage) => {
        grouped[stage.id] = [];
      });
    }
    if (cards) {
      cards.forEach((card: CRMCard) => {
        if (grouped[card.stage_id]) {
          grouped[card.stage_id].push(card);
        }
      });
    }
    return grouped;
  }, [stages, cards]);

  // Calculate totals
  const totalCards = cards?.length || 0;

  const clearFilters = () => {
    setSelectedCodAgent("all");
    setStartDate(today);
    setEndDate(today);
    setSearchTerm("");
  };

  const handleViewDetails = (card: CRMCard) => {
    setSelectedCard(card);
    setDetailsOpen(true);
  };

  const isLoading = stagesLoading || cardsLoading;

  return (
    <div>
      {/* Totalizadores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
        {stages?.map((stage: CRMStage) => {
          const count = cardsByStage[stage.id]?.length || 0;
          return (
            <Card key={stage.id} className="border-l-4" style={{ borderLeftColor: stage.color }}>
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground truncate">{stage.name}</div>
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

      {/* Filtros */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
            {/* Cod. Agentes */}
            <div className="space-y-1.5">
              <Label className="text-xs">Cod. Agentes</Label>
              <Select value={selectedCodAgent} onValueChange={setSelectedCodAgent}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {codAgents?.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data Início */}
            <div className="space-y-1.5">
              <Label className="text-xs">Data Início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Data Fim */}
            <div className="space-y-1.5">
              <Label className="text-xs">Data Fim</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Busca */}
            <div className="space-y-1.5 lg:col-span-2">
              <Label className="text-xs">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome, WhatsApp, código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-8"
                />
              </div>
            </div>

            {/* Limpar */}
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="h-9"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Kanban */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !stages || stages.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            Nenhum estágio configurado no CRM
          </div>
        ) : (
          <div className="flex gap-3 pb-4 overflow-x-auto">
            {stages.map((stage: CRMStage) => (
              <CRMPipelineColumn
                key={stage.id}
                stage={stage}
                cards={cardsByStage[stage.id] || []}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lead Details Dialog */}
      <CRMLeadDetailsDialog
        card={selectedCard}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        sessionToken={sessionToken}
        generateFreshToken={generateFreshToken}
      />
    </div>
  );
};
