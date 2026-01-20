import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Package, Settings, MessageSquare, Building2, Loader2, Save } from "lucide-react";
import { EditClientStep, EditClientData } from "./wizard-steps/EditClientStep";
import { PlanStep } from "./wizard-steps/PlanStep";
import { SettingsStep } from "./wizard-steps/SettingsStep";
import { PromptStep } from "./wizard-steps/PromptStep";
import { EditHelenaStep } from "./wizard-steps/EditHelenaStep";
import { useUpdateAgentJulia, UpdateAgentData } from "@/hooks/useUpdateAgentJulia";
import { AdminAgentJulia } from "@/hooks/usePublicAdminAgentsJulia";
import { toast } from "sonner";
import { COUNTRIES } from "@/lib/constants/countries";

interface EditAgentJuliaWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: AdminAgentJulia | null;
  onSuccess: () => void;
}

type TabValue = "cliente" | "planos" | "configuracoes" | "prompt" | "crm";

const TABS: TabValue[] = ["cliente", "planos", "configuracoes", "prompt", "crm"];

// Helper to format phone for display (remove DDI if present)
const formatPhoneForDisplay = (phone: string | null): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  // Remove DDI (55) if starts with it
  if (cleaned.startsWith('55') && cleaned.length > 11) {
    return cleaned.slice(2);
  }
  return cleaned;
};

