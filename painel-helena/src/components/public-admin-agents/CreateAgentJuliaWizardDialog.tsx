import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Package, Settings, MessageSquare, Building2, ChevronLeft, ChevronRight, Loader2, Check } from "lucide-react";
import { ClientStep } from "./wizard-steps/ClientStep";
import { PlanStep } from "./wizard-steps/PlanStep";
import { SettingsStep } from "./wizard-steps/SettingsStep";
import { PromptStep } from "./wizard-steps/PromptStep";
import { CRMStep } from "./wizard-steps/CRMStep";
import { useCreateAgentJulia, CreateAgentData } from "@/hooks/useCreateAgentJulia";
import { ExternalClient, CreateClientData } from "@/hooks/useExternalClients";
import { toast } from "sonner";
import { COUNTRIES } from "@/lib/constants/countries";

interface CreateAgentJuliaWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (codAgent: string) => void;
}

type TabValue = "cliente" | "planos" | "configuracoes" | "prompt" | "crm";

const TABS: TabValue[] = ["cliente", "planos", "configuracoes", "prompt", "crm"];

export function CreateAgentJuliaWizardDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateAgentJuliaWizardDialogProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("cliente");
  
  // Client step state
  const [selectedClient, setSelectedClient] = useState<ExternalClient | null>(null);
  const [newClientData, setNewClientData] = useState<CreateClientData | null>(null);
  const [codAgent, setCodAgent] = useState("");
  const [isCloser, setIsCloser] = useState(false);

  // Plan step state
  const [selectedPlan, setSelectedPlan] = useState("");
  const [limit, setLimit] = useState(0);
  const [dueDate, setDueDate] = useState(10);

  // Settings step state
  const [settings, setSettings] = useState("");

  // Prompt step state
  const [prompt, setPrompt] = useState("");

  // CRM step state
  const [helenaCountId, setHelenaCountId] = useState("");
  const [helenaToken, setHelenaToken] = useState("");
  const [wpNumber, setWpNumber] = useState("");
  const [wpCountry, setWpCountry] = useState("BR");

  const createAgentMutation = useCreateAgentJulia();

  const resetForm = () => {
    setActiveTab("cliente");
    setSelectedClient(null);
    setNewClientData(null);
    setCodAgent("");
    setIsCloser(false);
    setSelectedPlan("");
    setLimit(0);
    setDueDate(10);
    setSettings("");
    setPrompt("");
    setHelenaCountId("");
    setHelenaToken("");
    setWpNumber("");
    setWpCountry("BR");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const currentTabIndex = TABS.indexOf(activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === TABS.length - 1;

  const canProceed = () => {
    switch (activeTab) {
      case "cliente":
        if (!codAgent) return false;
        if (selectedClient) return true;
        if (newClientData) {
          return newClientData.name && newClientData.email && newClientData.phone && newClientData.city;
        }
        return false;
      case "planos":
        return selectedPlan && limit > 0 && dueDate >= 1 && dueDate <= 31;
      case "configuracoes":
        if (!settings || settings.trim() === "") return true;
        try {
          JSON.parse(settings);
          return true;
        } catch {
          return false;
        }
      case "prompt":
        return true;
      case "crm":
        // Both helenaCountId and helenaToken are required
        return helenaCountId.trim() !== "" && helenaToken.trim() !== "";
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    const nextIndex = currentTabIndex + 1;
    if (nextIndex < TABS.length) {
      setActiveTab(TABS[nextIndex]);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentTabIndex - 1;
    if (prevIndex >= 0) {
      setActiveTab(TABS[prevIndex]);
    }
  };

  const handleFinish = async () => {
    if (!canProceed()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const countryData = COUNTRIES.find(c => c.value === wpCountry);
    const ddi = countryData?.ddi.replace('+', '') || '55';
    const cleanWpNumber = wpNumber.replace(/\D/g, '');
    const fullWpNumber = cleanWpNumber ? `${ddi}${cleanWpNumber}` : undefined;

    const agentData: CreateAgentData = {
      clientId: selectedClient?.id,
      clientData: newClientData || undefined,
      cod_agent: codAgent,
      is_closer: isCloser,
      hub: "wts",
      settings: settings || undefined,
      plan: selectedPlan,
      limit,
      due_date: dueDate,
      prompt: prompt || undefined,
      helena_count_id: helenaCountId,
      helena_token: helenaToken,
      wp_number: fullWpNumber,
    };

    try {
      const result = await createAgentMutation.mutateAsync(agentData);
      handleClose();
      onSuccess(result.codAgent);
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const getTabIcon = (tab: TabValue) => {
    switch (tab) {
      case "cliente": return <User className="h-4 w-4" />;
      case "planos": return <Package className="h-4 w-4" />;
      case "configuracoes": return <Settings className="h-4 w-4" />;
      case "prompt": return <MessageSquare className="h-4 w-4" />;
      case "crm": return <Building2 className="h-4 w-4" />;
    }
  };

  const getTabLabel = (tab: TabValue) => {
    switch (tab) {
      case "cliente": return "Cliente";
      case "planos": return "Planos";
      case "configuracoes": return "Config";
      case "prompt": return "Prompt";
      case "crm": return "CRM";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <DialogTitle className="text-xl">Novo Agente Atende Julia</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-5 mx-6 mt-4">
            {TABS.map((tab, index) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                disabled={index > currentTabIndex && !canProceed()}
              >
                <span className="hidden sm:inline-flex items-center gap-2">
                  {getTabIcon(tab)}
                  {getTabLabel(tab)}
                </span>
                <span className="sm:hidden flex items-center justify-center">
                  {getTabIcon(tab)}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 overflow-auto px-6 py-4">
            <TabsContent value="cliente" className="mt-0 h-full">
              <ClientStep
                selectedClient={selectedClient}
                onSelectClient={setSelectedClient}
                newClientData={newClientData}
                onNewClientData={setNewClientData}
                codAgent={codAgent}
                onCodAgentChange={setCodAgent}
                isCloser={isCloser}
                onIsCloserChange={setIsCloser}
              />
            </TabsContent>

            <TabsContent value="planos" className="mt-0 h-full">
              <PlanStep
                selectedPlan={selectedPlan}
                onPlanChange={setSelectedPlan}
                limit={limit}
                onLimitChange={setLimit}
                dueDate={dueDate}
                onDueDateChange={setDueDate}
              />
            </TabsContent>

            <TabsContent value="configuracoes" className="mt-0 h-full">
              <SettingsStep
                settings={settings}
                onSettingsChange={setSettings}
              />
            </TabsContent>

            <TabsContent value="prompt" className="mt-0 h-full">
              <PromptStep
                prompt={prompt}
                onPromptChange={setPrompt}
              />
            </TabsContent>

            <TabsContent value="crm" className="mt-0 h-full">
              <CRMStep
                helenaCountId={helenaCountId}
                onHelenaCountIdChange={setHelenaCountId}
                helenaToken={helenaToken}
                onHelenaTokenChange={setHelenaToken}
                codAgent={codAgent}
                wpNumber={wpNumber}
                onWpNumberChange={setWpNumber}
                wpCountry={wpCountry}
                onWpCountryChange={setWpCountry}
              />
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
          <Button
            variant="outline"
            onClick={isFirstTab ? handleClose : handlePrevious}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {isFirstTab ? "Cancelar" : "Voltar"}
          </Button>

          <div className="flex items-center gap-2">
            {TABS.map((tab, index) => (
              <div
                key={tab}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index < currentTabIndex
                    ? "bg-primary"
                    : index === currentTabIndex
                    ? "bg-primary"
                    : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          {isLastTab ? (
            <Button
              onClick={handleFinish}
              disabled={!canProceed() || createAgentMutation.isPending}
            >
              {createAgentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Finalizar
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
