import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSelectedCodAgent } from "@/context/SelectedCodAgentContext";
import { useJuliaContractsData, useJuliaContractsSummary, useJuliaContractsComparison, JuliaContractRecord } from "@/hooks/useJuliaContracts";
import { useAgentsList } from "@/hooks/useJuliaPerformance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileCheck, FileText, Scale, Search, Calendar as CalendarIcon, Download, Link, CheckCircle, ChevronsUpDown, Check, MessageCircle, ChevronsLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format, parseISO, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { Contact } from "@/types/chat";
import { LinkCaseDialog } from "@/components/contracts/LinkCaseDialog";
import { ContractDetailsDialog } from "@/components/contracts/ContractDetailsDialog";
import { ValidateContractDialog } from "@/components/contracts/ValidateContractDialog";
import { ContractActionsMenu } from "@/components/contracts/ContractActionsMenu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export default function JuliaContracts() {
  const { profile } = useAuth();
  const { selectedCodAgent } = useSelectedCodAgent();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isAdmin = profile?.role === 'admin';
  const userCodAgentsFilter = isAdmin ? null : (selectedCodAgent ? [selectedCodAgent] : []);

  const [tipoAgente, setTipoAgente] = useState<string>("TODOS");
  const [agenteId, setAgenteId] = useState<string | null>(null);
  const [statusContrato, setStatusContrato] = useState<string>("TODOS");
  const [dataInicio, setDataInicio] = useState<Date | undefined>(new Date());
  const [dataFim, setDataFim] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [periodoRapido, setPeriodoRapido] = useState<string>("");
  const [agentSearchOpen, setAgentSearchOpen] = useState(false);

  const [selectedContract, setSelectedContract] = useState<JuliaContractRecord | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: contractsData, isLoading } = useJuliaContractsData(
    tipoAgente,
    agenteId,
    dataInicio,
    dataFim,
    statusContrato,
    userCodAgentsFilter
  );

  const { data: summaryData } = useJuliaContractsSummary(
    tipoAgente,
    agenteId,
    dataInicio,
    dataFim,
    statusContrato,
    userCodAgentsFilter
  );

  const { data: previousSummaryData } = useJuliaContractsComparison(
    tipoAgente,
    agenteId,
    dataInicio,
    dataFim,
    statusContrato,
    userCodAgentsFilter
  );

  const { data: agentsList } = useAgentsList();

  const summary = summaryData?.[0] || {
    total_contratos: 0,
    total_assinados: 0,
    total_em_curso: 0,
    taxa_assinatura: 0,
  };

  const previousSummary = previousSummaryData?.[0] || {
    total_contratos: 0,
    total_assinados: 0,
    total_em_curso: 0,
    taxa_assinatura: 0,
  };

  // Funções helper para calcular variação
  const calculateVariation = (current: number, previous: number) => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    const variation = ((current - previous) / previous) * 100;
    return Math.round(variation * 10) / 10;
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
    if (!dataInicio || !dataFim) return "vs período anterior";
    
    switch (periodoRapido) {
      case "hoje":
        return "vs dia anterior";
      case "ontem":
        return "vs anteontem";
      case "7dias":
        return "vs 7 dias anteriores";
      case "mes":
        return "vs mês anterior";
      case "ultimo_mes":
        return "vs mês anterior ao último";
      default:
        const inicioNorm = new Date(dataInicio);
        inicioNorm.setHours(0, 0, 0, 0);
        const fimNorm = new Date(dataFim);
        fimNorm.setHours(0, 0, 0, 0);
        const diffInDays = Math.floor((fimNorm.getTime() - inicioNorm.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return diffInDays === 1 ? "vs dia anterior" : `vs ${diffInDays} dias anteriores`;
    }
  };

  const contratosVariation = calculateVariation(summary.total_contratos, previousSummary.total_contratos);
  const assinadosVariation = calculateVariation(summary.total_assinados, previousSummary.total_assinados);
  const emCursoVariation = calculateVariation(summary.total_em_curso, previousSummary.total_em_curso);
  const taxaVariation = calculateVariation(Number(summary.taxa_assinatura || 0), Number(previousSummary.taxa_assinatura || 0));

  const selectedAgent = agentsList?.find(a => a.agent_id === agenteId);

  const filteredData = useMemo(() => {
    if (!contractsData) return [];
    if (!searchTerm) return contractsData;

    const term = searchTerm.toLowerCase();
    return contractsData.filter(contract =>
      contract.signer_name?.toLowerCase().includes(term) ||
      contract.cod_document?.toLowerCase().includes(term) ||
      contract.whatsapp?.includes(term) ||
      contract.signer_cpf?.includes(term)
    );
  }, [contractsData, searchTerm]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage, itemsPerPage]);

  // Função helper para calcular páginas visíveis
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

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const visiblePages = getVisiblePages(currentPage, totalPages);

  const handlePeriodoRapido = (periodo: string) => {
    const hoje = new Date();
    switch (periodo) {
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
        setDataInicio(subDays(hoje, 7));
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
    }
    setCurrentPage(1);
  };

  const handleLimparFiltros = () => {
    setTipoAgente("TODOS");
    setAgenteId(null);
    setStatusContrato("TODOS");
    setDataInicio(new Date());
    setDataFim(new Date());
    setPeriodoRapido("");
    setCurrentPage(1);
  };

  const handleOpenChat = (contract: JuliaContractRecord) => {
    const contact: Contact = {
      id: contract.session_id?.toString() || '',
      name: contract.signer_name || 'Sem nome',
      phone: contract.whatsapp?.toString() || '',
      lastMessage: '',
      lastMessageTime: contract.created_at || '',
      unreadCount: 0,
      isGroup: false,
    };
    navigate("/chat", { state: { contact } });
  };

  const handleLinkCase = (contract: JuliaContractRecord) => {
    setSelectedContract(contract);
    setShowLinkDialog(true);
  };

  const handleViewDetails = (contract: JuliaContractRecord) => {
    setSelectedContract(contract);
    setShowDetailsDialog(true);
  };

  const handleViewSummary = (contract: JuliaContractRecord) => {
    setSelectedContract(contract);
    setShowSummaryDialog(true);
  };

  const handleValidate = (contract: JuliaContractRecord) => {
    setSelectedContract(contract);
    setShowValidateDialog(true);
  };

  const handleDeleteClick = (contract: JuliaContractRecord) => {
    setSelectedContract(contract);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedContract) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("external-db-query", {
        body: {
          query: `
            UPDATE public.sing_document 
            SET status_document = 'DELETED', updated_at = NOW() 
            WHERE cod_document = $1
          `,
          params: [selectedContract.cod_document],
        },
      });

      if (error) throw error;

      toast.success("Contrato excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["julia-contracts-data"] });
      queryClient.invalidateQueries({ queryKey: ["julia-contracts-summary"] });
      setShowDeleteDialog(false);
    } catch (error: any) {
      toast.error(`Erro ao excluir contrato: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTimeToSign = (dataContrato: string | null, dataAssinatura: string | null) => {
    if (!dataContrato || !dataAssinatura) return "---";
    
    const inicio = new Date(dataContrato);
    const fim = new Date(dataAssinatura);
    
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) return "---";
    
    const diffMs = fim.getTime() - inicio.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "---";
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatWhatsApp = (phone: string | null | undefined) => {
    if (!phone) return '-';
    const phoneStr = String(phone);
    const cleaned = phoneStr.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7)}`;
    }
    return phoneStr;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return <Badge className="bg-green-500">Assinado</Badge>;
      case 'CREATED':
        return <Badge className="bg-yellow-500">Em Curso</Badge>;
      case 'DELETED':
        return <Badge className="bg-red-500">Excluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Contratos da Julia</h1>
      </div>

      {/* Cards KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contratos</CardTitle>
            <div className="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <Scale className="h-5 w-5 text-cyan-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.total_contratos}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">
                Total de contratos
              </span>
              <span className={cn("text-xs font-semibold flex items-center gap-0.5", getVariationColor(contratosVariation))}>
                {getVariationIcon(contratosVariation)} {Math.abs(contratosVariation)}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {getPeriodReferenceText()}
            </p>
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
            <div className="text-3xl font-bold">{summary.total_assinados}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">
                Contratos assinados
              </span>
              <span className={cn("text-xs font-semibold flex items-center gap-0.5", getVariationColor(assinadosVariation))}>
                {getVariationIcon(assinadosVariation)} {Math.abs(assinadosVariation)}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {getPeriodReferenceText()}
            </p>
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
            <div className="text-3xl font-bold">{summary.total_em_curso}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">
                Contratos em andamento
              </span>
              <span className={cn("text-xs font-semibold flex items-center gap-0.5", getVariationColor(emCursoVariation))}>
                {getVariationIcon(emCursoVariation)} {Math.abs(emCursoVariation)}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {getPeriodReferenceText()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Assinatura</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <FileCheck className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Number(summary.taxa_assinatura || 0).toFixed(1)}%</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">
                Taxa de assinatura
              </span>
              <span className={cn("text-xs font-semibold flex items-center gap-0.5", getVariationColor(taxaVariation))}>
                {getVariationIcon(taxaVariation)} {Math.abs(taxaVariation)}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {getPeriodReferenceText()}
            </p>
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
                            setAgenteId(null);
                            setAgentSearchOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              agenteId === null ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Todos os escritórios
                        </CommandItem>
                        {agentsList?.map((agent) => (
                          <CommandItem
                            key={agent.agent_id}
                            value={agent.label}
                            onSelect={() => {
                              setAgenteId(agent.agent_id);
                              setAgentSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                agenteId === agent.agent_id ? "opacity-100" : "opacity-0"
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
                  <CalendarPicker
                    mode="single"
                    selected={dataInicio || undefined}
                    onSelect={(date) => date && setDataInicio(startOfDay(date))}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarPicker
                    mode="single"
                    selected={dataFim || undefined}
                    onSelect={(date) => date && setDataFim(endOfDay(date))}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <Button
                variant="outline"
                onClick={handleLimparFiltros}
                className="w-full"
              >
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome/Escritório</TableHead>
                    <TableHead>Contratante</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Caso</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((contract) => (
                    <TableRow 
                      key={contract.cod_document}
                      className={cn(
                        "transition-colors",
                        contract.status_document === 'CREATED' && "bg-yellow-500/5 hover:bg-yellow-500/10",
                        contract.status_document === 'SIGNED' && "bg-green-500/5 hover:bg-green-500/10"
                      )}
                    >
            <TableCell>
              {(() => {
                const date = new Date(contract.data_assinatura || contract.created_at);
                if (isNaN(date.getTime())) return "-";
                return format(date, "dd/MM/yy HH:mm");
              })()}
            </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{contract.cod_agent}</span>
                          {contract.perfil_agent && (
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-medium w-fit",
                              contract.perfil_agent === 'SDR'
                                ? "bg-blue-500/10 text-blue-500"
                                : contract.perfil_agent === 'CLOSER'
                                ? "bg-purple-500/10 text-purple-500"
                                : "bg-gray-500/10 text-gray-500"
                            )}>
                              {contract.perfil_agent}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {contract.name || contract.business_name || "-"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {contract.business_name || contract.name || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{contract.signer_name}</TableCell>
                      <TableCell>{formatWhatsApp(contract.whatsapp)}</TableCell>
                      <TableCell>
                        {contract.document_case_id ? (
                          <Badge
                            style={{ backgroundColor: contract.case_category_color || '#6366f1' }}
                            className="cursor-pointer hover:opacity-80"
                            onClick={() => handleViewDetails(contract)}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {contract.case_title}
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="cursor-pointer hover:bg-red-600"
                            onClick={() => handleLinkCase(contract)}
                          >
                            <Link className="w-3 h-3 mr-1" />
                            Vincular Caso
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          {/* Badge principal do status */}
                          {contract.status_document ? (
                            <Badge 
                              variant={
                                contract.status_document === 'SIGNED' 
                                  ? 'default' 
                                  : contract.status_document === 'CREATED'
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className={cn(
                                "text-xs font-medium",
                                contract.status_document === 'SIGNED' 
                                  ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" 
                                  : contract.status_document === 'CREATED'
                                  ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                                  : "bg-gray-500/10 text-gray-500"
                              )}
                            >
                              {contract.status_document === 'SIGNED' ? 'ASSINADO' : 
                               contract.status_document === 'CREATED' ? 'EM CURSO' : 
                               contract.status_document}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                          
                          {/* Badge de tempo até assinatura (pequeno) */}
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded",
          contract.status_document === 'SIGNED'
            ? "bg-green-500/10 text-green-600"
            : "bg-gray-500/10 text-muted-foreground"
        )}>
          {formatTimeToSign(contract.created_at, contract.data_assinatura)}
        </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <ContractActionsMenu
                          contract={contract}
                          onOpenChat={() => handleOpenChat(contract)}
                          onViewDetails={() => handleViewDetails(contract)}
                          onViewSummary={() => handleViewSummary(contract)}
                          onValidate={() => handleValidate(contract)}
                          onDelete={() => handleDeleteClick(contract)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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
                        className={cn(
                          "h-8 w-8 p-0",
                          currentPage === page && "bg-primary text-primary-foreground"
                        )}
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
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <LinkCaseDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        contract={selectedContract}
      />

      <ContractDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        contract={selectedContract}
      />

      <ValidateContractDialog
        open={showValidateDialog}
        onOpenChange={setShowValidateDialog}
        contract={selectedContract}
      />

      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Resumo do Caso</DialogTitle>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-lg">
            <p className="whitespace-pre-wrap text-sm">{selectedContract?.resumo_do_caso}</p>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contrato #{selectedContract?.cod_document}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
