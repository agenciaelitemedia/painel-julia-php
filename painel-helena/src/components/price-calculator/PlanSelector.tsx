import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscriptionPlan } from "@/hooks/usePublicCalculatorData";

interface PlanSelectorProps {
  plans: SubscriptionPlan[];
  selectedPlanId: string | null;
  onSelectPlan: (planId: string | null) => void;
  isAnnual: boolean;
  annualDiscount: number;
}

export function PlanSelector({
  plans,
  selectedPlanId,
  onSelectPlan,
  isAnnual,
  annualDiscount,
}: PlanSelectorProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getPrice = (price: number) => {
    if (isAnnual) {
      return price * (1 - annualDiscount / 100);
    }
    return price;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {plans.map((plan) => {
        const isSelected = selectedPlanId === plan.id;
        const displayPrice = getPrice(plan.price);

        return (
          <Card
            key={plan.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-lg",
              isSelected
                ? "ring-2 ring-primary border-primary bg-primary/5"
                : "hover:border-primary/50"
            )}
            onClick={() => onSelectPlan(isSelected ? null : plan.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                {isSelected && (
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
              {plan.description && (
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-3xl font-bold text-primary">
                  {formatCurrency(displayPrice)}
                </span>
                <span className="text-muted-foreground">/mês</span>
                {isAnnual && plan.price > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    -{annualDiscount}%
                  </Badge>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{plan.max_connections} conexões WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{plan.max_agents} agentes de atendimento</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{plan.max_julia_agents} agentes Julia IA</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{plan.max_team_members} membros da equipe</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{plan.max_monthly_contacts.toLocaleString('pt-BR')} contatos/mês</span>
                </div>
              </div>

              {plan.enabled_modules && plan.enabled_modules.length > 0 && (
                <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                  {plan.enabled_modules.map((module, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{module}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
