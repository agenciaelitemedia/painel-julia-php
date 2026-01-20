import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FlaskConical, Send, Loader2, CheckCircle2, User } from "lucide-react";
import { toast } from "sonner";
import { ContractTemplate, useUpdateContractTemplate } from "@/hooks/usePublicContractTemplates";
import { useTestTemplate, useCreateZapSignTemplate } from "@/hooks/useZapSignTemplates";

interface TemplateVariablesEditorProps {
  template: ContractTemplate;
  sessionToken: string | null;
  generateFreshToken: (() => string | null) | null;
  onClose: () => void;
}

const LEGAL_REP_VARIABLES = [
  'REPRESENTANTE_NOME',
  'REPRESENTANTE_CPF',
  'REPRESENTANTE_RELACAO',
  'MENOR_NOME',
  'MENOR_DATA_NASCIMENTO'
];

export function TemplateVariablesEditor({ 
  template, 
  sessionToken, 
  generateFreshToken,
  onClose 
}: TemplateVariablesEditorProps) {
  const [testData, setTestData] = useState<Record<string, string>>(
    template.test_data || {}
  );
  const [testResult, setTestResult] = useState<{
    preview_content: string;
    remaining_variables: string[];
    all_replaced: boolean;
  } | null>(null);

  const testMutation = useTestTemplate();
  const createZapSignMutation = useCreateZapSignTemplate();
  const updateTemplateMutation = useUpdateContractTemplate();

  // Separate regular variables from legal rep variables
  const regularVariables = template.variables?.filter(v => !LEGAL_REP_VARIABLES.includes(v)) || [];
  const legalRepVariables = template.is_legal_representative 
    ? template.variables?.filter(v => LEGAL_REP_VARIABLES.includes(v)) || []
    : [];

  // Pre-fill legal rep data if available
  const getInitialValue = (variable: string): string => {
    if (testData[variable]) return testData[variable];
    
    if (template.is_legal_representative && template.legal_representative_data) {
      const mapping: Record<string, keyof typeof template.legal_representative_data> = {
        'REPRESENTANTE_NOME': 'representative_name',
        'REPRESENTANTE_CPF': 'representative_cpf',
        'REPRESENTANTE_RELACAO': 'representative_relationship',
        'MENOR_NOME': 'minor_name',
        'MENOR_DATA_NASCIMENTO': 'minor_birth_date'
      };
      
      const field = mapping[variable];
      if (field && template.legal_representative_data[field]) {
        return template.legal_representative_data[field] as string;
      }
    }
    
    return '';
  };

  const handleTest = async () => {
    if (!sessionToken) return;

    try {
      const result = await testMutation.mutateAsync({
        storagePath: template.storage_path,
        testData,
        sessionToken
      });

      setTestResult(result);

      // Save test data
      await updateTemplateMutation.mutateAsync({
        id: template.id,
        updates: { 
          test_data: testData,
          status: 'testing'
        },
        sessionToken
      });

      if (result.all_replaced) {
        toast.success("Todas as variáveis foram substituídas!");
      } else {
        toast.warning(`${result.remaining_variables.length} variáveis não preenchidas`);
      }
    } catch (error: any) {
      console.error('Test error:', error);
      toast.error(error.message || "Erro ao testar template");
    }
  };

  const handleSendToZapSign = async () => {
    if (!sessionToken) return;

    try {
      const result = await createZapSignMutation.mutateAsync({
        storagePath: template.storage_path,
        templateName: template.template_name,
        variables: template.variables || [],
        sessionToken
      });

      // Update template with ZapSign data
      await updateTemplateMutation.mutateAsync({
        id: template.id,
        updates: {
          zapsign_template_id: result.zapsign_template_id,
          zapsign_doc_token: result.zapsign_doc_token,
          status: 'active'
        },
        sessionToken
      });

      toast.success("Template enviado ao ZapSign com sucesso!");
      onClose();
    } catch (error: any) {
      console.error('ZapSign error:', error);
      
      // Update with error
      await updateTemplateMutation.mutateAsync({
        id: template.id,
        updates: {
          status: 'error',
          error_message: error.message
        },
        sessionToken
      });

      toast.error(error.message || "Erro ao enviar para ZapSign");
    }
  };

  const isLoading = testMutation.isPending || createZapSignMutation.isPending || updateTemplateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>Editar Variáveis</CardTitle>
            <CardDescription>{template.template_name}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Regular Variables */}
        {regularVariables.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Variáveis do Documento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {regularVariables.map((variable) => (
                <div key={variable} className="space-y-2">
                  <Label htmlFor={variable}>
                    <Badge variant="outline" className="font-mono">
                      {`{{${variable}}}`}
                    </Badge>
                  </Label>
                  <Input
                    id={variable}
                    value={testData[variable] || getInitialValue(variable)}
                    onChange={(e) => setTestData({ ...testData, [variable]: e.target.value })}
                    placeholder={`Valor para ${variable}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legal Representative Variables */}
        {legalRepVariables.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Variáveis do Representante Legal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
                {legalRepVariables.map((variable) => (
                  <div key={variable} className="space-y-2">
                    <Label htmlFor={variable}>
                      <Badge variant="outline" className="font-mono bg-purple-500/10 text-purple-600">
                        {`{{${variable}}}`}
                      </Badge>
                    </Label>
                    <Input
                      id={variable}
                      value={testData[variable] || getInitialValue(variable)}
                      onChange={(e) => setTestData({ ...testData, [variable]: e.target.value })}
                      placeholder={`Valor para ${variable}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Test Result */}
        {testResult && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Resultado do Teste</h3>
                {testResult.all_replaced ? (
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Todas variáveis preenchidas
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    {testResult.remaining_variables.length} variáveis faltando
                  </Badge>
                )}
              </div>
              
              {testResult.remaining_variables.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {testResult.remaining_variables.map((v) => (
                    <Badge key={v} variant="outline" className="font-mono text-orange-600">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="bg-muted p-4 rounded-lg max-h-[300px] overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {testResult.preview_content}
                </pre>
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Voltar
          </Button>
          <Button
            variant="secondary"
            onClick={handleTest}
            disabled={isLoading}
          >
            {testMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FlaskConical className="h-4 w-4 mr-2" />
            )}
            Testar Substituição
          </Button>
          <Button
            onClick={handleSendToZapSign}
            disabled={isLoading || template.status === 'active'}
          >
            {createZapSignMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Enviar ao ZapSign
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
