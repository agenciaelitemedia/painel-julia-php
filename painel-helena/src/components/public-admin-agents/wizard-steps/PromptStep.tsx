import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";

interface PromptStepProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
}

export function PromptStep({ prompt, onPromptChange }: PromptStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-medium">
        <MessageSquare className="h-5 w-5 text-primary" />
        Prompt do Agente
      </div>

      <p className="text-sm text-muted-foreground">
        Defina as instruções e personalidade do agente. Este campo é opcional e pode ser configurado posteriormente.
      </p>

      <div className="space-y-2">
        <Label htmlFor="prompt">Prompt</Label>
        <Textarea
          id="prompt"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Digite aqui as instruções para o agente..."
          rows={10}
          className="text-sm"
        />
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium">Dicas para um bom prompt:</p>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>Defina claramente o papel do agente</li>
          <li>Especifique o tom de voz desejado (formal, casual, etc.)</li>
          <li>Liste as principais tarefas que o agente deve realizar</li>
          <li>Inclua exemplos de respostas quando necessário</li>
          <li>Defina limitações e regras de comportamento</li>
        </ul>
      </div>

      {prompt && (
        <div className="text-xs text-muted-foreground text-right">
          {prompt.length} caracteres
        </div>
      )}
    </div>
  );
}
