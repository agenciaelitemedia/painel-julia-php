import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { COUNTRIES, BRAZIL_STATES, getCountryFlag } from "@/lib/constants/countries";

export interface EditClientData {
  cod_agent: string;
  name: string;
  business_name: string;
  federal_id: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  zip_code: string;
  is_closer: boolean;
}

interface EditClientStepProps {
  clientData: EditClientData;
  onClientDataChange: (data: EditClientData) => void;
}

export function EditClientStep({ clientData, onClientDataChange }: EditClientStepProps) {
  const handleChange = (field: keyof EditClientData, value: string | boolean) => {
    onClientDataChange({
      ...clientData,
      [field]: value,
    });
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

  const selectedCountry = COUNTRIES.find(c => c.value === clientData.country);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <Badge variant="secondary">Dados do Cliente</Badge>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {/* Código do Agente - ReadOnly */}
          <div className="space-y-2">
            <Label htmlFor="cod_agent">Código do Agente</Label>
            <Input
              id="cod_agent"
              value={clientData.cod_agent}
              readOnly
              className="bg-muted font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Este campo não pode ser alterado
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={clientData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nome do cliente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_name">Escritório</Label>
              <Input
                id="business_name"
                value={clientData.business_name || ''}
                onChange={(e) => handleChange('business_name', e.target.value)}
                placeholder="Nome do escritório"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="federal_id">CPF/CNPJ</Label>
              <Input
                id="federal_id"
                value={clientData.federal_id || ''}
                onChange={(e) => handleChange('federal_id', formatCPFCNPJ(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={18}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={clientData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone *</Label>
            <div className="flex gap-2">
              <Select
                value={clientData.country}
                onValueChange={(value) => handleChange('country', value)}
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
                value={clientData.phone}
                onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
                placeholder={clientData.country === 'BR' ? '(11) 99999-9999' : 'Número'}
                className="flex-1"
                maxLength={15}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">País *</Label>
              <Select
                value={clientData.country}
                onValueChange={(value) => {
                  handleChange('country', value);
                  if (value !== 'BR') {
                    handleChange('state', '');
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
            {clientData.country === 'BR' && (
              <div className="space-y-2">
                <Label htmlFor="state">Estado *</Label>
                <Select
                  value={clientData.state || ''}
                  onValueChange={(value) => handleChange('state', value)}
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
                value={clientData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Cidade"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zip_code">CEP</Label>
              <Input
                id="zip_code"
                value={clientData.zip_code || ''}
                onChange={(e) => handleChange('zip_code', formatCEP(e.target.value))}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
            <div className="space-y-2">
              <Label>É Closer?</Label>
              <div className="flex items-center gap-3 h-10">
                <Switch 
                  checked={clientData.is_closer} 
                  onCheckedChange={(checked) => handleChange('is_closer', checked)} 
                />
                <span className="text-sm text-muted-foreground">
                  {clientData.is_closer ? 'Sim' : 'Não'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
