import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { User, Brain, Database, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface CreateJuliaAgentTabbedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAgent: (data: JuliaAgentFormData) => void;
}

export interface JuliaAgentFormData {
  // Aba 1 - Informações Básicas
  clientCode: string;
  name: string;
  office: string;
  cpfCnpj: string;
  email: string;
  plan: string;
  dueDate: string;
  leadLimit: number;
  isCloser: boolean;
  status: boolean;
  whatsapp: string;
  instanceId: string | null;
  
  // Aba 2 - Configurações IA
  openaiApiKey: string;
  openaiModel: string;
  openaiAudioApiKey: string;
  voiceModel: string;
  
  // Aba 3 - Memória
  memoryGroup: string;
  memorySlot: string;
  knowledgeBase: string;
  juliaParameters: string;
  
  // Aba 4 - Prompt
  topPrompt: string;
}

export function CreateJuliaAgentTabbedDialog({
  open,
  onOpenChange,
  onCreateAgent,
}: CreateJuliaAgentTabbedDialogProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState<JuliaAgentFormData>({
    clientCode: "",
    name: "",
    office: "",
    cpfCnpj: "",
    email: "",
    plan: "",
    dueDate: "",
    leadLimit: 0,
    isCloser: false,
    status: true,
    whatsapp: "",
    instanceId: null,
    openaiApiKey: "",
    openaiModel: "gpt-4.1-mini",
    openaiAudioApiKey: "",
    voiceModel: "ai3-pt-BR-Leila",
    memoryGroup: "",
    memorySlot: "",
    knowledgeBase: "",
    juliaParameters: "",
    topPrompt: "",
  });

  const updateFormData = (field: keyof JuliaAgentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateBasicInfo = () => {
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Email válido é obrigatório");
      return false;
    }
    return true;
  };

  const validateAIConfig = () => {
    if (!formData.openaiApiKey.trim()) {
      toast.error("API Key OpenAI é obrigatória");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (activeTab === "basic" && !validateBasicInfo()) return;
    if (activeTab === "ai" && !validateAIConfig()) return;
    
    const tabs = ["basic", "ai", "memory", "prompt"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const tabs = ["basic", "ai", "memory", "prompt"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const handleCreate = () => {
    if (!validateBasicInfo() || !validateAIConfig()) return;
    onCreateAgent(formData);
    onOpenChange(false);
    // Reset form
    setFormData({
      clientCode: "",
      name: "",
      office: "",
      cpfCnpj: "",
      email: "",
      plan: "",
      dueDate: "",
      leadLimit: 0,
      isCloser: false,
      status: true,
      whatsapp: "",
      instanceId: null,
      openaiApiKey: "",
      openaiModel: "gpt-4.1-mini",
      openaiAudioApiKey: "",
      voiceModel: "ai3-pt-BR-Leila",
      memoryGroup: "",
      memorySlot: "",
      knowledgeBase: "",
      juliaParameters: "",
      topPrompt: "",
    });
    setActiveTab("basic");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Criar Novo Agente Julia</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              IA
            </TabsTrigger>
            <TabsTrigger value="memory" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Memória
            </TabsTrigger>
            <TabsTrigger value="prompt" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Prompt
            </TabsTrigger>
          </TabsList>

          {/* ABA 1 - INFORMAÇÕES BÁSICAS */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientCode">Código do Cliente</Label>
                <Input
                  id="clientCode"
                  value={formData.clientCode}
                  onChange={(e) => updateFormData("clientCode", e.target.value)}
                  placeholder="Ex: CLI001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="Nome do agente"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="office">Escritório</Label>
                <Input
                  id="office"
                  value={formData.office}
                  onChange={(e) => updateFormData("office", e.target.value)}
                  placeholder="Nome do escritório"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                <Input
                  id="cpfCnpj"
                  value={formData.cpfCnpj}
                  onChange={(e) => updateFormData("cpfCnpj", e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan">Plano Cliente</Label>
                <Select value={formData.plan} onValueChange={(value) => updateFormData("plan", value)}>
                  <SelectTrigger id="plan">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start">Start</SelectItem>
                    <SelectItem value="ultra">Ultra</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Vencimento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => updateFormData("dueDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadLimit">Limite Leads</Label>
                <Input
                  id="leadLimit"
                  type="number"
                  value={formData.leadLimit}
                  onChange={(e) => updateFormData("leadLimit", parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="isCloser" className="cursor-pointer">É Closer?</Label>
                <Switch
                  id="isCloser"
                  checked={formData.isCloser}
                  onCheckedChange={(checked) => updateFormData("isCloser", checked)}
                  className={formData.isCloser ? 'data-[state=checked]:bg-green-500' : ''}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="status" className="cursor-pointer">Status Ativo</Label>
                <Switch
                  id="status"
                  checked={formData.status}
                  onCheckedChange={(checked) => updateFormData("status", checked)}
                  className={formData.status ? 'data-[state=checked]:bg-green-500' : ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => updateFormData("whatsapp", e.target.value)}
                placeholder="+55 (11) 99999-9999"
              />
            </div>
          </TabsContent>

          {/* ABA 2 - CONFIGURAÇÕES IA */}
          <TabsContent value="ai" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openaiApiKey">APIKEY OpenIA *</Label>
              <Input
                id="openaiApiKey"
                type="password"
                value={formData.openaiApiKey}
                onChange={(e) => updateFormData("openaiApiKey", e.target.value)}
                placeholder="sk-..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="openaiModel">Modelo OpenIA</Label>
              <Select value={formData.openaiModel} onValueChange={(value) => updateFormData("openaiModel", value)}>
                <SelectTrigger id="openaiModel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4.1-mini">gpt-4.1-mini</SelectItem>
                  <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                  <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                  <SelectItem value="gpt-5">gpt-5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="openaiAudioApiKey">APIKEY OpenIAudio</Label>
              <Input
                id="openaiAudioApiKey"
                type="password"
                value={formData.openaiAudioApiKey}
                onChange={(e) => updateFormData("openaiAudioApiKey", e.target.value)}
                placeholder="sk-..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="voiceModel">Modelo de Voz</Label>
              <Select value={formData.voiceModel} onValueChange={(value) => updateFormData("voiceModel", value)}>
                <SelectTrigger id="voiceModel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai3-pt-BR-Leila">ai3-pt-BR-Leila</SelectItem>
                  <SelectItem value="ai3-pt-BR-Maria">ai3-pt-BR-Maria</SelectItem>
                  <SelectItem value="ai3-pt-BR-João">ai3-pt-BR-João</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* ABA 3 - CONFIGURAÇÕES DE MEMÓRIA */}
          <TabsContent value="memory" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="memoryGroup">Grupo de Memória</Label>
              <Input
                id="memoryGroup"
                value={formData.memoryGroup}
                onChange={(e) => updateFormData("memoryGroup", e.target.value)}
                placeholder="Ex: grupo_vendas"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memorySlot">Memoria Slot</Label>
              <Input
                id="memorySlot"
                value={formData.memorySlot}
                onChange={(e) => updateFormData("memorySlot", e.target.value)}
                placeholder="Ex: slot_1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="knowledgeBase">Base de Conhecimento</Label>
              <Input
                id="knowledgeBase"
                value={formData.knowledgeBase}
                onChange={(e) => updateFormData("knowledgeBase", e.target.value)}
                placeholder="URL ou identificador da base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="juliaParameters">Parâmetros da Julia (JSON)</Label>
              <Textarea
                id="juliaParameters"
                value={formData.juliaParameters}
                onChange={(e) => updateFormData("juliaParameters", e.target.value)}
                placeholder='{"key": "value"}'
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </TabsContent>

          {/* ABA 4 - CONFIGURAÇÕES DE PROMPT */}
          <TabsContent value="prompt" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topPrompt">Prompt do Topo da Julia</Label>
              <Textarea
                id="topPrompt"
                value={formData.topPrompt}
                onChange={(e) => updateFormData("topPrompt", e.target.value)}
                placeholder="Digite o prompt customizado para o agente Julia..."
                rows={15}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Este prompt será usado como instrução principal para o agente Julia
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={activeTab === "basic"}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          
          {activeTab === "prompt" ? (
            <Button onClick={handleCreate}>
              Criar Agente
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
