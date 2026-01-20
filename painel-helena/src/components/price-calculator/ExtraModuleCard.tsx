import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Check } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { ExtraModule } from "@/hooks/usePublicCalculatorData";

interface SelectedModule {
  moduleId: string;
  quantity: number;
}

interface ExtraModuleCardProps {
  module: ExtraModule;
  selection: SelectedModule | undefined;
  onToggle: (moduleId: string) => void;
  onQuantityChange: (moduleId: string, quantity: number) => void;
}

export function ExtraModuleCard({
  module,
  selection,
  onToggle,
  onQuantityChange,
}: ExtraModuleCardProps) {
  const isSelected = !!selection;
  const quantity = selection?.quantity || module.base_quantity;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTotalPrice = () => {
    if (!module.has_quantity || !module.price_per_unit) {
      return module.price;
    }
    return module.price + (quantity - module.base_quantity) * module.price_per_unit;
  };

  // Get icon component dynamically
  const IconComponent = (LucideIcons as any)[
    module.icon_name
      .split('-')
      .map((word, index) => 
        index === 0 
          ? word.charAt(0).toUpperCase() + word.slice(1)
          : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join('')
  ] || LucideIcons.Package;

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        isSelected
          ? "ring-2 ring-primary border-primary bg-primary/5"
          : "hover:border-primary/50"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "p-2 rounded-lg",
              isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            <IconComponent className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium truncate">{module.name}</h4>
              {isSelected && (
                <Badge variant="default" className="shrink-0">
                  <Check className="h-3 w-3 mr-1" />
                  Adicionado
                </Badge>
              )}
            </div>

            {module.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {module.description}
              </p>
            )}

            <div className="flex items-center justify-between mt-3">
              <div>
                <span className="text-lg font-semibold text-primary">
                  {formatCurrency(getTotalPrice())}
                </span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </div>

              {!isSelected ? (
                <Button size="sm" onClick={() => onToggle(module.id)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onToggle(module.id)}
                >
                  Remover
                </Button>
              )}
            </div>

            {isSelected && module.has_quantity && (
              <div className="flex items-center gap-3 mt-3 pt-3 border-t">
                <span className="text-sm text-muted-foreground">
                  Quantidade de {module.quantity_label}:
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() =>
                      onQuantityChange(module.id, Math.max(module.base_quantity, quantity - 1))
                    }
                    disabled={quantity <= module.base_quantity}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() =>
                      onQuantityChange(module.id, Math.min(module.max_quantity, quantity + 1))
                    }
                    disabled={quantity >= module.max_quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {module.price_per_unit && (
                  <span className="text-xs text-muted-foreground">
                    (+{formatCurrency(module.price_per_unit)} por {module.quantity_label?.slice(0, -1) || 'unidade'})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
