import { useState, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Upload, FileText, Loader2, CheckCircle2, AlertTriangle, Download, Send, ArrowLeft, ArrowRight, Bell, Plus, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useUploadTemplate, useGeneratePreview, useCreateZapSignTemplate, useUpdateTemplateObservers } from "@/hooks/useZapSignTemplates";
import { useCreateContractTemplate, LegalRepresentativeData } from "@/hooks/usePublicContractTemplates";
import { LegalRepresentativeForm } from "./LegalRepresentativeForm";

// Standard ZapSign variables that should be present in contracts
const ZAPSIGN_STANDARD_VARIABLES = [
  'Nome', 'CPF', 'RG', 'Naturalidade', 'Estado Civil',
  'Endereço Completo', 'Bairro', 'Cidade', 'Estado', 'CEP',
  'Telefone', 'DATA', 'ProfissaoCliente', 'EmailCliente',
  'Nome_Filho', 'CPF_Filho', 'DataNascimento_Filho'
];

// Fake data for testing
const ZAPSIGN_FAKE_DATA: Record<string, string> = {
  'Nome': 'João da Silva Santos',
  'CPF': '123.456.789-00',
  'RG': '12.345.678-9 SSP/SP',
  'Naturalidade': 'São Paulo/SP',
  'Estado Civil': 'Solteiro(a)',
  'Endereço Completo': 'Rua das Flores, 123, Apto 45',
  'Bairro': 'Centro',
  'Cidade': 'São Paulo',
  'Estado': 'SP',
  'CEP': '01234-567',
  'Telefone': '(11) 99999-9999',
  'DATA': new Date().toLocaleDateString('pt-BR'),
  'ProfissaoCliente': 'Empresário(a)',
  'EmailCliente': 'joao.silva@email.com.br',
  'Nome_Filho': 'Maria da Silva Santos',
  'CPF_Filho': '987.654.321-00',
  'DataNascimento_Filho': '01/01/2015',
  // Legal representative variables
  'REPRESENTANTE_NOME': 'José da Silva',
  'REPRESENTANTE_CPF': '111.222.333-44',
  'REPRESENTANTE_RELACAO': 'Pai',
  'MENOR_NOME': 'Maria da Silva',
  'MENOR_DATA_NASCIMENTO': '15/03/2010'
};

type WizardStep = 'upload' | 'variables' | 'confirm';

interface UploadTemplateWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codAgent: string;
  agentName?: string;
  sessionToken: string | null;
  cases: any[];
  onSuccess: () => void;
}

