import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImplementationType } from "@/hooks/usePublicCalculatorData";

interface ImplementationCardProps {
  implementation: ImplementationType;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ImplementationCard({
  implementation,
  isSelected,
  onSelect,
}: ImplementationCardProps) {
  const formatCurrency = (value: number) => {
    if (value === 0) return "Grátis";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getBadgeVariant = (color: string) => {
    switch (color) {
      case 'blue':
        return 'default';
      case 'amber':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg relative",
        isSelected
          ? "ring-2 ring-primary border-primary bg-primary/5"
          : "hover:border-primary/50"
      )}
      onClick={() => onSelect(implementation.id)}
    >
      {implementation.badge_text && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge
            variant={getBadgeVariant(implementation.badge_color)}
            className={cn(
              "px-3",
              implementation.badge_color === 'amber' && "bg-amber-500 hover:bg-amber-600"
            )}
          >
            {implementation.badge_text}
          </Badge>
        </div>
      )}

      <CardHeader className={cn("pb-2", implementation.badge_text && "pt-6")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{implementation.name}</CardTitle>
          <div
            className={cn(
              "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
              isSelected
                ? "border-primary bg-primary"
                : "border-muted-foreground/30"
            )}
          >
            {isSelected ? (
              <Check className="h-4 w-4 text-primary-foreground" />
            ) : (
              <Circle className="h-3 w-3 text-transparent" />
            )}
          </div>
        </div>
        {implementation.description && (
          <p className="text-sm text-muted-foreground">{implementation.description}</p>
        )}
      </CardHeader>

      <CardContent>
        <div className="mb-4">
          <span className="text-2xl font-bold text-primary">
            {formatCurrency(implementation.price)}
          </span>
          {implementation.price > 0 && (
            <span className="text-muted-foreground text-sm ml-1">único</span>
          )}
        </div>

        {implementation.included_items && implementation.included_items.length > 0 && (
          <div className="space-y-2">
            {implementation.included_items.map((item, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
