import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, Calculator, MessageSquare, Bot } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CalculatorSettings } from "@/hooks/usePublicCalculatorData";

interface InfrastructureEstimatorProps {
  monthlyConversations: number;
  onConversationsChange: (value: number) => void;
  settings: CalculatorSettings | undefined;
}

export function InfrastructureEstimator({
  monthlyConversations,
  onConversationsChange,
  settings,
}: InfrastructureEstimatorProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculateCosts = () => {
    if (!settings) {
      return { openai: 0, meta: 0, total: 0 };
    }

    const tokensPerConversation = settings.avg_tokens_per_conversation;
    const messagesPerConversation = settings.avg_messages_per_conversation;
    const dollarRate = settings.dollar_rate;

    // OpenAI costs (input + output tokens)
    const totalTokens = monthlyConversations * tokensPerConversation;
    const inputTokens = totalTokens * 0.6; // 60% input
    const outputTokens = totalTokens * 0.4; // 40% output
    const openaiCostUSD =
      (inputTokens / 1000) * settings.openai_cost_per_1k_tokens.input +
      (outputTokens / 1000) * settings.openai_cost_per_1k_tokens.output;
    const openaiCostBRL = openaiCostUSD * dollarRate;

    // Meta API costs (WhatsApp messages)
    const totalMessages = monthlyConversations * messagesPerConversation;
    const metaCostUSD = totalMessages * settings.meta_api_cost_per_message.service;
    const metaCostBRL = metaCostUSD * dollarRate;

    return {
      openai: openaiCostBRL,
      meta: metaCostBRL,
      total: openaiCostBRL + metaCostBRL,
    };
  };

  const costs = calculateCosts();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Estimativa de Infraestrutura
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Estimativa baseada em médias de uso. Os valores reais podem variar
                  conforme o tipo de atendimento e complexidade das conversas.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="conversations">
            Quantidade estimada de atendimentos por mês
          </Label>
          <Input
            id="conversations"
            type="number"
            min={0}
            max={100000}
            value={monthlyConversations}
            onChange={(e) => onConversationsChange(parseInt(e.target.value) || 0)}
            className="max-w-xs"
          />
          <p className="text-xs text-muted-foreground">
            Considere o número total de conversas iniciadas mensalmente
          </p>
        </div>

        {monthlyConversations > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">OpenAI (IA)</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(costs.openai)}</p>
                <p className="text-xs text-muted-foreground">
                  ~{((settings?.avg_tokens_per_conversation || 2000) * monthlyConversations).toLocaleString('pt-BR')} tokens/mês
                </p>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Meta API (WhatsApp)</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(costs.meta)}</p>
                <p className="text-xs text-muted-foreground">
                  ~{((settings?.avg_messages_per_conversation || 8) * monthlyConversations).toLocaleString('pt-BR')} msgs/mês
                </p>
              </CardContent>
            </Card>

            <Card className="bg-primary/10 border-primary">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Total Estimado</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(costs.total)}
                </p>
                <p className="text-xs text-muted-foreground">por mês</p>
              </CardContent>
            </Card>
          </div>
        )}

        <p className="text-xs text-muted-foreground border-t pt-4">
          * Valores estimados com base na cotação do dólar de R${" "}
          {settings?.dollar_rate?.toFixed(2) || "5,50"}. Os custos reais serão
          cobrados diretamente pelos provedores (OpenAI e Meta) conforme o uso.
        </p>
      </CardContent>
    </Card>
  );
}
