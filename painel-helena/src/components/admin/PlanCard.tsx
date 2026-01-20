import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Star, Users } from 'lucide-react';
import { getBillingCycleLabel, formatPrice } from '@/lib/utils/plan-utils';
import type { SubscriptionPlan } from '@/hooks/useSubscriptionPlans';
import { cn } from '@/lib/utils';

interface PlanCardProps {
  plan: SubscriptionPlan;
  onEdit: () => void;
  onDelete: () => void;
}

export function PlanCard({ plan, onEdit, onDelete }: PlanCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all hover:shadow-lg",
      plan.is_featured && "border-primary shadow-md"
    )}>
      {plan.is_featured && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg flex items-center gap-1">
          <Star className="h-3 w-3 fill-current" />
          Destaque
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            <CardDescription className="mt-1">
              {plan.description || 'Sem descrição'}
            </CardDescription>
          </div>
          {!plan.is_active && (
            <Badge variant="secondary">Inativo</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Preço em destaque */}
        <div className="text-center py-6 border rounded-lg bg-muted/30">
          <div className="text-3xl font-bold text-foreground">
            {formatPrice(plan.price)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            por {getBillingCycleLabel(plan.billing_cycle)}
          </div>
          
          {plan.setup_fee && plan.setup_fee > 0 && (
            <div className="text-xs text-muted-foreground mt-2">
              + {formatPrice(plan.setup_fee)} taxa de setup
            </div>
          )}
          
          {plan.trial_days && plan.trial_days > 0 && (
            <Badge variant="outline" className="mt-2">
              {plan.trial_days} dias grátis
            </Badge>
          )}
        </div>
        
        {/* Recursos */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Conexões WhatsApp</span>
            <strong>{plan.max_connections}</strong>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Assistentes IA</span>
            <strong>{plan.max_agents}</strong>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Agentes Julia</span>
            <strong>{plan.max_julia_agents}</strong>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Membros de Equipe</span>
            <strong>{plan.max_team_members}</strong>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Novos Contatos/mês</span>
            <strong>{plan.max_monthly_contacts || 100}</strong>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Customização de Prompt</span>
            <Badge variant={plan.release_customization ? "default" : "secondary"} className="text-xs">
              {plan.release_customization ? 'Sim' : 'Não'}
            </Badge>
          </div>
        </div>
        
        {/* Módulos */}
        {plan.enabled_modules.length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground mb-2">
              {plan.enabled_modules.length} módulo(s) habilitado(s)
            </div>
          </div>
        )}
        
        {/* Clientes usando */}
        <div className="pt-2 border-t">
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            <span>{plan.clients_count || 0} cliente(s) usando</span>
          </div>
        </div>
        
        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDelete}
            disabled={(plan.clients_count || 0) > 0}
            title={(plan.clients_count || 0) > 0 ? 'Não é possível excluir plano em uso' : undefined}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
