import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Agent {
  cod_agent: number;
  name: string | null;
  used: number;
  previous_used: number;
  usage_percentage: number;
}

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgent: string | null;
  onSelect: (agent: string) => void;
}

export function AgentSelector({ agents, selectedAgent, onSelect }: AgentSelectorProps) {
  if (agents.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            Nenhum agente encontrado para esta conta
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-foreground">
          Códigos de agentes vinculados:
        </h3>
        <p className="text-xs text-muted-foreground">
          Selecione um agente para gerenciar
        </p>
      </div>
      
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {agents.map((agent) => {
          const agentCode = agent.cod_agent.toString();
          return (
            <Card
              key={agentCode}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                selectedAgent === agentCode && "ring-2 ring-primary shadow-lg"
              )}
              onClick={() => onSelect(agentCode)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono font-bold text-xl text-foreground">
                        {agentCode}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {agent.name || "Agente Julia"}
                      </p>
                    </div>
                    <Badge variant={selectedAgent === agentCode ? "default" : "secondary"}>
                      {selectedAgent === agentCode ? "Selecionado" : "Selecionar"}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Uso: <span className="font-semibold text-foreground">{agent.used}</span>
                      </p>
                      <div className="flex flex-col items-end gap-0.5">
                        <div className={`text-xs font-semibold flex items-center gap-0.5 ${
                          agent.usage_percentage > 0 ? 'text-green-600' : 
                          agent.usage_percentage < 0 ? 'text-red-600' : 
                          'text-muted-foreground'
                        }`}>
                          {agent.usage_percentage > 0 ? '↑' : agent.usage_percentage < 0 ? '↓' : '→'}
                          {Math.abs(agent.usage_percentage)}%
                        </div>
                        <p className="text-[10px] text-muted-foreground">{agent.previous_used}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">vs mês anterior</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
