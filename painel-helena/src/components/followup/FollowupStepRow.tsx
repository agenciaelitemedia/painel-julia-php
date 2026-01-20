import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Sparkles } from 'lucide-react';
import { FollowupStep } from '@/hooks/useFollowupConfig';

interface FollowupStepRowProps {
  step: FollowupStep;
  index: number;
  autoMessage: boolean;
  onUpdate: (index: number, field: keyof FollowupStep, value: any) => void;
  onDelete: (index: number) => void;
}

export const FollowupStepRow = ({ step, index, autoMessage, onUpdate, onDelete }: FollowupStepRowProps) => {
  return (
    <div className="border rounded-lg p-4 space-y-4 bg-card">
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Apelido da Etapa</label>
              <Input
                placeholder="Ex: Primeiro contato"
                value={step.title}
                onChange={(e) => onUpdate(index, 'title', e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Intervalo</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={step.step_value}
                  onChange={(e) => onUpdate(index, 'step_value', parseInt(e.target.value) || 1)}
                  className="w-24"
                />
                <Select
                  value={step.step_unit}
                  onValueChange={(value) => onUpdate(index, 'step_unit', value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minuto(s)</SelectItem>
                    <SelectItem value="hours">Hora(s)</SelectItem>
                    <SelectItem value="days">Dia(s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-end">
              <span className="text-sm text-muted-foreground">
                Etapa {index + 1}
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Mensagem</label>
            {autoMessage ? (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>Mensagem será gerada automaticamente pela Julia</span>
              </div>
            ) : (
              <Textarea
                placeholder="Digite a mensagem que será enviada nesta etapa..."
                value={step.message || ''}
                onChange={(e) => onUpdate(index, 'message', e.target.value)}
                rows={3}
              />
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(index)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