// Helper to format CPF/CNPJ for display
const formatCPFCNPJForDisplay = (value: string | null): string => {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

// Helper to format CEP for display
const formatCEPForDisplay = (value: string | null): string => {
  if (!value) return '';
  return value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
};

// Helper to format phone for Helena (WhatsApp) - only local number
const formatPhoneForHelena = (localNumber: string): string => {
  if (!localNumber) return '';
  const digits = localNumber.replace(/\D/g, '');
  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  } else if (digits.length <= 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

// Helper to parse full phone number with DDI
const parsePhoneWithDDI = (fullPhone: string | number | null | undefined): { country: string; localNumber: string } => {
  if (!fullPhone) return { country: 'BR', localNumber: '' };
  const clean = String(fullPhone).replace(/\D/g, '');
  // Sort by DDI length descending to match longer DDIs first
  const sortedCountries = [...COUNTRIES].sort((a, b) => 
    b.ddi.replace('+', '').length - a.ddi.replace('+', '').length
  );
  for (const country of sortedCountries) {
    const ddi = country.ddi.replace('+', '');
    if (clean.startsWith(ddi)) {
      return {
        country: country.value,
        localNumber: clean.slice(ddi.length)
      };
    }
  }
  // Default: Brasil
  return { country: 'BR', localNumber: clean };
};

export function EditAgentJuliaWizardDialog({
  open,
  onOpenChange,
  agent,
  onSuccess,
}: EditAgentJuliaWizardDialogProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("cliente");
  
  // Client step state
  const [clientData, setClientData] = useState<EditClientData>({
    cod_agent: '',
    name: '',
    business_name: '',
    federal_id: '',
    email: '',
    phone: '',
    country: 'BR',
    state: '',
    city: '',
    zip_code: '',
    is_closer: false,
  });

  // Plan step state
  const [selectedPlan, setSelectedPlan] = useState("");
  const [limit, setLimit] = useState(0);
  const [dueDate, setDueDate] = useState(10);

  // Settings step state
  const [settings, setSettings] = useState("");

  // Prompt step state
  const [prompt, setPrompt] = useState("");

  // Helena step state
  const [helenaCountId, setHelenaCountId] = useState("");
  const [helenaToken, setHelenaToken] = useState("");
  const [helenaWpNumber, setHelenaWpNumber] = useState("");
  const [helenaWpCountry, setHelenaWpCountry] = useState("BR");

  const updateAgentMutation = useUpdateAgentJulia();

  // Load agent data when dialog opens
  useEffect(() => {
    if (agent && open) {
      setClientData({
        cod_agent: agent.cod_agent?.toString() || '',
        name: agent.name || '',
        business_name: agent.business_name || '',
        federal_id: formatCPFCNPJForDisplay(agent.federal_id),
        email: agent.email || '',
        phone: formatPhoneForDisplay(agent.phone),
        country: agent.country || 'BR',
        state: agent.state || '',
        city: agent.city || '',
        zip_code: formatCEPForDisplay(agent.zip_code),
        is_closer: agent.is_closer || false,
      });
      
      setSelectedPlan(agent.plan || '');
      setLimit(agent.limit || 0);
      setDueDate(parseInt(agent.due_date, 10) || 10);
      
      // Parse settings if it's a string
      let settingsStr = '';
      if (agent.settings) {
        if (typeof agent.settings === 'string') {
          settingsStr = agent.settings;
        } else {
          settingsStr = JSON.stringify(agent.settings, null, 2);
        }
      }
      setSettings(settingsStr);
      
      setPrompt(agent.prompt || '');
      
      setHelenaCountId(agent.helena_count_id || '');
      setHelenaToken(agent.helena_token || '');
      
      const parsed = parsePhoneWithDDI(agent.wp_number);
      setHelenaWpCountry(parsed.country);
      setHelenaWpNumber(formatPhoneForHelena(parsed.localNumber));
      
      setActiveTab("cliente");
    }
  }, [agent, open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const canSave = (): boolean => {
    // Basic validations - only name and email are truly required
    if (!clientData.name || !clientData.email) return false;
    if (!selectedPlan || limit <= 0) return false;
    
    // Validate JSON if settings is provided
    if (settings && settings.trim() !== '') {
      try {
        JSON.parse(settings);
      } catch {
        return false;
      }
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!canSave() || !agent) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const updateData: UpdateAgentData = {
      cod_agent: agent.cod_agent.toString(),
      agent_id: agent.agent_id!,
      
      // Client data
      name: clientData.name,
      business_name: clientData.business_name,
      federal_id: clientData.federal_id,
      email: clientData.email,
      phone: clientData.phone,
      country: clientData.country,
      state: clientData.state,
      city: clientData.city,
      zip_code: clientData.zip_code,
      
      // Agent data
      is_closer: clientData.is_closer,
      settings: settings || '{}',
      
      // Plan data
      plan: selectedPlan,
      limit,
      due_date: dueDate,
      
      // Prompt
      prompt,
      
      // Helena data (only if changed)
      helena_count_id: helenaCountId !== agent.helena_count_id ? helenaCountId : undefined,
      helena_token: helenaToken !== agent.helena_token ? helenaToken : undefined,
    };

    // Handle WhatsApp number with DDI
    const countryData = COUNTRIES.find(c => c.value === helenaWpCountry);
    const ddi = countryData?.ddi.replace('+', '') || '55';
    const cleanWpNumber = helenaWpNumber.replace(/\D/g, '');
    const fullWpNumber = cleanWpNumber ? `${ddi}${cleanWpNumber}` : '';
    
    if (fullWpNumber !== String(agent.wp_number || '').replace(/\D/g, '')) {
      updateData.wp_number = fullWpNumber || undefined;
    }

    try {
      await updateAgentMutation.mutateAsync(updateData);
      handleClose();
      onSuccess();
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

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <DialogTitle className="text-xl">
            Editar Agente - {agent.cod_agent}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-5 mx-6 mt-4">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
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
              <EditClientStep
                clientData={clientData}
                onClientDataChange={setClientData}
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
                isEditMode={true}
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
              <EditHelenaStep
                helenaCountId={helenaCountId}
                helenaToken={helenaToken}
                onHelenaTokenChange={setHelenaToken}
                wpNumber={helenaWpNumber}
                onWpNumberChange={setHelenaWpNumber}
                wpCountry={helenaWpCountry}
                onWpCountryChange={setHelenaWpCountry}
                codAgent={agent.cod_agent.toString()}
              />
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>

          <Button
            onClick={handleSave}
            disabled={!canSave() || updateAgentMutation.isPending}
          >
            {updateAgentMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
