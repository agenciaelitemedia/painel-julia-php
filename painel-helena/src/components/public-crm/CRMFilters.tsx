import { useState, useEffect, useCallback } from "react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Search, X, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CRMFiltersProps {
  codAgents: string[] | null;
  selectedCodAgent: string;
  onSelectedCodAgentChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onClearFilters: () => void;
  defaultStartDate: string;
  defaultEndDate: string;
}

export const CRMFilters = ({
  codAgents,
  selectedCodAgent,
  onSelectedCodAgentChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  searchTerm,
  onSearchTermChange,
  onClearFilters,
  defaultStartDate,
  defaultEndDate,
}: CRMFiltersProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchTermChange(localSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchTermChange]);

  // Count active filters
  const activeFiltersCount = [
    selectedCodAgent !== "all",
    startDate !== defaultStartDate,
    endDate !== defaultEndDate,
    searchTerm.trim() !== "",
  ].filter(Boolean).length;

  const handleClear = useCallback(() => {
    setLocalSearch("");
    onClearFilters();
  }, [onClearFilters]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="mb-4">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Filtros</span>
              {activeFiltersCount > 0 && !isOpen && (
                <Badge variant="secondary" className="text-xs">
                  {activeFiltersCount} ativo{activeFiltersCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
              {/* Cod. Agentes */}
              <div className="space-y-1.5">
                <Label className="text-xs">Cod. Agentes</Label>
                <Select value={selectedCodAgent} onValueChange={onSelectedCodAgentChange}>
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
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Data Fim */}
              <div className="space-y-1.5">
                <Label className="text-xs">Data Fim</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
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
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="h-9 pl-8"
                  />
                </div>
              </div>

              {/* Limpar */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="h-9"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
