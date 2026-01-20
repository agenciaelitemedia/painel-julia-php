import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Building2, 
  Loader2, 
  Key,
  RefreshCw,
  CheckCircle2,
  Phone
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { COUNTRIES, getCountryFlag } from "@/lib/constants/countries";

interface EditHelenaStepProps {
  helenaCountId: string;
  helenaToken: string;
  onHelenaTokenChange: (value: string) => void;
  wpNumber: string;
  onWpNumberChange: (value: string) => void;
  wpCountry: string;
  onWpCountryChange: (value: string) => void;
  codAgent: string;
}

interface HelenaApiResponse {
  success: boolean;
  data?: {
    token?: string;
  };
  error?: string;
}

// Generate token name: cod_agent_YYYYMMDD_HHmm
function generateTokenName(codAgent: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${codAgent}_${year}${month}${day}${hours}${minutes}`;
}

// Format phone number for display
function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  } else if (digits.length <= 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function EditHelenaStep({
  helenaCountId,
  helenaToken,
  onHelenaTokenChange,
  wpNumber,
  onWpNumberChange,
  wpCountry,
  onWpCountryChange,
  codAgent,
}: EditHelenaStepProps) {
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  const handleWpNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onWpNumberChange(formatPhoneNumber(e.target.value));
  };

  const handleRegenerateToken = async () => {
    if (!helenaCountId) {
      toast.error("Conta Atende Julia não encontrada");
      return;
    }

    if (!codAgent) {
      toast.error("Código do agente não definido");
      return;
    }

    setIsGeneratingToken(true);
    
    try {
      const tokenName = generateTokenName(codAgent);
      
      const { data, error } = await supabase.functions.invoke<HelenaApiResponse>('helena-api', {
        body: { 
          action: 'create-token', 
          companyId: helenaCountId,
          tokenName 
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Erro ao gerar token');
      }

      if (data.data?.token) {
        onHelenaTokenChange(data.data.token);
        toast.success("Token regenerado com sucesso!");
      } else {
        throw new Error('Token não retornado pela API');
      }
    } catch (error) {
      console.error('Generate token error:', error);
      toast.error(`Erro ao gerar token: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsGeneratingToken(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-medium">
        <Building2 className="h-5 w-5 text-primary" />
        Integração CRM Atende Julia
      </div>

      <p className="text-sm text-muted-foreground">
        Gerencie o token de acesso à conta Atende Julia vinculada a este agente.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="helenaCountId">Count ID</Label>
          <Input
            id="helenaCountId"
            value={helenaCountId}
            readOnly
            className="bg-muted font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Este campo não pode ser alterado
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="helenaToken">Token</Label>
          <div className="flex gap-2">
            <Input
              id="helenaToken"
              value={helenaToken}
              readOnly
              className="flex-1 font-mono text-sm bg-muted"
            />
            <Button
              type="button"
              onClick={handleRegenerateToken}
              disabled={isGeneratingToken || !helenaCountId}
              variant="outline"
            >
              {isGeneratingToken ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerar Token
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ao regenerar o token, o anterior será invalidado
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wpNumber" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Número WhatsApp
          </Label>
          <div className="flex gap-2">
            <Select value={wpCountry} onValueChange={onWpCountryChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue>
                  {(() => {
                    const country = COUNTRIES.find(c => c.value === wpCountry);
                    return country ? (
                      <span className="flex items-center gap-2">
                        <span>{getCountryFlag(country.code)}</span>
                        <span>{country.ddi}</span>
                      </span>
                    ) : null;
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    <span className="flex items-center gap-2">
                      <span>{getCountryFlag(country.code)}</span>
                      <span>{country.ddi}</span>
                      <span className="text-muted-foreground">{country.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="wpNumber"
              value={wpNumber}
              onChange={handleWpNumberChange}
              placeholder="(XX) XXXXX-XXXX"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Número de WhatsApp associado ao agente
          </p>
        </div>
      </div>

      {helenaToken && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            Token configurado. O agente está conectado à conta Atende Julia.
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium flex items-center gap-2">
          <Key className="h-4 w-4" />
          Sobre o Token Atende Julia
        </p>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>O token permite que o agente acesse o CRM Atende Julia</li>
          <li>Cada token é único e associado a uma conta específica</li>
          <li>Regenerar o token invalidará o token anterior</li>
          <li>Mantenha o token em segurança</li>
        </ul>
      </div>
    </div>
  );
}
