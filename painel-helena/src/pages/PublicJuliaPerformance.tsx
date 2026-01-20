import { useState, useMemo } from "react";
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { getNowInBrazil, formatInBrazil, formatExternalDbDate } from "@/lib/utils/timezone";
import { usePublicAppSecurity } from "@/hooks/usePublicAppSecurity";
import { usePublicHelenaAgents } from "@/hooks/usePublicHelenaAgents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { MessageCircle, Scale, FileCheck, FileText, CalendarIcon, Check, ChevronsUpDown, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, Search, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePublicJuliaPerformanceData, usePublicJuliaPerformanceSummary, usePublicJuliaPerformanceComparison, usePublicAgentsList, usePublicJuliaPerformanceExport } from "@/hooks/usePublicJuliaPerformance";
import { useToast } from "@/hooks/use-toast";
import { exportToPDF, exportToXLSX, exportToCSV } from "@/lib/utils/export-utils";

export default function PublicJuliaPerformance() {
  // Hook de segurança
  const { sessionToken, countId, generateFreshToken } = usePublicAppSecurity();
  
  // Buscar cod_agents da conta Helena
  const { data: helenaAgents, isLoading: isLoadingHelenaAgents } = usePublicHelenaAgents(countId, sessionToken, generateFreshToken);

  const [tipoAgente, setTipoAgente] = useState<string>('TODOS');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [statusContrato, setStatusContrato] = useState<string>('TODOS');
  const [dataInicio, setDataInicio] = useState<Date | undefined>(getNowInBrazil());
  const [dataFim, setDataFim] = useState<Date | undefined>(getNowInBrazil());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [agentSearchOpen, setAgentSearchOpen] = useState(false);
  const [periodoRapido, setPeriodoRapido] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const { toast } = useToast();
  
  // Filtro de cod_agents
  const userCodAgentsFilter = useMemo(() => {
    // Se não há countId, não aplicar filtro (modo demo/preview)
    if (!countId || countId.trim() === "") return null;
    
    // Se ainda carregando, retornar undefined para aguardar
    if (!helenaAgents) return undefined;
    
    // Se não encontrou agents, retornar array vazio (sem dados)
    if (helenaAgents.length === 0) return [];
    
    return helenaAgents.map(a => String(a.cod_agent));
  }, [countId, helenaAgents]);

  const { data: performanceData, isLoading: isLoadingPerformance, error } = usePublicJuliaPerformanceData(
    tipoAgente, selectedAgentId, dataInicio || null, dataFim || null, userCodAgentsFilter, sessionToken, generateFreshToken
  );

  const { data: summary } = usePublicJuliaPerformanceSummary(
    tipoAgente, selectedAgentId, dataInicio || null, dataFim || null, userCodAgentsFilter, sessionToken, generateFreshToken
  );

  const { data: previousSummary } = usePublicJuliaPerformanceComparison(
    tipoAgente, selectedAgentId, dataInicio || null, dataFim || null, userCodAgentsFilter, sessionToken, generateFreshToken
  );

  const { data: agentsList, isLoading: isLoadingAgents } = usePublicAgentsList(userCodAgentsFilter, sessionToken, generateFreshToken);
  
  const { refetch: refetchExportData } = usePublicJuliaPerformanceExport(
    tipoAgente, selectedAgentId, dataInicio || null, dataFim || null, userCodAgentsFilter, false, sessionToken, generateFreshToken
  );

  const currentSummary = summary || { leads: 0, contratos: 0, assinados: 0, emCurso: 0 };
  const prevSummary = previousSummary || { leads: 0, contratos: 0, assinados: 0, emCurso: 0 };

  const calculateVariation = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  };

  const getVariationColor = (variation: number) => {
    if (variation > 0) return "text-green-500";
    if (variation < 0) return "text-red-500";
    return "text-muted-foreground";
  };

  const getVariationIcon = (variation: number) => {
    if (variation > 0) return "↑";
    if (variation < 0) return "↓";
    return "→";
  };

  const getPeriodReferenceText = () => {
    if (!dataInicio || !dataFim) return "período anterior";
    switch (periodoRapido) {
      case "hoje": return "vs ontem";
      case "ontem": return "vs anteontem";
      case "7dias": return "vs 7 dias anteriores";
      case "mes": return "vs mês anterior";
      case "ultimo_mes": return "vs mês anterior ao último";
      default:
        const inicioNorm = new Date(dataInicio);
        inicioNorm.setHours(0, 0, 0, 0);
        const fimNorm = new Date(dataFim);
        fimNorm.setHours(0, 0, 0, 0);
        const diffInDays = Math.floor((fimNorm.getTime() - inicioNorm.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return diffInDays === 1 ? "vs dia anterior" : `vs ${diffInDays} dias anteriores`;
    }
  };

  const leadsVariation = calculateVariation(currentSummary.leads, prevSummary.leads);
  const contratosVariation = calculateVariation(currentSummary.contratos, prevSummary.contratos);
  const assinadosVariation = calculateVariation(currentSummary.assinados, prevSummary.assinados);
  const emCursoVariation = calculateVariation(currentSummary.emCurso, prevSummary.emCurso);

  const handlePeriodoRapido = (value: string) => {
    setPeriodoRapido(value);
    const hoje = getNowInBrazil();
    
    switch (value) {
      case "hoje":
        setDataInicio(startOfDay(hoje));
        setDataFim(endOfDay(hoje));
        break;
      case "ontem":
        const ontem = subDays(hoje, 1);
        setDataInicio(startOfDay(ontem));
        setDataFim(endOfDay(ontem));
        break;
      case "7dias":
        setDataInicio(startOfDay(subDays(hoje, 6)));
        setDataFim(endOfDay(hoje));
        break;
      case "mes":
        setDataInicio(startOfMonth(hoje));
        setDataFim(endOfMonth(hoje));
        break;
      case "ultimo_mes":
        const mesPassado = subMonths(hoje, 1);
        setDataInicio(startOfMonth(mesPassado));
        setDataFim(endOfMonth(mesPassado));
        break;
      default:
        break;
    }
    setCurrentPage(1);
  };

  const handleLimparFiltros = () => {
    setTipoAgente('TODOS');
    setSelectedAgentId(null);
    setStatusContrato('TODOS');
    setDataInicio(getNowInBrazil());
    setDataFim(getNowInBrazil());
    setPeriodoRapido("");
    setCurrentPage(1);
  };

  const handleExport = async (exportFormat: 'pdf' | 'xlsx' | 'csv') => {
    setIsExporting(true);
    
    try {
      const { data } = await refetchExportData();
      
      if (!data || data.length === 0) {
        toast({
          title: "Nenhum dado para exportar",
          description: "Não há registros para os filtros aplicados.",
          variant: "destructive",
        });
        return;
      }
      
      let dataToExport = data;
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        dataToExport = data.filter(record => 
          (record.name?.toLowerCase().includes(search)) ||
          (record.business_name?.toLowerCase().includes(search)) ||
          (record.whatsapp?.toString().includes(search)) ||
          (String(record.cod_agent || '').toLowerCase().includes(search))
        );
      }
      
      if (statusContrato !== 'TODOS') {
        dataToExport = dataToExport.filter(record => {
          if (statusContrato === 'CONTRATOS') {
            return record.status_document === 'SIGNED' || record.status_document === 'CREATED';
          } else if (statusContrato === 'SIGNED') {
            return record.status_document === 'SIGNED';
          } else if (statusContrato === 'CREATED') {
            return record.status_document === 'CREATED';
          }
          return true;
        });
      }
      
      if (dataToExport.length === 0) {
        toast({
          title: "Nenhum dado para exportar",
          description: "Não há registros para os filtros aplicados.",
          variant: "destructive",
        });
        return;
      }
      
      const filtros = {
        dataInicio: dataInicio ? format(dataInicio, 'dd/MM/yyyy') : '',
        dataFim: dataFim ? format(dataFim, 'dd/MM/yyyy') : '',
        tipoAgente,
        statusContrato,
        agentId: selectedAgentId,
      };
      
      switch (exportFormat) {
        case 'pdf':
          exportToPDF(dataToExport, filtros);
          break;
        case 'xlsx':
          exportToXLSX(dataToExport, filtros);
          break;
        case 'csv':
          exportToCSV(dataToExport, filtros);
          break;
      }
      
      toast({
        title: "Exportação concluída",
        description: `${dataToExport.length} registros exportados em ${exportFormat.toUpperCase()}.`,
      });
      
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar os dados.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getVisiblePages = (current: number, total: number) => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l: number | undefined;

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  const filteredData = performanceData?.filter(record => {
    let statusMatch = true;
    if (statusContrato === 'CONTRATOS') {
      statusMatch = record.status_document === 'SIGNED' || record.status_document === 'CREATED';
    } else if (statusContrato === 'SIGNED') {
      statusMatch = record.status_document === 'SIGNED';
    } else if (statusContrato === 'CREATED') {
      statusMatch = record.status_document === 'CREATED';
    }
    
    let searchMatch = true;
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      searchMatch = 
        (record.name?.toLowerCase().includes(search)) ||
        (record.business_name?.toLowerCase().includes(search)) ||
        (record.whatsapp?.toString().includes(search)) ||
        (String(record.cod_agent || '').toLowerCase().includes(search));
    }
    
    return statusMatch && searchMatch;
  }) || [];

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);
  const visiblePages = getVisiblePages(currentPage, totalPages);

  const selectedAgent = agentsList?.find(a => a.agent_id === selectedAgentId);
  
  const isLoading = isLoadingPerformance || isLoadingAgents || isLoadingHelenaAgents || userCodAgentsFilter === undefined;

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Desempenho da Julia</h1>
      </div>

      {/* Totalizadores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentSummary.leads}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">Total de leads atendidos</span>
              <span className={cn("text-xs font-semibold flex items-center gap-0.5", getVariationColor(leadsVariation))}>
                {getVariationIcon(leadsVariation)} {Math.abs(leadsVariation)}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{getPeriodReferenceText()}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contratos</CardTitle>
            <div className="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <Scale className="h-5 w-5 text-cyan-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentSummary.contratos}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">Total de contratos</span>
              <span className={cn("text-xs font-semibold flex items-center gap-0.5", getVariationColor(contratosVariation))}>
                {getVariationIcon(contratosVariation)} {Math.abs(contratosVariation)}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{getPeriodReferenceText()}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assinados</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <FileCheck className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentSummary.assinados}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">Contratos assinados</span>
              <span className={cn("text-xs font-semibold flex items-center gap-0.5", getVariationColor(assinadosVariation))}>
                {getVariationIcon(assinadosVariation)} {Math.abs(assinadosVariation)}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{getPeriodReferenceText()}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Curso</CardTitle>
            <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentSummary.emCurso}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">Contratos em andamento</span>
              <span className={cn("text-xs font-semibold flex items-center gap-0.5", getVariationColor(emCursoVariation))}>
                {getVariationIcon(emCursoVariation)} {Math.abs(emCursoVariation)}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{getPeriodReferenceText()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          {/* Filtros Rápidos e Busca */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { value: "hoje", label: "Hoje" },
                { value: "ontem", label: "Ontem" },
                { value: "7dias", label: "Últimos 7 dias" },
                { value: "mes", label: "Este mês" },
                { value: "ultimo_mes", label: "Último mês" },
              ].map((periodo) => (
                <Badge
                  key={periodo.value}
                  variant={periodoRapido === periodo.value ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer hover:opacity-80 transition-opacity px-3 py-1.5",
                    periodoRapido === periodo.value
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                  onClick={() => handlePeriodoRapido(periodo.value)}
                >
                  {periodo.label}
                </Badge>
              ))}
              
              <div className="flex-1 min-w-[200px] ml-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, escritório ou whatsapp..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo Agente</label>
              <Select value={tipoAgente} onValueChange={setTipoAgente}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">TODOS</SelectItem>
                  <SelectItem value="SDR">SDR</SelectItem>
                  <SelectItem value="CLOSER">CLOSER</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Escritórios</label>
              <Popover open={agentSearchOpen} onOpenChange={setAgentSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={agentSearchOpen}
                    className="w-full justify-between"
                  >
                    {selectedAgent ? selectedAgent.label : "Selecione..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar escritório..." />
                    <CommandList>
                      <CommandEmpty>Nenhum escritório encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="todos"
                          onSelect={() => {
                            setSelectedAgentId(null);
                            setAgentSearchOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedAgentId === null ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Todos os escritórios
                        </CommandItem>
                        {agentsList?.map((agent) => (
                          <CommandItem
                            key={agent.agent_id}
                            value={agent.label}
                            onSelect={() => {
                              setSelectedAgentId(agent.agent_id);
                              setAgentSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedAgentId === agent.agent_id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {agent.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status Contrato</label>
              <Select 
                value={statusContrato} 
                onValueChange={(value) => {
                  setStatusContrato(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">TODOS</SelectItem>
                  <SelectItem value="CONTRATOS">TODOS CONTRATOS</SelectItem>
                  <SelectItem value="SIGNED">ASSINADO</SelectItem>
                  <SelectItem value="CREATED">EM CURSO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, "dd/MM/yyyy") : <span>Selecione...</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={setDataInicio}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy") : <span>Selecione...</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={setDataFim}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2 flex items-end">
              <Button variant="outline" onClick={handleLimparFiltros} className="w-full">
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              Erro ao carregar dados
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum registro encontrado para os filtros selecionados.
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  Listagem de Leads ({filteredData.length} {filteredData.length === 1 ? 'registro' : 'registros'})
                </h2>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={isExporting || filteredData.length === 0}
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Exportando...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Exportar
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Exportar PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Exportar XLSX
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Exportar CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">DATA</TableHead>
                      <TableHead className="w-[120px]">CÓDIGO</TableHead>
                      <TableHead className="min-w-[200px]">NOME/ESCRITÓRIO</TableHead>
                      <TableHead className="w-[130px]">WHATSAPP</TableHead>
                      <TableHead className="w-[120px] text-center">CONTRATO</TableHead>
                      <TableHead className="w-[100px] text-center">TOTAL MSG</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((record, index) => (
                      <TableRow 
                        key={`${record.session_id}-${index}`}
                        className={cn(
                          "transition-colors",
                          record.status_document === 'CREATED' && "bg-yellow-500/5 hover:bg-yellow-500/10",
                          record.status_document === 'SIGNED' && "bg-green-500/5 hover:bg-green-500/10"
                        )}
                      >
              <TableCell>
                {formatExternalDbDate(record.created_at || record.max_created_at, "dd/MM/yy HH:mm")}
              </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{record.cod_agent}</span>
                            {record.perfil_agent && (
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-medium w-fit",
                                record.perfil_agent === 'SDR'
                                  ? "bg-blue-500/10 text-blue-500"
                                  : record.perfil_agent === 'CLOSER'
                                  ? "bg-purple-500/10 text-purple-500"
                                  : "bg-gray-500/10 text-gray-500"
                              )}>
                                {record.perfil_agent}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {record.name || record.business_name || "-"}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {record.business_name || record.name || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{record.whatsapp || "-"}</TableCell>
                        <TableCell className="text-center">
                          {record.status_document ? (
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium inline-block",
                              record.status_document === 'SIGNED' 
                                ? "bg-green-500/10 text-green-500" 
                                : record.status_document === 'CREATED'
                                ? "bg-yellow-500/10 text-yellow-500"
                                : "bg-gray-500/10 text-gray-500"
                            )}>
                              {record.status_document === 'SIGNED' ? 'ASSINADO' : 
                               record.status_document === 'CREATED' ? 'EM CURSO' : 
                               record.status_document}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{record.total_msg || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Registros por página:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    title="Primeira página"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    title="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {visiblePages.map((page, index) => (
                    page === '...' ? (
                      <span key={`dots-${index}`} className="px-2 text-muted-foreground">...</span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage(page as number)}
                      >
                        {page}
                      </Button>
                    )
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    title="Próxima página"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Última página"
                  >
                    <ChevronsLeft className="h-4 w-4 rotate-180" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
