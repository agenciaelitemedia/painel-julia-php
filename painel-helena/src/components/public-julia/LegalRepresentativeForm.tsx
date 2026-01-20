import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import { LegalRepresentativeData } from "@/hooks/usePublicContractTemplates";

interface LegalRepresentativeFormProps {
  data: LegalRepresentativeData;
  onChange: (data: LegalRepresentativeData) => void;
}

const RELATIONSHIP_OPTIONS = [
  { value: 'pai', label: 'Pai' },
  { value: 'mae', label: 'Mãe' },
  { value: 'tutor', label: 'Tutor' },
  { value: 'curador', label: 'Curador' },
  { value: 'responsavel', label: 'Responsável Legal' },
  { value: 'outro', label: 'Outro' },
];

const REPRESENTATION_REASON_OPTIONS = [
  { value: 'menor', label: 'Menor de idade' },
  { value: 'interdicao', label: 'Interdição' },
  { value: 'incapacidade', label: 'Incapacidade civil' },
  { value: 'outro', label: 'Outro' },
];

export function LegalRepresentativeForm({ data, onChange }: LegalRepresentativeFormProps) {
  const updateField = (field: keyof LegalRepresentativeData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="h-4 w-4" />
          Dados do Representante Legal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Relação com o Representado *</Label>
            <Select 
              value={data.representative_relationship || "_none_"} 
              onValueChange={(value) => updateField('representative_relationship', value === "_none_" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a relação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none_">Selecione...</SelectItem>
                {RELATIONSHIP_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Motivo da Representação</Label>
            <Select 
              value={data.reason || "_none_"} 
              onValueChange={(value) => updateField('reason', value === "_none_" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none_">Selecione...</SelectItem>
                {REPRESENTATION_REASON_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