export function UploadTemplateWizard({ 
  open, 
  onOpenChange, 
  codAgent, 
  agentName,
  sessionToken, 
  cases,
  onSuccess 
}: UploadTemplateWizardProps) {
  // Step state
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  
  // Upload step state
  const [templateName, setTemplateName] = useState("");
  const [selectedCase, setSelectedCase] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isLegalRepresentative, setIsLegalRepresentative] = useState(false);
  const [legalRepData, setLegalRepData] = useState<LegalRepresentativeData>({});
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Variables step state
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [hasDownloadedPreview, setHasDownloadedPreview] = useState(false);
  const [previewConfirmed, setPreviewConfirmed] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  // Notification emails state
  const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Mutations
  const uploadMutation = useUploadTemplate();
  const generatePreviewMutation = useGeneratePreview();
  const createZapSignMutation = useCreateZapSignTemplate();
  const createTemplateMutation = useCreateContractTemplate();
  const updateObserversMutation = useUpdateTemplateObservers();

  // Functions for notification emails
  const handleAddEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    
    if (!email.includes('@') || !email.includes('.')) {
      toast.error("Email inválido");
      return;
    }
    
    if (notificationEmails.includes(email)) {
      toast.error("Email já adicionado");
      return;
    }
    
    if (notificationEmails.length >= 20) {
      toast.error("Limite máximo de 20 emails");
      return;
    }
    
    setNotificationEmails([...notificationEmails, email]);
    setNewEmail("");
  };

  const handleRemoveEmail = (email: string) => {
    setNotificationEmails(notificationEmails.filter(e => e !== email));
  };

  // Get case name for display
  const selectedCaseData = useMemo(() => {
    if (!selectedCase) return null;
    return cases.find(c => c.id.toString() === selectedCase);
  }, [selectedCase, cases]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.docx')) {
      setFile(droppedFile);
      if (!templateName) {
        setTemplateName(droppedFile.name.replace('.docx', ''));
      }
    } else {
      toast.error("Por favor, selecione um arquivo DOCX");
    }
  }, [templateName]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.docx')) {
      setFile(selectedFile);
      if (!templateName) {
        setTemplateName(selectedFile.name.replace('.docx', ''));
      }
    } else {
      toast.error("Por favor, selecione um arquivo DOCX");
    }
  };

  // Step 1 -> Step 2: Upload file and extract variables
  const handleUploadAndContinue = async () => {
    if (!file || !templateName || !sessionToken) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const result = await uploadMutation.mutateAsync({
        file,
        templateName,
        codAgent,
        caseId: selectedCase ? parseInt(selectedCase) : undefined,
        isLegalRepresentative,
        legalRepresentativeData: isLegalRepresentative ? legalRepData : undefined,
        sessionToken
      });

      setUploadResult(result);
      
      // Pre-fill with fake data
      const initialValues: Record<string, string> = {};
      result.variables.forEach((v: string) => {
        initialValues[v] = ZAPSIGN_FAKE_DATA[v] || `[${v}]`;
      });
      setVariableValues(initialValues);
      
      setCurrentStep('variables');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Erro ao fazer upload");
    }
  };

  // Generate preview DOCX with fake data
  const handleGeneratePreview = async () => {
    if (!uploadResult?.storage_path || !sessionToken) return;

    // Some browsers block downloads triggered after an async gap; keep user-gesture by opening a tab immediately.
    const preOpenedWindow = window.open("", "_blank");

    try {
      const result = await generatePreviewMutation.mutateAsync({
        storagePath: uploadResult.storage_path,
        testData: variableValues,
        sessionToken
      });

      const rawBase64 = (result.base64_content || "").includes(",")
        ? (result.base64_content.split(",").pop() as string)
        : result.base64_content;

      // Convert base64 to Blob (chunked to handle larger files)
      const byteCharacters = atob(rawBase64);
      const sliceSize = 1024;
      const byteArrays: BlobPart[] = [];

      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array<number>(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers) as unknown as BlobPart);
      }

      const blob = new Blob(byteArrays, {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      });

      // Create blob URL and store it for fallback
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
      const blobUrl = URL.createObjectURL(blob);
      setPreviewBlobUrl(blobUrl);

      // Prefer navigating the pre-opened tab (works even when download attribute is blocked)
      if (preOpenedWindow) {
        preOpenedWindow.location.href = blobUrl;
      } else {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `preview_${templateName}.docx`;
        link.target = "_blank";
        link.rel = "noopener";
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setHasDownloadedPreview(true);
      toast.success("Preview gerado. Se não baixar, clique em 'Baixar Preview'.");
    } catch (error: any) {
      if (preOpenedWindow) {
        try { preOpenedWindow.close(); } catch {
          // ignore
        }
      }
      console.error('Preview error:', error);
      toast.error(error.message || "Erro ao gerar preview");
    }
  };

  // Manual download fallback
  const handleManualDownload = () => {
    if (!previewBlobUrl) return;

    const opened = window.open(previewBlobUrl, "_blank");
    if (!opened) {
      const link = document.createElement('a');
      link.href = previewBlobUrl;
      link.download = `preview_${templateName}.docx`;
      link.target = "_blank";
      link.rel = "noopener";
      link.click();
    }
  };

  // Step 2 -> Step 3: Confirm and proceed
  const handleConfirmVariables = () => {
    setCurrentStep('confirm');
  };

  // Final step: Send to ZapSign
  const handleSendToZapSign = async () => {
    if (!uploadResult || !sessionToken) return;

    try {
      // Get the folder name
      const folderName = agentName ? `[${codAgent}] - ${agentName}` : codAgent;
      const caseName = selectedCaseData?.case_title || templateName;

      // Send to ZapSign first
      const zapsignResult = await createZapSignMutation.mutateAsync({
        storagePath: uploadResult.storage_path,
        templateName: caseName,
        folderName,
        variables: uploadResult.variables,
        sessionToken
      });

      // If notification emails are configured, update observers
      if (notificationEmails.length > 0 && zapsignResult.zapsign_template_id) {
        try {
          await updateObserversMutation.mutateAsync({
            templateToken: zapsignResult.zapsign_template_id,
            observers: notificationEmails,
            sessionToken
          });
          console.log('Observers updated successfully');
        } catch (observerError) {
          console.error('Failed to update observers:', observerError);
          toast.warning("Template criado, mas houve erro ao configurar notificações externas");
        }
      }

      // Save to database with ZapSign data
      await createTemplateMutation.mutateAsync({
        template: {
          template_name: templateName,
          storage_path: uploadResult.storage_path,
          file_name: uploadResult.file_name,
          file_size: uploadResult.file_size,
          variables: uploadResult.variables,
          agent_case_legal_id: selectedCase ? parseInt(selectedCase) : null,
          is_legal_representative: isLegalRepresentative,
          legal_representative_data: isLegalRepresentative ? legalRepData : {},
          cod_agent: codAgent,
          status: 'active',
          zapsign_template_id: zapsignResult.zapsign_template_id,
          zapsign_doc_token: zapsignResult.zapsign_doc_token
        },
        sessionToken
      });

      toast.success("Template enviado ao ZapSign com sucesso!");
      resetForm();
      onSuccess();
    } catch (error: any) {
      console.error('ZapSign error:', error);
      toast.error(error.message || "Erro ao enviar para ZapSign");
    }
  };

  const resetForm = () => {
    // Cleanup blob URL to prevent memory leak
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    setCurrentStep('upload');
    setTemplateName("");
    setSelectedCase("");
    setFile(null);
    setIsLegalRepresentative(false);
    setLegalRepData({});
    setUploadResult(null);
    setVariableValues({});
    setHasDownloadedPreview(false);
    setPreviewConfirmed(false);
    setPreviewBlobUrl(null);
    setNotificationEmails([]);
    setNewEmail("");
    setNotificationsOpen(false);
  };

  const handleBack = () => {
    if (currentStep === 'variables') {
      setCurrentStep('upload');
    } else if (currentStep === 'confirm') {
      setCurrentStep('variables');
    }
  };

  const isLoading = uploadMutation.isPending || generatePreviewMutation.isPending || 
                    createZapSignMutation.isPending || createTemplateMutation.isPending ||
                    updateObserversMutation.isPending;

  // Helper to check if a variable is clean (no XML tags)
  const isCleanVariable = (varName: string): boolean => {
    return varName && !varName.includes('<') && !varName.includes('>') && 
           !varName.includes('w:') && /^[\w\sÀ-ÿ_-]+$/.test(varName);
  };

  // Categorize variables - only show clean ones
  const { standardVars, customVars, missingStandardVars, cleanVariables } = useMemo(() => {
    if (!uploadResult?.variables) return { standardVars: [], customVars: [], missingStandardVars: [], cleanVariables: [] };
    
    const vars = (uploadResult.variables as string[]).filter(isCleanVariable);
    const standard = vars.filter(v => ZAPSIGN_STANDARD_VARIABLES.includes(v));
    const custom = vars.filter(v => !ZAPSIGN_STANDARD_VARIABLES.includes(v) && v.length < 50);
    const missing = ZAPSIGN_STANDARD_VARIABLES.filter(v => !vars.includes(v));
    
    return { standardVars: standard, customVars: custom, missingStandardVars: missing, cleanVariables: vars };
  }, [uploadResult?.variables]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 'upload' && "Novo Template de Contrato"}
            {currentStep === 'variables' && "Verificar Variáveis"}
            {currentStep === 'confirm' && "Confirmar Envio"}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'upload' && "Faça upload de um arquivo DOCX com variáveis no formato {{VARIAVEL}}"}
            {currentStep === 'variables' && "Revise as variáveis encontradas e gere um preview para validação"}
            {currentStep === 'confirm' && "Confirme os dados antes de enviar ao ZapSign"}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {['upload', 'variables', 'confirm'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep === step 
                  ? 'bg-primary text-primary-foreground' 
                  : index < ['upload', 'variables', 'confirm'].indexOf(currentStep)
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }
              `}>
                {index + 1}
              </div>
              {index < 2 && (
                <div className={`w-12 h-0.5 ${
                  index < ['upload', 'variables', 'confirm'].indexOf(currentStep)
                    ? 'bg-primary'
                    : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {currentStep === 'upload' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Nome do Template *</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ex: Contrato de Honorários"
              />
            </div>

            <div className="space-y-2">
              <Label>Caso Vinculado</Label>
              <Select value={selectedCase || "_none_"} onValueChange={(v) => setSelectedCase(v === "_none_" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um caso (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">Nenhum caso vinculado</SelectItem>
                  {cases.map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.case_title || `Caso #${c.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Arquivo DOCX *</Label>
              <div
                className={`
                  border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                  transition-colors
                  ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                  ${file ? 'bg-muted/50' : ''}
                `}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Arraste o arquivo aqui ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Apenas arquivos .docx
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="legalRep"
                checked={isLegalRepresentative}
                onCheckedChange={(checked) => setIsLegalRepresentative(checked === true)}
              />
              <Label htmlFor="legalRep" className="cursor-pointer">
                Contrato de Representante Legal (menor de idade, interdito, etc.)
              </Label>
            </div>

            {isLegalRepresentative && (
              <LegalRepresentativeForm
                data={legalRepData}
                onChange={setLegalRepData}
              />
            )}
          </div>
        )}

        {/* Step 2: Variables */}
        {currentStep === 'variables' && uploadResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Variáveis encontradas: {cleanVariables.length}
              </span>
              {missingStandardVars.length > 0 && (
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {missingStandardVars.length} padrão ausentes
                </Badge>
              )}
            </div>

            <ScrollArea className="h-[300px] border rounded-lg p-4">
              {standardVars.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Variáveis padrão ZapSign ({standardVars.length})
                  </p>
                  <div className="space-y-2">
                    {standardVars.map((v: string) => (
                      <div key={v} className="grid grid-cols-2 gap-2 items-center">
                        <Badge variant="secondary" className="justify-start font-mono text-xs">
                          {`{{${v}}}`}
                        </Badge>
                        <Input
                          value={variableValues[v] || ''}
                          onChange={(e) => setVariableValues(prev => ({ ...prev, [v]: e.target.value }))}
                          placeholder="Valor de teste"
                          className="h-8 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {customVars.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Variáveis personalizadas ({customVars.length})
                  </p>
                  <div className="space-y-2">
                    {customVars.map((v: string) => (
                      <div key={v} className="grid grid-cols-2 gap-2 items-center">
                        <Badge variant="outline" className="justify-start font-mono text-xs">
                          {`{{${v}}}`}
                        </Badge>
                        <Input
                          value={variableValues[v] || ''}
                          onChange={(e) => setVariableValues(prev => ({ ...prev, [v]: e.target.value }))}
                          placeholder="Valor de teste"
                          className="h-8 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {missingStandardVars.length > 0 && (
                <div className="mt-4 p-3 bg-amber-500/10 rounded-lg">
                  <p className="text-sm font-medium text-amber-600 mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Variáveis padrão não encontradas
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {missingStandardVars.slice(0, 10).map(v => (
                      <Badge key={v} variant="outline" className="text-xs text-muted-foreground">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                    {missingStandardVars.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{missingStandardVars.length - 10} mais
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>

            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Download className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Baixe o preview para verificar</p>
                <p className="text-xs text-muted-foreground">
                  O documento será gerado com os valores de teste acima
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleGeneratePreview}
                disabled={generatePreviewMutation.isPending}
              >
                {generatePreviewMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    Baixar
                  </>
                )}
              </Button>
            </div>

            {hasDownloadedPreview && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Preview gerado - verifique o documento
                  </div>
                  {previewBlobUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleManualDownload}
                      className="text-primary"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Baixar Preview
                    </Button>
                  )}
                </div>
                <div className="flex items-center space-x-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <Checkbox
                    id="confirmPreview"
                    checked={previewConfirmed}
                    onCheckedChange={(checked) => setPreviewConfirmed(checked === true)}
                  />
                  <Label htmlFor="confirmPreview" className="cursor-pointer text-sm">
                    Confirmo que verifiquei o preview e as variáveis estão corretas
                  </Label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirm */}
        {currentStep === 'confirm' && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nome do Template:</span>
                <span className="text-sm font-medium">{templateName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Caso Vinculado:</span>
                <span className="text-sm font-medium">
                  {selectedCaseData?.case_title || "Nenhum"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Arquivo:</span>
                <span className="text-sm font-medium">{file?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Variáveis:</span>
                <span className="text-sm font-medium">{uploadResult?.variables?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Representante Legal:</span>
                <span className="text-sm font-medium">{isLegalRepresentative ? "Sim" : "Não"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pasta no ZapSign:</span>
                <span className="text-sm font-medium">{agentName ? `[${codAgent}] - ${agentName}` : codAgent}</span>
              </div>
            </div>

            {/* External Notifications Section */}
            <div className="border rounded-lg overflow-hidden">
              <Collapsible open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Notificações Externas</span>
                    {notificationEmails.length > 0 && (
                      <Badge variant="secondary" className="ml-1">{notificationEmails.length}</Badge>
                    )}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${notificationsOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="border-t">
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Quando este template for assinado por todos os signatários, os emails abaixo receberão uma cópia do documento.
                    </p>
                    
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={handleAddEmail}
                        disabled={!newEmail || notificationEmails.length >= 20}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {notificationEmails.length > 0 && (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {notificationEmails.map((email) => (
                          <div key={email} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm truncate">{email}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0"
                              onClick={() => handleRemoveEmail(email)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      {notificationEmails.length}/20 emails
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Send className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Pronto para enviar ao ZapSign</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    O template será criado na conta master do ZapSign e ficará disponível para uso.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div>
            {currentStep !== 'upload' && (
              <Button variant="ghost" onClick={handleBack} disabled={isLoading}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            
            {currentStep === 'upload' && (
              <Button onClick={handleUploadAndContinue} disabled={isLoading || !file || !templateName}>
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            )}
            
            {currentStep === 'variables' && (
              <Button 
                onClick={handleConfirmVariables} 
                disabled={isLoading || !previewConfirmed}
                title={!previewConfirmed ? "Baixe o preview e confirme que está correto" : ""}
              >
                Próximo
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            
            {currentStep === 'confirm' && (
              <Button onClick={handleSendToZapSign} disabled={isLoading}>
                {createZapSignMutation.isPending || createTemplateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Enviar ao ZapSign
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
