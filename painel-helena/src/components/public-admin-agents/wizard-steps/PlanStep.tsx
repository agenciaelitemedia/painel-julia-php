import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Package, CalendarDays, Users } from "lucide-react";
import { useAgentPlans, AgentPlan } from "@/hooks/useAgentPlans";

interface PlanStepProps {
  selectedPlan: string;
  onPlanChange: (plan: string) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  dueDate: number;
  onDueDateChange: (date: number) => void;
  isEditMode?: boolean;
}

export function PlanStep({
  selectedPlan,
  onPlanChange,
  limit,
  onLimitChange,
  dueDate,
  onDueDateChange,
  isEditMode = false,
}: PlanStepProps) {
  const { data: plans = [], isLoading } = useAgentPlans();

  useEffect(() => {
    if (selectedPlan && plans.length > 0) {
      const plan = plans.find(p => p.name === selectedPlan);
      if (plan) {
        onLimitChange(plan.limit);
      }
    }
  }, [selectedPlan, plans]);

  const handlePlanSelect = (planName: string) => {
    onPlanChange(planName);
    const plan = plans.find(p => p.name === planName);
    if (plan) {
      onLimitChange(plan.limit);
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="plan" className="text-base font-medium">
          Plano *
        </Label>
        <Select value={selectedPlan} onValueChange={handlePlanSelect}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Selecione um plano" />
          </SelectTrigger>
          <SelectContent>
            {plans.map((plan) => (
              <SelectItem key={plan.id} value={plan.name}>
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="font-medium">{plan.name}</span>
                  <span className="text-muted-foreground">
                    ({plan.limit} atendimentos)
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPlan && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Plano selecionado: {selectedPlan}</p>
                <p className="text-sm text-muted-foreground">
                  Limite de {limit} atendimentos por mês
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="limit" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Limite de Atendimentos
          </Label>
          <Input
            id="limit"
            type="number"
            value={limit}
            onChange={(e) => isEditMode && onLimitChange(parseInt(e.target.value, 10) || 0)}
            readOnly={!isEditMode}
            className={isEditMode ? "font-mono" : "bg-muted font-mono"}
          />
          <p className="text-xs text-muted-foreground">
            {isEditMode ? "Pode ser ajustado manualmente" : "Definido automaticamente pelo plano"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_date" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Dia do Vencimento *
          </Label>
          <Select
            value={dueDate.toString()}
            onValueChange={(value) => onDueDateChange(parseInt(value, 10))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Dia" />
            </SelectTrigger>
            <SelectContent>
              {days.map((day) => (
                <SelectItem key={day} value={day.toString()}>
                  Dia {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Data mensal de vencimento da fatura
          </p>
        </div>
      </div>
    </div>
  );
}
