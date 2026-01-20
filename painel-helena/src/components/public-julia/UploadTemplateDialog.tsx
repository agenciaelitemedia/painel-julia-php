import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUploadTemplate } from "@/hooks/useZapSignTemplates";
import { useCreateContractTemplate } from "@/hooks/usePublicContractTemplates";
import { LegalRepresentativeForm } from "./LegalRepresentativeForm";
import { LegalRepresentativeData } from "@/hooks/usePublicContractTemplates";

interface UploadTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codAgent: string;
  sessionToken: string | null;
  cases: any[];
  onSuccess: () => void;
}

export function UploadTemplateDialog({ 
  open, 
  onOpenChange, 
  codAgent, 
  sessionToken, 
  cases,
  onSuccess 
}: UploadTemplateDialogProps) {
  const [templateName, setTemplateName] = useState("");
  const [selectedCase, setSelectedCase] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isLegalRepresentative, setIsLegalRepresentative] = useState(false);
  const [legalRepData, setLegalRepData] = useState<LegalRepresentativeData>({});
  const [isDragOver, setIsDragOver] = useState(false);

  const uploadMutation = useUploadTemplate();
  const createTemplateMutation = useCreateContractTemplate();

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

  const handleSubmit = async () => {
    if (!file || !templateName || !sessionToken) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      // Upload to storage
      const uploadResult = await uploadMutation.mutateAsync({
        file,
        templateName,
        codAgent,
        caseId: selectedCase ? parseInt(selectedCase) : undefined,
        isLegalRepresentative,
        legalRepresentativeData: isLegalRepresentative ? legalRepData : undefined,
        sessionToken
      });

      // Save to database
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
          status: 'draft'
        },
        sessionToken
      });

      toast.success("Template criado com sucesso!");
      resetForm();
      onSuccess();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Erro ao criar template");
    }
  };

  const resetForm = () => {
    setTemplateName("");
    setSelectedCase("");
    setFile(null);
    setIsLegalRepresentative(false);
    setLegalRepData({});
  };

  const isLoading = uploadMutation.isPending || createTemplateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Template de Contrato</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo DOCX com variáveis no formato {"{{VARIAVEL}}"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="templateName">Nome do Template *</Label>
            <Input
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Ex: Contrato de Honorários"
            />
          </div>

          {/* Case Selection */}
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
                    {c.nome_caso || `Caso #${c.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
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

          {/* Legal Representative Checkbox */}
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

          {/* Legal Representative Form */}
          {isLegalRepresentative && (
            <LegalRepresentativeForm
              data={legalRepData}
              onChange={setLegalRepData}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !file || !templateName}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Próximo: Variáveis"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
