import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  mask: string;
}

const countries: Country[] = [
  { code: "BR", name: "Brasil", flag: "🇧🇷", dialCode: "55", mask: "(##) #####-####" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", dialCode: "1", mask: "(###) ###-####" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", dialCode: "54", mask: "## ####-####" },
  { code: "UY", name: "Uruguai", flag: "🇺🇾", dialCode: "598", mask: "# ### ####" },
  { code: "PY", name: "Paraguai", flag: "🇵🇾", dialCode: "595", mask: "### ######" },
  { code: "CL", name: "Chile", flag: "🇨🇱", dialCode: "56", mask: "# #### ####" },
  { code: "PE", name: "Peru", flag: "🇵🇪", dialCode: "51", mask: "### ### ###" },
  { code: "CO", name: "Colômbia", flag: "🇨🇴", dialCode: "57", mask: "### ### ####" },
  { code: "MX", name: "México", flag: "🇲🇽", dialCode: "52", mask: "### ### ####" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", dialCode: "351", mask: "### ### ###" },
];

interface PhoneInputProps {
  value: string; // Formato: 5534988860163 (sem formatação)
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  id?: string;
}

export function PhoneInput({ value, onChange, label, required, id }: PhoneInputProps) {
  // Extrair país do número atual
  const getCountryFromPhone = (phone: string): Country => {
    if (!phone) return countries[0]; // Brasil como padrão
    
    for (const country of countries) {
      if (phone.startsWith(country.dialCode)) {
        return country;
      }
    }
    return countries[0];
  };

  const [selectedCountry, setSelectedCountry] = useState<Country>(getCountryFromPhone(value));

  // Extrair número local (sem código do país)
  const getLocalNumber = (phone: string, country: Country): string => {
    if (!phone) return "";
    if (phone.startsWith(country.dialCode)) {
      return phone.slice(country.dialCode.length);
    }
    return phone;
  };

  // Formatar número para exibição
  const formatNumber = (number: string, mask: string): string => {
    const cleaned = number.replace(/\D/g, "");
    let formatted = "";
    let numberIndex = 0;

    for (let i = 0; i < mask.length && numberIndex < cleaned.length; i++) {
      if (mask[i] === "#") {
        formatted += cleaned[numberIndex];
        numberIndex++;
      } else {
        formatted += mask[i];
      }
    }

    return formatted;
  };

  const localNumber = getLocalNumber(value, selectedCountry);
  const displayValue = formatNumber(localNumber, selectedCountry.mask);

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode) || countries[0];
    setSelectedCountry(country);
    
    // Manter o número local, trocar apenas o código do país
    const local = getLocalNumber(value, selectedCountry);
    const newValue = country.dialCode + local.replace(/\D/g, "");
    onChange(newValue);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cleaned = input.replace(/\D/g, "");
    
    // Limitar ao tamanho da máscara
    const maxDigits = selectedCountry.mask.split("#").length - 1;
    const limited = cleaned.slice(0, maxDigits);
    
    // Combinar código do país + número local
    const newValue = selectedCountry.dialCode + limited;
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id}>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <div className="flex gap-2">
        <Select value={selectedCountry.code} onValueChange={handleCountryChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-sm">+{selectedCountry.dialCode}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="z-[100]">
            {countries.filter(country => country.code).map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{country.flag}</span>
                  <span className="text-sm">{country.name}</span>
                  <span className="text-xs text-muted-foreground">+{country.dialCode}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id={id}
          type="text"
          value={displayValue}
          onChange={handleNumberChange}
          placeholder={selectedCountry.mask.replace(/#/g, "9")}
          required={required}
          className="flex-1"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Formato final: {value || `${selectedCountry.dialCode}XXXXXXXXXX`}
      </p>
    </div>
  );
}
