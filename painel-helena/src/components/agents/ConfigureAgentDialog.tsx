import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { JuliaAgent, AgentTool, StartConversationPhrases } from "@/hooks/useJuliaAgents";
import { useClientData } from "@/hooks/useClientData";
import { useCalendars } from "@/hooks/useCalendars";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar as CalendarIcon, X, Plus } from "lucide-react";
import { toast } from "sonner";

interface ConfigureAgentDialogProps {
  agent: JuliaAgent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    agentId: string, 
    selectedCode?: string,
    customPrompt?: string,
    aiModelId?: string,
    aiTemperature?: number,
    aiMaxTokens?: number,
    systemInstructions?: string,
    pausePhrases?: string[],
    toolsConfig?: { enabled_tools: AgentTool[] },
    agentBio?: string,
    startConversationPhrases?: StartConversationPhrases
  ) => Promise<void>;
  isLoading: boolean;
}

export function ConfigureAgentDialog({
  agent,
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: ConfigureAgentDialogProps) {
  const { clientData } = useClientData();
  const { calendars } = useCalendars();
  
  // Personalidade Tab
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [agentBio, setAgentBio] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [systemInstructions, setSystemInstructions] = useState("");
  const [usedCodes, setUsedCodes] = useState<string[]>([]);
  
  // Comportamento Tab
  const [pausePhrases, setPausePhrases] = useState<string[]>([]);
  const [newPausePhrase, setNewPausePhrase] = useState("");
  const [startConversationEnabled, setStartConversationEnabled] = useState(false);
  const [startMatchType, setStartMatchType] = useState<'contains' | 'equals'>('contains');
  const [startPhrases, setStartPhrases] = useState<string[]>([]);
  const [newStartPhrase, setNewStartPhrase] = useState("");
  
  // Tools state
  const [bookingToolEnabled, setBookingToolEnabled] = useState(false);
  const [bookingCalendarId, setBookingCalendarId] = useState("");

  useEffect(() => {
    if (open && agent) {
      setSelectedCode(agent.selected_julia_code || null);
      setAgentBio(agent.agent_bio || "");
      setCustomPrompt(agent.custom_prompt || "");
      setSystemInstructions(agent.system_instructions || "");
      setPausePhrases(agent.pause_phrases || []);
      setNewPausePhrase("");
      
      const startConfig = agent.start_conversation_phrases as StartConversationPhrases | null;
      setStartConversationEnabled(startConfig?.enabled || false);
      setStartMatchType(startConfig?.match_type || 'contains');
      setStartPhrases(startConfig?.phrases || []);
      setNewStartPhrase("");
      
      // Carregar configuração de tools
      const toolsConfig = agent.tools_config?.enabled_tools || [];
      const bookingTool = toolsConfig.find(t => t.tool_id === 'booking');
      setBookingToolEnabled(bookingTool?.enabled || false);
      setBookingCalendarId(bookingTool?.config?.calendar_id || "");
      
      if (agent.agent_type === 'julia') {
        fetchUsedCodes();
      }
    }
  }, [open, agent]);

  const fetchUsedCodes = async () => {
    if (!agent) return;
    
    const { data, error } = await supabase
      .from('julia_agents')
      .select('selected_julia_code')
      .neq('id', agent.id)
      .not('selected_julia_code', 'is', null);

    if (!error && data) {
      setUsedCodes(data.map(a => a.selected_julia_code).filter(Boolean) as string[]);
    }
  };

  const handleSubmit = async () => {
    if (!agent) return;

    // Validações para agente custom
    if (agent.agent_type === 'custom') {
      if (agentBio && agentBio.length > 200) {
        toast.error('Bio do Agente deve ter no máximo 200 caracteres');
        return;
      }
      
      if (agent.release_customization !== false && customPrompt && customPrompt.length > 1000) {
        toast.error('Prompt Principal deve ter no máximo 1000 caracteres');
        return;
      }
      
      if (pausePhrases.length > 5) {
        toast.error('Máximo de 5 frases de pausa permitidas');
        return;
      }
      
      if (startPhrases.length > 5) {
        toast.error('Máximo de 5 frases de início permitidas');
        return;
      }
    }

    // Montar array de tools habilitadas
    const enabledTools: AgentTool[] = [];
    
    if (bookingToolEnabled && bookingCalendarId) {
      enabledTools.push({
        tool_id: 'booking',
        enabled: true,
        config: {
          calendar_id: bookingCalendarId
        }
      });
    }

    const startConversationPhrases: StartConversationPhrases = {
      enabled: startConversationEnabled,
      match_type: startMatchType,
      phrases: startPhrases
    };

    await onSubmit(
      agent.id,
      agent.agent_type === 'julia' ? (selectedCode || undefined) : undefined,
      agent.agent_type === 'custom' ? customPrompt : undefined,
      undefined, // aiModelId
      undefined, // aiTemperature
      undefined, // aiMaxTokens
      systemInstructions,
      pausePhrases,
      { enabled_tools: enabledTools },
      agentBio,
      startConversationPhrases
    );
  };

  const handleAddPausePhrase = () => {
    if (newPausePhrase.trim() && !pausePhrases.includes(newPausePhrase.trim()) && pausePhrases.length < 5) {
      setPausePhrases([...pausePhrases, newPausePhrase.trim()]);
      setNewPausePhrase("");
    } else if (pausePhrases.length >= 5) {
      toast.error('Máximo de 5 frases de pausa atingido');
    }
  };

  const handleRemovePausePhrase = (phrase: string) => {
    setPausePhrases(pausePhrases.filter(p => p !== phrase));
  };

  const handleAddStartPhrase = () => {
    if (newStartPhrase.trim() && !startPhrases.includes(newStartPhrase.trim()) && startPhrases.length < 5) {
      setStartPhrases([...startPhrases, newStartPhrase.trim()]);
      setNewStartPhrase("");
    } else if (startPhrases.length >= 5) {
      toast.error('Máximo de 5 frases de início atingido');
    }
  };

  const handleRemoveStartPhrase = (phrase: string) => {
    setStartPhrases(startPhrases.filter(p => p !== phrase));
  };

  const availableCodes = clientData?.julia_agent_codes || [];
  const isCodeUsed = (code: string) => usedCodes.includes(code);
  const showCustomPrompt = clientData?.release_customization !== false;

  const tabsConfig = agent?.agent_type === 'custom' 
    ? [
        { value: 'personality', label: 'Personalidade' },
        { value: 'behavior', label: 'Comportamento' },
        ...(clientData?.release_customization !== false ? [{ value: 'tools', label: 'Ferramentas' }] : [])
      ]
    : [
        { value: 'general', label: 'Configurações Gerais' },
        ...(clientData?.release_customization !== false ? [{ value: 'tools', label: 'Ferramentas' }] : [])
      ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {agent?.agent_type === 'julia' ? 'Configurar Agente Julia' : 'Configurar Agente IA Custom'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={tabsConfig[0].value} className="w-full">
          <TabsList className={`grid w-full grid-cols-${tabsConfig.length}`}>
            {tabsConfig.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Personalidade - Apenas Custom */}
          {agent?.agent_type === 'custom' && (
            <TabsContent value="personality" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="agentBio">Bio do Agente</Label>
                  <span className="text-sm text-muted-foreground">
                    {agentBio.length}/200 caracteres
                  </span>
                </div>
                <Textarea
                  id="agentBio"
                  value={agentBio}
                  onChange={(e) => {
                    if (e.target.value.length <= 200) {
                      setAgentBio(e.target.value);
                    }
                  }}
                  placeholder="Ex: Sou Maria, atendente virtual da Clínica BelaVida 🏥 | 📍 Rua das Flores, 123 | 📞 (34) 3333-3333 | 💬 Instagram: @clínicabelavida"
                  rows={4}
                  maxLength={200}
                />
                <p className="text-sm text-muted-foreground">
                  Como uma bio do Instagram: nome, endereço, telefone, redes sociais.
                </p>
              </div>

              {showCustomPrompt && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="customPrompt">Prompt Principal</Label>
                    <span className="text-sm text-muted-foreground">
                      {customPrompt.length}/1000 caracteres
                    </span>
                  </div>
                  <Textarea
                    id="customPrompt"
                    value={customPrompt}
                    onChange={(e) => {
                      if (e.target.value.length <= 1000) {
                        setCustomPrompt(e.target.value);
                      }
                    }}
                    placeholder="Você é um assistente virtual especializado em..."
                    rows={8}
                    maxLength={1000}
                  />
                  <p className="text-sm text-muted-foreground">
                    Prompt principal que define a personalidade e comportamento do agente.
                  </p>
                </div>
              )}
            </TabsContent>
          )}

          {/* Tab Comportamento - Apenas Custom */}
          {agent?.agent_type === 'custom' && (
            <TabsContent value="behavior" className="space-y-6 mt-4">
              {/* Ativar/Desativar Agente */}
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Status do Agente</h3>
                    <p className="text-sm text-muted-foreground">
                      {agent?.is_paused_globally ? 'Agente pausado para todas as conversas' : 'Agente ativo para todas as conversas'}
                    </p>
                  </div>
                  <Switch
                    checked={!agent?.is_paused_globally}
                    onCheckedChange={async (checked) => {
                      if (!agent) return;
                      const { error } = await supabase
                        .from('julia_agents')
                        .update({ is_paused_globally: !checked })
                        .eq('id', agent.id);
                      
                      if (error) {
                        toast.error('Erro ao atualizar status do agente');
                      } else {
                        toast.success(checked ? 'Agente ativado!' : 'Agente pausado!');
                        window.location.reload();
                      }
                    }}
                  />
                </div>
              </div>

              {/* Frases de Pausa */}
              <div className="space-y-4">
                <div>
                  <Label>Frases de Pausa Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Configure até 5 frases que pausam a conversa automaticamente
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    value={newPausePhrase}
                    onChange={(e) => setNewPausePhrase(e.target.value)}
                    placeholder="Ex: falar com humano"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPausePhrase();
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddPausePhrase} 
                    variant="outline"
                    disabled={pausePhrases.length >= 5}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>

                {pausePhrases.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {pausePhrases.map((phrase, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {phrase}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleRemovePausePhrase(phrase)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {pausePhrases.length}/5 frases cadastradas
                </p>
              </div>

              {/* Iniciar Conversa com Frases */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Iniciar Conversa Apenas com Frases Específicas</Label>
                    <p className="text-sm text-muted-foreground">
                      Agente só responde se a primeira mensagem corresponder às frases cadastradas
                    </p>
                  </div>
                  <Switch
                    checked={startConversationEnabled}
                    onCheckedChange={setStartConversationEnabled}
                  />
                </div>

                {startConversationEnabled && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipo de Correspondência</Label>
                      <Select value={startMatchType} onValueChange={(v: 'contains' | 'equals') => setStartMatchType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contains">Contém a frase</SelectItem>
                          <SelectItem value="equals">É igual à frase</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={newStartPhrase}
                        onChange={(e) => setNewStartPhrase(e.target.value)}
                        placeholder="Ex: olá, oi, bom dia"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddStartPhrase();
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        onClick={handleAddStartPhrase} 
                        variant="outline"
                        disabled={startPhrases.length >= 5}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>

                    {startPhrases.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {startPhrases.map((phrase, index) => (
                          <Badge key={index} variant="secondary" className="gap-1">
                            {phrase}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => handleRemoveStartPhrase(phrase)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {startPhrases.length}/5 frases cadastradas
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {/* Tab Geral - Apenas Julia */}
          {agent?.agent_type === 'julia' && (
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Selecione o código do agente Julia:
                </p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableCodes.map((code) => {
                    const isUsed = isCodeUsed(code);
                    const isSelected = selectedCode === code;
                    
                    return (
                      <div
                        key={code}
                        onClick={() => !isUsed && setSelectedCode(code)}
                        className={`rounded-xl border bg-card text-card-foreground shadow-sm transition-colors ${
                          isUsed 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:shadow-md cursor-pointer hover:border-primary/50'
                        } ${isSelected ? 'border-primary bg-primary/5' : ''}`}
                      >
                        <div className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{code}</p>
                              {isUsed && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Em uso por outro agente
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {availableCodes.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhum código disponível. Configure códigos na área de clientes.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label>Frases de Pausa Automática</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Configure frases que, quando detectadas, pausam a conversa automaticamente
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    value={newPausePhrase}
                    onChange={(e) => setNewPausePhrase(e.target.value)}
                    placeholder="Ex: falar com humano"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPausePhrase();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddPausePhrase} variant="outline">
                    Adicionar
                  </Button>
                </div>

                {pausePhrases.length > 0 && (
                  <div className="space-y-2">
                    {pausePhrases.map((phrase, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg border bg-muted/50"
                      >
                        <span className="text-sm">{phrase}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePausePhrase(phrase)}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {/* Tab Tools */}
          <TabsContent value="tools" className="space-y-6 mt-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Tool de Agendamento</h3>
                    <p className="text-sm text-muted-foreground">
                      Permite ao agente consultar, criar, reagendar e cancelar agendamentos
                    </p>
                  </div>
                </div>
                <Switch
                  checked={bookingToolEnabled}
                  onCheckedChange={setBookingToolEnabled}
                />
              </div>

              {bookingToolEnabled && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="calendar">Agenda Vinculada</Label>
                    <Select 
                      value={bookingCalendarId} 
                      onValueChange={setBookingCalendarId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma agenda" />
                      </SelectTrigger>
                      <SelectContent>
                        {calendars?.map((calendar) => (
                          <SelectItem key={calendar.id} value={calendar.id}>
                            {calendar.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Agenda que o agente utilizará para gerenciar agendamentos
                    </p>
                  </div>

                  <div className="rounded-md bg-muted/50 p-3 space-y-2">
                    <p className="text-sm font-medium">Funcionalidades habilitadas:</p>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li>• Consultar agendamentos por número de WhatsApp</li>
                      <li>• Ver disponibilidade em data específica</li>
                      <li>• Criar novo agendamento</li>
                      <li>• Reagendar agendamento existente</li>
                      <li>• Cancelar agendamento</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || (agent?.agent_type === 'julia' && !selectedCode) || (bookingToolEnabled && !bookingCalendarId)}
            className="flex-1"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}