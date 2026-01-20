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
  Search, 
  Loader2, 
  CheckCircle2, 
  Key,
  RefreshCw,
  AlertCircle,
  Phone
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { COUNTRIES, getCountryFlag } from "@/lib/constants/countries";

interface HelenaCompany {
  id: string;
  name: string;
  legalName: string;
  documentType: "CNPJ" | "CPF";
  documentId: string;
}

interface CRMStepProps {
  helenaCountId: string;
  onHelenaCountIdChange: (value: string) => void;
  helenaToken: string;
  onHelenaTokenChange: (value: string) => void;
  codAgent: string;
  wpNumber: string;
  onWpNumberChange: (value: string) => void;
  wpCountry: string;
  onWpCountryChange: (value: string) => void;
}

interface HelenaApiResponse {
  success: boolean;
  data?: {
    items?: HelenaCompany[];
    token?: string;
  };
  error?: string;
}

// Format document based on type
function formatDocument(documentId: string, documentType: "CNPJ" | "CPF"): string {
  const cleaned = documentId.replace(/\D/g, '');
  
  if (documentType === "CNPJ") {
    // Format: XX.XXX.XXX/XXXX-XX
    return cleaned.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  } else {
    // Format: XXX.XXX.XXX-XX
    return cleaned.replace(
      /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
      '$1.$2.$3-$4'
    );
  }
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

export function CRMStep({
  helenaCountId,
  onHelenaCountIdChange,
  helenaToken,
  onHelenaTokenChange,
  codAgent,
  wpNumber,
  onWpNumberChange,
  wpCountry,
  onWpCountryChange,
}: CRMStepProps) {
  const [searchText, setSearchText] = useState("");
  const [companies, setCompanies] = useState<HelenaCompany[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<HelenaCompany | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchText.trim()) {
      toast.error("Digite um texto para buscar");
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const { data, error } = await supabase.functions.invoke<HelenaApiResponse>('helena-api', {
        body: { action: 'search', searchText: searchText.trim() }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Erro ao buscar contas');
      }

      setCompanies(data.data?.items || []);
      
      if (data.data?.items?.length === 0) {
        toast.info("Nenhuma conta encontrada");
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(`Erro ao buscar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setCompanies([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCompany = (company: HelenaCompany) => {
    setSelectedCompany(company);
    onHelenaCountIdChange(company.id);
    onHelenaTokenChange(""); // Clear token when selecting new company
  };

  const handleGenerateToken = async () => {
    if (!helenaCountId) {
      toast.error("Selecione uma conta primeiro");
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
        toast.success("Token gerado com sucesso!");
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-medium">
        <Building2 className="h-5 w-5 text-primary" />
        Integração CRM Atende Julia
      </div>

      <p className="text-sm text-muted-foreground">
        Busque e selecione uma conta Atende Julia para vincular ao agente. Após selecionar, gere o token de acesso.
      </p>

      {/* Search Section */}
      <div className="space-y-3">
        <Label htmlFor="search">Buscar Conta</Label>
        <div className="flex gap-2">
          <Input
            id="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite o nome ou CNPJ da conta..."
            className="flex-1"
          />
          <Button 
            type="button" 
            onClick={handleSearch} 
            disabled={isSearching}
            variant="secondary"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Companies List */}
      {hasSearched && (
        <div className="space-y-2">
          <Label>Contas Encontradas ({companies.length})</Label>
          <div className="border rounded-lg max-h-60 overflow-y-auto">
            {companies.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Nenhuma conta encontrada
              </div>
            ) : (
              companies.map((company) => (
                <div
                  key={company.id}
                  onClick={() => handleSelectCompany(company)}
                  className={`p-3 border-b last:border-b-0 cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedCompany?.id === company.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{company.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {company.legalName}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {company.documentType}: {formatDocument(company.documentId, company.documentType)}
                      </div>
                    </div>
                    {selectedCompany?.id === company.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground/70 mt-1 font-mono">
                    ID: {company.id}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Selected Account Form */}
      {selectedCompany && (
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <CheckCircle2 className="h-4 w-4" />
            Conta Selecionada: {selectedCompany.name}
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="helenaCountId">Count ID</Label>
              <Input
                id="helenaCountId"
                value={helenaCountId}
                readOnly
                className="bg-muted font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="helenaToken">Token</Label>
              <div className="flex gap-2">
                <Input
                  id="helenaToken"
                  value={helenaToken}
                  readOnly
                  placeholder="Clique em 'Gerar Token' para criar"
                  className={`flex-1 font-mono text-sm ${helenaToken ? 'bg-muted' : ''}`}
                />
                <Button
                  type="button"
                  onClick={handleGenerateToken}
                  disabled={isGeneratingToken || !helenaCountId}
                  variant={helenaToken ? "outline" : "default"}
                >
                  {isGeneratingToken ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : helenaToken ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerar
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Gerar Token
                    </>
                  )}
                </Button>
              </div>
            </div>
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
                onChange={(e) => onWpNumberChange(formatPhoneNumber(e.target.value))}
                placeholder="(XX) XXXXX-XXXX"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Número de WhatsApp associado ao agente
            </p>
          </div>

          {helenaToken && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                Token gerado com sucesso! O agente está pronto para ser criado.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {!selectedCompany && hasSearched && companies.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Clique em uma conta da lista para selecioná-la.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
