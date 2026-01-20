import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileSignature, Loader2 } from "lucide-react";
import { usePublicContractTemplates, ContractTemplate } from "@/hooks/usePublicContractTemplates";
import { usePublicAgentCases } from "@/hooks/usePublicAgentCases";
import { UploadTemplateWizard } from "./UploadTemplateWizard";
import { TemplateCard } from "./TemplateCard";
import { TemplateVariablesEditor } from "./TemplateVariablesEditor";

interface ContractTemplatesTabProps {
  codAgent: string;
  agentName?: string;
  sessionToken: string | null;
  generateFreshToken: (() => string | null) | null;
}

export function ContractTemplatesTab({ codAgent, agentName, sessionToken, generateFreshToken }: ContractTemplatesTabProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [filterCase, setFilterCase] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const { data: templates = [], isLoading, refetch } = usePublicContractTemplates({
    codAgent,
    sessionToken,
    filters: {
      caseId: filterCase !== "all" ? parseInt(filterCase) : undefined,
      status: filterStatus !== "all" ? filterStatus : undefined,
      isLegalRepresentative: filterType === "legal_rep" ? true : filterType === "normal" ? false : undefined
    }
  });

  const { data: cases = [] } = usePublicAgentCases(codAgent, sessionToken, generateFreshToken);

  const handleUploadSuccess = () => {
    setIsUploadOpen(false);
    refetch();
  };

  const handleEditVariables = (template: ContractTemplate) => {
    setSelectedTemplate(template);
  };

  const handleCloseEditor = () => {
    setSelectedTemplate(null);
    refetch();
  };

  if (selectedTemplate) {
    return (
      <TemplateVariablesEditor
        template={selectedTemplate}
        sessionToken={sessionToken}
        generateFreshToken={generateFreshToken}
        onClose={handleCloseEditor}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Templates de Contratos
            </CardTitle>
            <CardDescription>
              Gerencie os templates para assinatura via ZapSign
            </CardDescription>
          </div>
          <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Select value={filterCase} onValueChange={setFilterCase}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por caso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Casos</SelectItem>
              {cases.map((c: any) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.case_title || `Caso #${c.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="testing">Testando</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="error">Erro</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="legal_rep">Representante Legal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Templates List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileSignature className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum template encontrado</p>
            <p className="text-sm">Clique em "Novo Template" para adicionar</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                sessionToken={sessionToken}
                onEdit={() => handleEditVariables(template)}
                onRefresh={refetch}
              />
            ))}
          </div>
        )}
      </CardContent>

      <UploadTemplateWizard
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        codAgent={codAgent}
        agentName={agentName}
        sessionToken={sessionToken}
        cases={cases}
        onSuccess={handleUploadSuccess}
      />
    </Card>
  );
}
