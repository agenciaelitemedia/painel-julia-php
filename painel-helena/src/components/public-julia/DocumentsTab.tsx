import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CalendarIcon,
  Search,
  FileText,
  Scale,
  FileCheck,
  StickyNote,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Files,
} from "lucide-react";
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getNowInBrazil, formatExternalDbDate } from "@/lib/utils/timezone";
import { usePublicDocumentsData, calculateDocumentsSummary, DocumentRecord } from "@/hooks/usePublicDocumentsData";
import { usePublicAgentMutations } from "@/hooks/usePublicAgentMutations";
import { CaseNotesDialog } from "./CaseNotesDialog";
import { DocumentViewerDialog } from "./DocumentViewerDialog";

interface DocumentsTabProps {
  countId: string | null;
  codAgents: string[];
  sessionToken: string | null;
  generateFreshToken: (() => string | null) | null;
}

export function DocumentsTab({ countId, codAgents, sessionToken, generateFreshToken }: DocumentsTabProps) {
  // Estados dos filtros
  const [dataInicio, setDataInicio] = useState<Date | undefined>(getNowInBrazil());
  const [dataFim, setDataFim] = useState<Date | undefined>(getNowInBrazil());
  const [periodoRapido, setPeriodoRapido] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<string>("TODOS");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Estados dos modais
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedNoteRecord, setSelectedNoteRecord] = useState<DocumentRecord | null>(null);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    content: string | null;
    type: "resume" | "legal_report" | "initial_petition";
    clientName?: string;
  } | null>(null);
  const [isSavingNote, setIsSavingNote] = useState(false);

  const { updateDocumentNote } = usePublicAgentMutations();

  // Buscar dados
  const { data: documentsData, isLoading, refetch } = usePublicDocumentsData(
    countId,
    dataInicio || null,
    dataFim || null,
    codAgents,
    selectedAgent,
    sessionToken,
    generateFreshToken
  );

  // Filtrar dados por busca textual (filtro de agente agora é feito no backend)
  const filteredData = useMemo(() => {
    if (!documentsData) return [];
    
    let data = documentsData;
    
    // Filtro por busca textual
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      data = data.filter(record =>
        (record.name?.toLowerCase().includes(search)) ||
        (record.business_name?.toLowerCase().includes(search)) ||
        (String(record.whatsapp_number || "").includes(search)) ||
        (String(record.cod_agent || "").toLowerCase().includes(search))
      );
    }
    
    return data;
  }, [documentsData, searchTerm]);

  // Calcular summary baseado nos dados filtrados
  const summary = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { total: 0, withResume: 0, withLegalReport: 0, withInitialPetition: 0 };
    }
    return calculateDocumentsSummary(filteredData);
  }, [filteredData]);

  // Paginação
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

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
    }
    setCurrentPage(1);
  };

  const handleLimparFiltros = () => {
    setDataInicio(getNowInBrazil());
    setDataFim(getNowInBrazil());
    setPeriodoRapido("");
    setSearchTerm("");
    setSelectedAgent("TODOS");
    setCurrentPage(1);
  };

  const openNotesDialog = (record: DocumentRecord) => {
    setSelectedNoteRecord(record);
    setNotesDialogOpen(true);
  };

  const openDocumentDialog = (
    record: DocumentRecord,
    type: "resume" | "legal_report" | "initial_petition"
  ) => {
    setSelectedDocument({
      content: record[type],
      type,
      clientName: record.name || record.business_name,
    });
    setDocumentDialogOpen(true);
  };

  const handleSaveNote = async (note: string) => {
    if (!selectedNoteRecord || !sessionToken) return;
    
    setIsSavingNote(true);
    try {
      const freshToken = generateFreshToken ? generateFreshToken() : sessionToken;
      await updateDocumentNote.mutateAsync({
        id: selectedNoteRecord.id,
        note_case: note,
        sessionToken: freshToken || sessionToken,
      });
      await refetch();
      setNotesDialogOpen(false);
    } finally {
      setIsSavingNote(false);
    }
  };

  const hasContent = (value: string | null) => value && value.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Totalizadores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <Files className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com Resumo</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.withResume}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com Laudo</CardTitle>
            <Scale className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.withLegalReport}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com Petição</CardTitle>
            <FileCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.withInitialPetition}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Cod. Agentes */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Cod. Agentes</label>
              <Select 
                value={selectedAgent} 
                onValueChange={(value) => {
                  setSelectedAgent(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  {codAgents.map((agent) => (
                    <SelectItem key={agent} value={agent}>
                      {agent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Período Rápido */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Período</label>
              <Select value={periodoRapido} onValueChange={handlePeriodoRapido}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="ontem">Ontem</SelectItem>
                  <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                  <SelectItem value="mes">Este mês</SelectItem>
                  <SelectItem value="ultimo_mes">Mês anterior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data Início */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={(date) => {
                      setDataInicio(date);
                      setPeriodoRapido("");
                      setCurrentPage(1);
                    }}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Fim */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={(date) => {
                      setDataFim(date);
                      setPeriodoRapido("");
                      setCurrentPage(1);
                    }}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Busca */}
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome, WhatsApp, código..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Limpar */}
            <Button variant="outline" onClick={handleLimparFiltros}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">DATA</TableHead>
                      <TableHead className="w-[100px]">CÓDIGO</TableHead>
                      <TableHead>NOME / ESCRITÓRIO</TableHead>
                      <TableHead className="w-[140px]">WHATSAPP</TableHead>
                      <TableHead className="w-[80px] text-center">MSG</TableHead>
                      <TableHead className="w-[160px] text-center">AÇÕES</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum registro encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((record, index) => (
                        <TableRow key={`${record.id}-${index}`}>
                        <TableCell className="text-sm">
                            {formatExternalDbDate(record.created_at, "dd/MM/yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {String(record.cod_agent ?? "")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium truncate max-w-[200px]">
                                {record.name || "-"}
                              </span>
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {record.business_name || "-"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {record.whatsapp_number || "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{record.total_msg || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openNotesDialog(record)}
                                  >
                                    <StickyNote
                                      className={cn(
                                        "h-4 w-4",
                                        hasContent(record.note_case)
                                          ? "text-amber-500"
                                          : "text-muted-foreground"
                                      )}
                                    />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Notas do Caso</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openDocumentDialog(record, "resume")}
                                    disabled={!hasContent(record.resume)}
                                  >
                                    <FileText
                                      className={cn(
                                        "h-4 w-4",
                                        hasContent(record.resume)
                                          ? "text-blue-500"
                                          : "text-muted-foreground/40"
                                      )}
                                    />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Resumo</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openDocumentDialog(record, "legal_report")}
                                    disabled={!hasContent(record.legal_report)}
                                  >
                                    <Scale
                                      className={cn(
                                        "h-4 w-4",
                                        hasContent(record.legal_report)
                                          ? "text-purple-500"
                                          : "text-muted-foreground/40"
                                      )}
                                    />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Laudo Jurídico</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openDocumentDialog(record, "initial_petition")}
                                    disabled={!hasContent(record.initial_petition)}
                                  >
                                    <FileCheck
                                      className={cn(
                                        "h-4 w-4",
                                        hasContent(record.initial_petition)
                                          ? "text-green-500"
                                          : "text-muted-foreground/40"
                                      )}
                                    />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Petição Inicial</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {filteredData.length} registros
                    </span>
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
                    <span className="text-sm text-muted-foreground">por página</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm px-2">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CaseNotesDialog
        open={notesDialogOpen}
        onOpenChange={setNotesDialogOpen}
        noteCase={selectedNoteRecord?.note_case || null}
        recordId={selectedNoteRecord?.id || 0}
        onSave={handleSaveNote}
        isSaving={isSavingNote}
      />

      {selectedDocument && (
        <DocumentViewerDialog
          open={documentDialogOpen}
          onOpenChange={setDocumentDialogOpen}
          content={selectedDocument.content}
          documentType={selectedDocument.type}
          clientName={selectedDocument.clientName}
        />
      )}
    </div>
  );
}
