import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { usePlanMigration } from '@/hooks/usePlanMigration';
import type { SubscriptionPlan } from '@/hooks/useSubscriptionPlans';
import { formatPrice, getChangeTypeLabel } from '@/lib/utils/plan-utils';

interface Client {
  id: string;
  name: string;
  plan_id?: string;
}

interface PlanMigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  currentPlan?: SubscriptionPlan | null;
  availablePlans: SubscriptionPlan[];
  onMigrationComplete: () => void;
}

export function PlanMigrationDialog({
  open,
  onOpenChange,
  client,
  currentPlan,
  availablePlans,
  onMigrationComplete
}: PlanMigrationDialogProps) {
  const { validateMigration, executeMigration } = usePlanMigration();
  
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [validating, setValidating] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [validation, setValidation] = useState<any>(null);

  useEffect(() => {
    if (open) {
      setSelectedPlanId('');
      setReason('');
      setNotes('');
      setValidation(null);
    }
  }, [open]);

  useEffect(() => {
    if (selectedPlanId && selectedPlanId !== client.plan_id) {
      handleValidateMigration();
    } else {
      setValidation(null);
    }
  }, [selectedPlanId]);

  const handleValidateMigration = async () => {
    setValidating(true);
    const result = await validateMigration(
      client.id,
      client.plan_id || null,
      selectedPlanId
    );
    setValidation(result);
    setValidating(false);
  };

  const handleMigrate = async () => {
    if (!selectedPlanId || !validation?.canMigrate) return;

    setMigrating(true);
    const success = await executeMigration(client.id, selectedPlanId, {
      reason,
      notes,
      applyImmediately: true
    });

    setMigrating(false);
    
    if (success) {
      onMigrationComplete();
      onOpenChange(false);
    }
  };

  const selectedPlan = availablePlans.find(p => p.id === selectedPlanId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alterar Plano do Cliente</DialogTitle>
          <DialogDescription>
            Cliente: <strong>{client.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Plano Atual */}
          {currentPlan && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="text-sm text-muted-foreground mb-1">Plano Atual</div>
              <div className="font-semibold">{currentPlan.name}</div>
              <div className="text-sm text-muted-foreground">
                {formatPrice(currentPlan.price)} / {currentPlan.billing_cycle}
              </div>
            </div>
          )}

          {/* Seleção de Novo Plano */}
          <div className="space-y-2">
            <Label htmlFor="new-plan">Novo Plano</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {availablePlans
                  .filter(p => p.is_active && p.id !== client.plan_id)
                  .map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {formatPrice(plan.price)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview de Mudança */}
          {selectedPlan && currentPlan && (
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{currentPlan.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatPrice(currentPlan.price)}
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">{selectedPlan.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatPrice(selectedPlan.price)}
                  </div>
                </div>
              </div>

              {validation && (
                <Badge variant={
                  validation.changeType === 'upgrade' ? 'default' :
                  validation.changeType === 'downgrade' ? 'secondary' :
                  'outline'
                } className="gap-1">
                  {validation.changeType === 'upgrade' && <TrendingUp className="h-3 w-3" />}
                  {validation.changeType === 'downgrade' && <TrendingDown className="h-3 w-3" />}
                  {getChangeTypeLabel(validation.changeType)}
                </Badge>
              )}
            </div>
          )}

          {/* Validação em Progresso */}
          {validating && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Validando migração...
              </AlertDescription>
            </Alert>
          )}

          {/* Bloqueadores */}
          {validation?.blockers && validation.blockers.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Não é possível migrar:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validation.blockers.map((blocker: string, idx: number) => (
                    <li key={idx} className="text-sm">{blocker}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Avisos */}
          {validation?.warnings && validation.warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Avisos:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validation.warnings.map((warning: string, idx: number) => (
                    <li key={idx} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Mudança</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Cliente solicitou mais conexões"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Informações adicionais sobre a migração"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleMigrate}
            disabled={!selectedPlanId || !validation?.canMigrate || migrating}
          >
            {migrating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Migração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
