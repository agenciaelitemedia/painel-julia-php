import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Calculator, Package, Wrench, Server, Receipt } from "lucide-react";
import {
  usePublicPlans,
  useExtraModules,
  useImplementationTypes,
  useCalculatorSettings,
} from "@/hooks/usePublicCalculatorData";
import { PlanSelector } from "@/components/price-calculator/PlanSelector";
import { ExtraModuleCard } from "@/components/price-calculator/ExtraModuleCard";
import { ImplementationCard } from "@/components/price-calculator/ImplementationCard";
import { InfrastructureEstimator } from "@/components/price-calculator/InfrastructureEstimator";
import { PriceSummary } from "@/components/price-calculator/PriceSummary";
import { generateProposalPdf } from "@/lib/utils/proposal-pdf";

interface SelectedModule {
  moduleId: string;
  quantity: number;
}

export default function PublicPriceCalculator() {
  // Data hooks
  const { data: plans, isLoading: plansLoading } = usePublicPlans();
  const { data: modules, isLoading: modulesLoading } = useExtraModules();
  const { data: implementations, isLoading: implementationsLoading } = useImplementationTypes();
  const { data: settings, isLoading: settingsLoading } = useCalculatorSettings();

  // State
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);
  const [selectedImplementationId, setSelectedImplementationId] = useState<string | null>(null);
  const [monthlyConversations, setMonthlyConversations] = useState(0);
  const [customDiscount, setCustomDiscount] = useState(0);

  const isLoading = plansLoading || modulesLoading || implementationsLoading || settingsLoading;
  const annualDiscount = settings?.annual_discount_percent || 10;

  // Computed values
  const selectedPlan = useMemo(
    () => plans?.find((p) => p.id === selectedPlanId) || null,
    [plans, selectedPlanId]
  );

  const selectedImplementation = useMemo(
    () => implementations?.find((i) => i.id === selectedImplementationId) || null,
    [implementations, selectedImplementationId]
  );

  // Handlers
  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules((prev) => {
      const existing = prev.find((m) => m.moduleId === moduleId);
      if (existing) {
        return prev.filter((m) => m.moduleId !== moduleId);
      }
      const module = modules?.find((m) => m.id === moduleId);
      return [...prev, { moduleId, quantity: module?.base_quantity || 1 }];
    });
  };

  const handleModuleQuantityChange = (moduleId: string, quantity: number) => {
    setSelectedModules((prev) =>
      prev.map((m) => (m.moduleId === moduleId ? { ...m, quantity } : m))
    );
  };

  const handleGeneratePdf = () => {
    if (!modules) return;

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

    const items = [];
    const planPrice = getPlanPrice();

    if (selectedPlan) {
      items.push({
        description: `Plano ${selectedPlan.name}${isAnnual ? ' (Anual)' : ' (Mensal)'}`,
        monthlyValue: planPrice,
        oneTimeValue: 0,
      });
    }

    selectedModules.forEach((selection) => {
      const module = modules.find((m) => m.id === selection.moduleId);
      if (module) {
        const qty = module.has_quantity ? ` (${selection.quantity} ${module.quantity_label})` : '';
        items.push({
          description: `${module.name}${qty}`,
          monthlyValue: getModulePrice(selection),
          oneTimeValue: 0,
        });
      }
    });

    const infrastructureCost = getInfrastructureCost();
    if (infrastructureCost > 0) {
      items.push({
        description: `Infraestrutura estimada (${monthlyConversations.toLocaleString('pt-BR')} atendimentos)`,
        monthlyValue: infrastructureCost,
        oneTimeValue: 0,
      });
    }

    const implementationPrice = selectedImplementation?.price || 0;
    if (selectedImplementation) {
      items.push({
        description: selectedImplementation.name,
        monthlyValue: 0,
        oneTimeValue: implementationPrice,
      });
    }

    const monthlySubtotal = planPrice + selectedModules.reduce((sum, sel) => sum + getModulePrice(sel), 0) + infrastructureCost;
    const monthlyTotal = customDiscount > 0 ? monthlySubtotal * (1 - customDiscount / 100) : monthlySubtotal;
    const firstMonthTotal = monthlyTotal + implementationPrice;
    const annualTotal = monthlyTotal * 12 + implementationPrice;

    generateProposalPdf({
      items,
      monthlyTotal,
      oneTimeTotal: implementationPrice,
      firstMonthTotal,
      annualTotal,
      validityDays: settings?.proposal_validity_days || 15,
      customDiscount,
      isAnnual,
    });
  };

  const handleWhatsAppContact = () => {
    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    let message = '🤖 *Olá! Gostaria de contratar o Atende Julia!*\n\n';

    if (selectedPlan) {
      const planPrice = isAnnual
        ? selectedPlan.price * (1 - annualDiscount / 100)
        : selectedPlan.price;
      message += `📋 *Plano:* ${selectedPlan.name} - ${formatCurrency(planPrice)}/mês\n`;
    }

    if (selectedModules.length > 0 && modules) {
      message += '\n📦 *Módulos extras:*\n';
      selectedModules.forEach((selection) => {
        const module = modules.find((m) => m.id === selection.moduleId);
        if (module) {
          const qty = module.has_quantity ? ` (${selection.quantity} ${module.quantity_label})` : '';
          message += `  • ${module.name}${qty}\n`;
        }
      });
    }

    if (selectedImplementation) {
      message += `\n🔧 *Implementação:* ${selectedImplementation.name}\n`;
    }

    message += '\n_Por favor, entrem em contato para finalizar a contratação!_';

    const phone = settings?.whatsapp_number || '5511999999999';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Calculadora de Preços
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Monte seu plano personalizado e veja quanto investir para transformar
            seu atendimento com inteligência artificial.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : (
          <div className="space-y-10">
            {/* Section 1: Plans */}
            <section>
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      1. Escolha seu Plano Base
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <Label htmlFor="billing-toggle" className="text-sm">
                        Mensal
                      </Label>
                      <Switch
                        id="billing-toggle"
                        checked={isAnnual}
                        onCheckedChange={setIsAnnual}
                      />
                      <Label htmlFor="billing-toggle" className="text-sm">
                        Anual{" "}
                        <span className="text-green-600 font-medium">
                          (-{annualDiscount}%)
                        </span>
                      </Label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <PlanSelector
                    plans={plans || []}
                    selectedPlanId={selectedPlanId}
                    onSelectPlan={setSelectedPlanId}
                    isAnnual={isAnnual}
                    annualDiscount={annualDiscount}
                  />
                </CardContent>
              </Card>
            </section>

            {/* Section 2: Extra Modules */}
            <section>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    2. Adicione Módulos Extras (Opcional)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modules?.map((module) => (
                      <ExtraModuleCard
                        key={module.id}
                        module={module}
                        selection={selectedModules.find((m) => m.moduleId === module.id)}
                        onToggle={handleModuleToggle}
                        onQuantityChange={handleModuleQuantityChange}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 3: Implementation */}
            <section>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    3. Escolha o Tipo de Implementação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {implementations?.map((impl) => (
                      <ImplementationCard
                        key={impl.id}
                        implementation={impl}
                        isSelected={selectedImplementationId === impl.id}
                        onSelect={setSelectedImplementationId}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 4: Infrastructure */}
            <section>
              <InfrastructureEstimator
                monthlyConversations={monthlyConversations}
                onConversationsChange={setMonthlyConversations}
                settings={settings}
              />
            </section>

            {/* Section 5: Summary */}
            <section>
              <PriceSummary
                selectedPlan={selectedPlan}
                selectedModules={selectedModules}
                modules={modules || []}
                selectedImplementation={selectedImplementation}
                isAnnual={isAnnual}
                annualDiscount={annualDiscount}
                customDiscount={customDiscount}
                onCustomDiscountChange={setCustomDiscount}
                monthlyConversations={monthlyConversations}
                settings={settings}
                onGeneratePdf={handleGeneratePdf}
                onWhatsAppContact={handleWhatsAppContact}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
