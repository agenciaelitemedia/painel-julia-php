import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FileText, MessageCircle, Receipt } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SubscriptionPlan,
  ExtraModule,
  ImplementationType,
  CalculatorSettings,
} from "@/hooks/usePublicCalculatorData";

interface SelectedModule {
  moduleId: string;
  quantity: number;
}

interface PriceSummaryProps {
  selectedPlan: SubscriptionPlan | null;
  selectedModules: SelectedModule[];
  modules: ExtraModule[];
  selectedImplementation: ImplementationType | null;
  isAnnual: boolean;
  annualDiscount: number;
  customDiscount: number;
  onCustomDiscountChange: (value: number) => void;
  monthlyConversations: number;
  settings: CalculatorSettings | undefined;
  onGeneratePdf: () => void;
  onWhatsAppContact: () => void;
}

export function PriceSummary({
  selectedPlan,
  selectedModules,
  modules,
  selectedImplementation,
  isAnnual,
  annualDiscount,
  customDiscount,
  onCustomDiscountChange,
  monthlyConversations,
  settings,
  onGeneratePdf,
  onWhatsAppContact,
}: PriceSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getPlanPrice = () => {
    if (!selectedPlan) return 0;
    const basePrice = selectedPlan.price;
    return isAnnual ? basePrice * (1 - annualDiscount / 100) : basePrice;
  };

  const getModulePrice = (selection: SelectedModule) => {
    const module = modules.find((m) => m.id === selection.moduleId);
    if (!module) return 0;
    if (!module.has_quantity || !module.price_per_unit) {
      return module.price;
    }
    return module.price + (selection.quantity - module.base_quantity) * module.price_per_unit;
  };

  const getInfrastructureCost = () => {
    if (!settings || monthlyConversations === 0) return 0;

    const tokensPerConversation = settings.avg_tokens_per_conversation;
    const messagesPerConversation = settings.avg_messages_per_conversation;
    const dollarRate = settings.dollar_rate;

    const totalTokens = monthlyConversations * tokensPerConversation;
    const inputTokens = totalTokens * 0.6;
    const outputTokens = totalTokens * 0.4;
    const openaiCostUSD =
      (inputTokens / 1000) * settings.openai_cost_per_1k_tokens.input +
      (outputTokens / 1000) * settings.openai_cost_per_1k_tokens.output;
    const openaiCostBRL = openaiCostUSD * dollarRate;

    const totalMessages = monthlyConversations * messagesPerConversation;
    const metaCostUSD = totalMessages * settings.meta_api_cost_per_message.service;
    const metaCostBRL = metaCostUSD * dollarRate;

    return openaiCostBRL + metaCostBRL;
  };

  const planPrice = getPlanPrice();
  const modulesTotal = selectedModules.reduce((sum, sel) => sum + getModulePrice(sel), 0);
  const implementationPrice = selectedImplementation?.price || 0;
  const infrastructureCost = getInfrastructureCost();

  const monthlySubtotal = planPrice + modulesTotal + infrastructureCost;
  const monthlyWithDiscount =
    customDiscount > 0
      ? monthlySubtotal * (1 - customDiscount / 100)
      : monthlySubtotal;

  const totalFirstMonth = monthlyWithDiscount + implementationPrice;
  const annualTotal = monthlyWithDiscount * 12 + implementationPrice;

  const items = [];

  if (selectedPlan) {
    items.push({
      description: `Plano ${selectedPlan.name}${isAnnual ? ' (Anual)' : ' (Mensal)'}`,
      monthly: planPrice,
      oneTime: 0,
    });
  }

  selectedModules.forEach((selection) => {
    const module = modules.find((m) => m.id === selection.moduleId);
    if (module) {
      const qty = module.has_quantity ? ` (${selection.quantity} ${module.quantity_label})` : '';
      items.push({
        description: `${module.name}${qty}`,
        monthly: getModulePrice(selection),
        oneTime: 0,
      });
    }
  });

  if (infrastructureCost > 0) {
    items.push({
      description: `Infraestrutura estimada (${monthlyConversations.toLocaleString('pt-BR')} atendimentos)`,
      monthly: infrastructureCost,
      oneTime: 0,
    });
  }

  if (selectedImplementation) {
    items.push({
      description: selectedImplementation.name,
      monthly: 0,
      oneTime: implementationPrice,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Resumo do Investimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Selecione um plano, módulos ou tipo de implementação para ver o resumo.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Mensal</TableHead>
                  <TableHead className="text-right">Único</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">
                      {item.monthly > 0 ? formatCurrency(item.monthly) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.oneTime > 0 ? formatCurrency(item.oneTime) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount">Desconto adicional (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min={0}
                  max={100}
                  value={customDiscount}
                  onChange={(e) => onCustomDiscountChange(parseFloat(e.target.value) || 0)}
                  className="w-24"
                />
              </div>
              {customDiscount > 0 && (
                <p className="text-sm text-green-600">
                  Economia de {formatCurrency(monthlySubtotal - monthlyWithDiscount)}/mês
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between text-lg">
                <span>Mensal recorrente:</span>
                <span className="font-semibold">{formatCurrency(monthlyWithDiscount)}</span>
              </div>
              {implementationPrice > 0 && (
                <div className="flex justify-between text-lg">
                  <span>Implementação (único):</span>
                  <span className="font-semibold">{formatCurrency(implementationPrice)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-xl">
                <span className="font-semibold">1º mês (total):</span>
                <span className="font-bold text-primary">{formatCurrency(totalFirstMonth)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Investimento anual estimado:</span>
                <span>{formatCurrency(annualTotal)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button onClick={onGeneratePdf} variant="outline" className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                Exportar Proposta (PDF)
              </Button>
              <Button onClick={onWhatsAppContact} className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contratar via WhatsApp
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
