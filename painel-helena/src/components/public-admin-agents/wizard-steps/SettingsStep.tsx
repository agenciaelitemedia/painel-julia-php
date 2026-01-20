import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Settings, AlertCircle, CheckCircle2, Code } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface SettingsStepProps {
  settings: string;
  onSettingsChange: (settings: string) => void;
}

const formatJson = (jsonString: string): string => {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return jsonString;
  }
};

export function SettingsStep({ settings, onSettingsChange }: SettingsStepProps) {
  const [isValidJson, setIsValidJson] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const hasFormattedRef = useRef(false);

  useEffect(() => {
    if (!settings || settings.trim() === "") {
      setIsValidJson(true);
      setErrorMessage("");
      hasFormattedRef.current = false;
      return;
    }

    try {
      const parsed = JSON.parse(settings);
      setIsValidJson(true);
      setErrorMessage("");
      
      // Auto-format on initial load only
      if (!hasFormattedRef.current) {
        const formatted = JSON.stringify(parsed, null, 2);
        if (formatted !== settings) {
          onSettingsChange(formatted);
        }
        hasFormattedRef.current = true;
      }
    } catch (e) {
      setIsValidJson(false);
      setErrorMessage(e instanceof Error ? e.message : "JSON inválido");
    }
  }, [settings, onSettingsChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-medium">
        <Settings className="h-5 w-5 text-primary" />
        Configurações do Agente
      </div>

      <p className="text-sm text-muted-foreground">
        Insira as configurações do agente em formato JSON. Este campo é opcional.
      </p>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="settings">Configurações (JSON)</Label>
          {settings && isValidJson && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSettingsChange(formatJson(settings))}
              className="h-7 text-xs"
            >
              <Code className="h-3 w-3 mr-1" />
              Formatar JSON
            </Button>
          )}
        </div>
        <Textarea
          id="settings"
          value={settings}
          onChange={(e) => onSettingsChange(e.target.value)}
          placeholder='{"chave": "valor", "opcao": true}'
          rows={15}
          className={`font-mono text-sm ${!isValidJson ? 'border-destructive focus-visible:ring-destructive' : ''}`}
        />
      </div>

      {settings && settings.trim() !== "" && (
        isValidJson ? (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              JSON válido
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              JSON inválido: {errorMessage}
            </AlertDescription>
          </Alert>
        )
      )}

      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium">Exemplo de configuração:</p>
        <pre className="text-xs bg-background rounded p-3 overflow-x-auto">
{`{
  "response_delay": 1000,
  "max_retries": 3,
  "enable_logging": true,
  "custom_greeting": "Olá, como posso ajudar?"
}`}
        </pre>
      </div>
    </div>
  );
}
