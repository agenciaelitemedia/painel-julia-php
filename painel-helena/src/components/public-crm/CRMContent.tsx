import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Loader2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePublicCRMStages, CRMStage } from "@/hooks/usePublicCRMStages";
import { usePublicCRMCardsOptimized, CRMCard } from "@/hooks/usePublicCRMCardsOptimized";
import { CRMFilters } from "./CRMFilters";
import { CRMTotalizers } from "./CRMTotalizers";
import { CRMPipelineColumnOptimized } from "./CRMPipelineColumnOptimized";
import { CRMLeadDetailsDialogFull } from "./CRMLeadDetailsDialogFull";

import { CRMHelenaChatModal } from "./CRMHelenaChatModal";
import { getNowInBrazil } from "@/lib/utils/timezone";
import { format } from "date-fns";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

interface CRMContentProps {
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

export const CRMContent = ({
  countId,
  codAgents,
  sessionToken,
  generateFreshToken,
}: CRMContentProps) => {
  const queryClient = useQueryClient();
  
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
  


  // Helena chat modal state
  const [selectedCardForModal, setSelectedCardForModal] = useState<CRMCard | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);

  // Page context (used to control sticky slider behavior only on /app_crm_julia)
  const location = useLocation();
  const stickyHorizontalSlider = location.pathname === "/app_crm_julia";

  // Refs for horizontal scroll sync
  const pipelineScrollRef = useRef<HTMLDivElement | null>(null);
  const isSyncingRef = useRef(false);

  // Slider state for horizontal navigation
  const [sliderValue, setSliderValue] = useState<number[]>([0]);

  // Get effective cod_agents filter
  const effectiveCodAgents = useMemo(() => {
    if (selectedCodAgent === "all") return codAgents;
    return [selectedCodAgent];
  }, [selectedCodAgent, codAgents]);

  // Fetch stages
  const { data: stages, isLoading: stagesLoading, isFetching: stagesFetching, refetch: refetchStages } = usePublicCRMStages(
    sessionToken,
    generateFreshToken
  );

  // Fetch cards with filters - paginated by stage (50 per stage)
  const { data: cards, isLoading: cardsLoading, isFetching: cardsFetching, refetch: refetchCards } = usePublicCRMCardsOptimized({
    countId,
    codAgents: effectiveCodAgents,
    startDate: startDate || null,
    endDate: endDate || null,
    searchTerm: searchTerm || null,
    sessionToken,
    generateFreshToken,
    limit: 50, // Per-stage limit for better performance
  });

  // Group cards by stage (memoized for performance)
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

  const clearFilters = useCallback(() => {
    setSelectedCodAgent("all");
    setStartDate(today);
    setEndDate(today);
    setSearchTerm("");
  }, [today]);

  const handleViewDetails = useCallback((card: CRMCard) => {
    setSelectedCard(card);
    setDetailsOpen(true);
  }, []);


  const handleOpenChatModal = useCallback((card: CRMCard) => {
    setSelectedCardForModal(card);
    setChatModalOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    // Invalidate all related queries to force fresh data fetch
    await queryClient.invalidateQueries({ queryKey: ['crm-stages'] });
    await queryClient.invalidateQueries({ 
      predicate: (query) => 
        typeof query.queryKey[0] === 'string' && 
        (query.queryKey[0].startsWith('crm-cards-optimized') || 
         query.queryKey[0].startsWith('crm-cards-counts'))
    });
    
    // Then refetch
    refetchStages();
    refetchCards();
  }, [queryClient, refetchStages, refetchCards]);

  const isLoading = stagesLoading || cardsLoading;
  const isRefreshing = stagesFetching || cardsFetching;

  const showPipeline = !!stages && stages.length > 0 && !(isLoading && !cards);

  // Handle slider change -> scroll pipeline
  const handleSliderChange = useCallback((value: number[]) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    
    setSliderValue(value);
    const pipelineEl = pipelineScrollRef.current;
    if (pipelineEl) {
      const maxScroll = pipelineEl.scrollWidth - pipelineEl.clientWidth;
      pipelineEl.scrollLeft = (value[0] / 100) * maxScroll;
    }
    
    requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  }, []);

  // Sync slider when pipeline is scrolled
  useEffect(() => {
    if (!stickyHorizontalSlider || !showPipeline) return;

    const pipelineEl = pipelineScrollRef.current;
    if (!pipelineEl) return;

    const handlePipelineScroll = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      
      const maxScroll = pipelineEl.scrollWidth - pipelineEl.clientWidth;
      const percentage = maxScroll > 0 ? (pipelineEl.scrollLeft / maxScroll) * 100 : 0;
      setSliderValue([Math.min(100, Math.max(0, percentage))]);
      
      requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    };

    pipelineEl.addEventListener("scroll", handlePipelineScroll, { passive: true });

    return () => {
      pipelineEl.removeEventListener("scroll", handlePipelineScroll);
    };
  }, [stickyHorizontalSlider, showPipeline]);

  return (
    <div className={stickyHorizontalSlider ? "pb-16" : ""}>
      {/* Totalizers */}
      <CRMTotalizers 
        stages={stages || null} 
        cards={cards || null} 
        isLoading={isLoading} 
      />

      {/* Filters */}
      <CRMFilters
        codAgents={codAgents}
        selectedCodAgent={selectedCodAgent}
        onSelectedCodAgentChange={setSelectedCodAgent}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onClearFilters={clearFilters}
        defaultStartDate={today}
        defaultEndDate={today}
      />

      {/* Refresh Button */}
      <div className="flex justify-end mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Pipeline Kanban (vertical scroll is page-level; horizontal scroll is here) */}
      <div ref={pipelineScrollRef} className="overflow-x-auto pb-4 scrollbar-none">
        {isLoading && !cards ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !stages || stages.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            Nenhum estágio configurado no CRM
          </div>
        ) : (
          <div className="flex gap-3 min-w-max">
            {stages.map((stage: CRMStage) => (
              <CRMPipelineColumnOptimized
                key={stage.id}
                stage={stage}
                cards={cardsByStage[stage.id] || []}
                onViewDetails={handleViewDetails}
                onOpenChatModal={handleOpenChatModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lead Details Dialog */}
      <CRMLeadDetailsDialogFull
        card={selectedCard}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        sessionToken={sessionToken}
        generateFreshToken={generateFreshToken}
        onOpenChatModal={handleOpenChatModal}
      />


      {/* Helena Chat Modal */}
      <CRMHelenaChatModal
        open={chatModalOpen}
        onOpenChange={setChatModalOpen}
        countId={countId}
        codAgent={selectedCardForModal?.cod_agent || null}
        whatsappNumber={selectedCardForModal?.whatsapp_number || null}
      />

      {/* Sticky horizontal slider control (always visible at bottom of viewport) */}
      {stickyHorizontalSlider && showPipeline && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 py-3 px-4 shadow-lg">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            {/* Left indicator */}
            <div className="flex items-center gap-1.5 text-muted-foreground min-w-fit">
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs font-medium hidden sm:inline">Início</span>
            </div>
            
            {/* Slider */}
            <Slider
              value={sliderValue}
              onValueChange={handleSliderChange}
              max={100}
              step={1}
              className="flex-1"
              aria-label="Navegação horizontal do pipeline"
            />
            
            {/* Right indicator */}
            <div className="flex items-center gap-1.5 text-muted-foreground min-w-fit">
              <span className="text-xs font-medium hidden sm:inline">Fim</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
