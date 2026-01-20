import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, User, Building, Plus, ChevronRight, X, Loader2 } from "lucide-react";
import { useExternalClients, ExternalClient, CreateClientData } from "@/hooks/useExternalClients";
import { useGenerateCodAgent } from "@/hooks/useCreateAgentJulia";
import { COUNTRIES, BRAZIL_STATES, getCountryFlag } from "@/lib/constants/countries";

interface ClientStepProps {
  selectedClient: ExternalClient | null;
  onSelectClient: (client: ExternalClient | null) => void;
  newClientData: CreateClientData | null;
  onNewClientData: (data: CreateClientData | null) => void;
  codAgent: string;
  onCodAgentChange: (code: string) => void;
  isCloser: boolean;
  onIsCloserChange: (value: boolean) => void;
}

export function ClientStep({
  selectedClient,
  onSelectClient,
  newClientData,
  onNewClientData,
  codAgent,
  onCodAgentChange,
  isCloser,
  onIsCloserChange,
}: ClientStepProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [formData, setFormData] = useState<CreateClientData>({
    name: "",
    business_name: "",
    federal_id: "",
    email: "",
    phone: "",
    country: "BR",
    state: "",
    city: "",
    zip_code: "",
  });

  const { data: clients = [], isLoading } = useExternalClients(searchTerm.length >= 2 ? searchTerm : undefined);
  const generateCodAgent = useGenerateCodAgent();

  useEffect(() => {
    if (!codAgent) {
      generateCodAgent.mutate(undefined, {
        onSuccess: (code) => {
          onCodAgentChange(code);
        }
      });
    }
  }, []);

  // Only restore form data on initial mount if there's existing data
  useEffect(() => {
    if (newClientData && !isCreatingNew) {
      // Restore display format for phone (remove DDI prefix if present)
      const displayPhone = newClientData.phone || "";
      setFormData({
        ...newClientData,
        phone: displayPhone,
      });
      setIsCreatingNew(true);
    }
  }, []); // Empty dependency - only run once on mount

  const handleSelectClient = (client: ExternalClient) => {
    onSelectClient(client);
    onNewClientData(null);
    setIsCreatingNew(false);
  };

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    onSelectClient(null);
    setFormData({
      name: "",
      business_name: "",
      federal_id: "",
      email: "",
      phone: "",
      country: "BR",
      state: "",
      city: "",
      zip_code: "",
    });
  };

  // Get full phone with DDI for database (format: DDI+number without masks)
  const getFullPhoneForDatabase = (phone: string, country: string): string => {
    const countryData = COUNTRIES.find(c => c.value === country);
    const ddi = countryData?.ddi.replace('+', '') || '55';
    const cleanNumber = phone.replace(/\D/g, '');
    return `${ddi}${cleanNumber}`;
  };

  // Clean masks from values
  const cleanMask = (value: string | undefined): string | null => {
    if (!value) return null;
    const cleaned = value.replace(/\D/g, '');
    return cleaned || null;
  };

  const handleFormChange = (field: keyof CreateClientData, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    
    // When passing to parent, clean the data for database
    const dataForParent: CreateClientData = {
      ...updated,
      phone: getFullPhoneForDatabase(updated.phone, updated.country),
      federal_id: cleanMask(updated.federal_id) || undefined,
      zip_code: cleanMask(updated.zip_code) || undefined,
    };
    onNewClientData(dataForParent);
  };

  const formatCPFCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatCEP = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const selectedCountry = COUNTRIES.find(c => c.value === formData.country);

  if (selectedClient) {
    return (
      <div className="space-y-4">
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedClient.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onSelectClient(null)}>
                <X className="h-4 w-4 mr-1" />
                Trocar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Código do Agente</Label>
            <div className="flex items-center gap-2">
              <Input value={codAgent} readOnly className="bg-muted font-mono" />
              {generateCodAgent.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </div>
          <div className="space-y-2">
            <Label>É Closer?</Label>
            <div className="flex items-center gap-3 h-10">
              <Switch checked={isCloser} onCheckedChange={onIsCloserChange} />
              <span className="text-sm text-muted-foreground">{isCloser ? 'Sim' : 'Não'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isCreatingNew) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">Novo Cliente</Badge>
          <Button variant="ghost" size="sm" onClick={() => {
            setIsCreatingNew(false);
            onNewClientData(null);
          }}>
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
        </div>

        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="Nome do cliente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_name">Escritório</Label>
                <Input
                  id="business_name"
                  value={formData.business_name || ''}
                  onChange={(e) => handleFormChange('business_name', e.target.value)}
                  placeholder="Nome do escritório"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="federal_id">CPF/CNPJ</Label>
                <Input
                  id="federal_id"
                  value={formData.federal_id || ''}
                  onChange={(e) => handleFormChange('federal_id', formatCPFCNPJ(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={18}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleFormChange('country', value)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue>
                      {selectedCountry && (
                        <span className="flex items-center gap-2">
                          <span>{getCountryFlag(selectedCountry.code)}</span>
                          <span>{selectedCountry.ddi}</span>
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
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
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleFormChange('phone', formatPhone(e.target.value))}
                  placeholder={formData.country === 'BR' ? '(11) 99999-9999' : 'Número'}
                  className="flex-1"
                  maxLength={15}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">País *</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => {
                    handleFormChange('country', value);
                    if (value !== 'BR') {
                      handleFormChange('state', '');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        <span className="flex items-center gap-2">
                          <span>{getCountryFlag(country.code)}</span>
                          <span>{country.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.country === 'BR' && (
                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Select
                    value={formData.state || ''}
                    onValueChange={(value) => handleFormChange('state', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZIL_STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleFormChange('city', e.target.value)}
                  placeholder="Cidade"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zip_code">CEP</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code || ''}
                  onChange={(e) => handleFormChange('zip_code', formatCEP(e.target.value))}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código do Agente</Label>
                  <div className="flex items-center gap-2">
                    <Input value={codAgent} readOnly className="bg-muted font-mono" />
                    {generateCodAgent.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>É Closer?</Label>
                  <div className="flex items-center gap-3 h-10">
                    <Switch checked={isCloser} onCheckedChange={onIsCloserChange} />
                    <span className="text-sm text-muted-foreground">{isCloser ? 'Sim' : 'Não'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar cliente por nome, escritório ou email..."
            className="pl-10"
            autoFocus
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {searchTerm.length > 0 && searchTerm.length < 2 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Digite pelo menos 2 caracteres para buscar...
        </p>
      )}

      {searchTerm.length >= 2 && (
        <>
          <div className="flex items-center justify-between">
            <Badge variant="outline">
              {isLoading ? 'Buscando...' : `${clients.length} cliente(s) encontrado(s)`}
            </Badge>
          </div>

          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
                <Button onClick={handleCreateNew} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Cadastrar Novo Cliente
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{client.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {client.business_name && (
                          <>
                            <Building className="h-3 w-3" />
                            <span className="truncate">{client.business_name}</span>
                            <span>•</span>
                          </>
                        )}
                        <span className="truncate">{client.email}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </>
      )}

      {!searchTerm && (
        <div className="text-center py-12 space-y-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Busque um cliente existente</p>
            <p className="text-sm text-muted-foreground">
              ou clique em "Novo Cliente" para cadastrar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
