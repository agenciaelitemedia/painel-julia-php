import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAvailableAgentsForHelena, AvailableAgent } from "@/hooks/useAvailableAgentsForHelena";
import { useLinkAgentHelena, LinkAgentHelenaData } from "@/hooks/useLinkAgentHelena";
import { toast } from "sonner";
import { Loader2, Search, ChevronLeft, ChevronRight, User, Building, Hash, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { COUNTRIES, getCountryFlag } from "@/lib/constants/countries";

interface LinkAgentHelenaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionToken: string | null;
  generateFreshToken: (() => string | null) | null;
}

export function LinkAgentHelenaDialog({
  open,
  onOpenChange,
  sessionToken,
  generateFreshToken,
}: LinkAgentHelenaDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedAgent, setSelectedAgent] = useState<AvailableAgent | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form fields
  const [helenaCountId, setHelenaCountId] = useState("");
  const [helenaToken, setHelenaToken] = useState("");
  const [helenaUserId, setHelenaUserId] = useState("");
  const [wpNumber, setWpNumber] = useState("");
  const [wpCountry, setWpCountry] = useState("BR");
  const [status, setStatus] = useState(true);

  const { data: availableAgents, isLoading: agentsLoading } = useAvailableAgentsForHelena(
    sessionToken,
    generateFreshToken,
    open
  );

  const linkMutation = useLinkAgentHelena(sessionToken, generateFreshToken);

  // Filter agents based on search
  const filteredAgents = useMemo(() => {
    if (!availableAgents) return [];
    if (!searchTerm) return availableAgents;
    
    const term = searchTerm.toLowerCase();
    return availableAgents.filter(
      (agent) =>
        agent.name?.toLowerCase().includes(term) ||
        agent.business_name?.toLowerCase().includes(term) ||
        agent.cod_agent?.toString().includes(term)
    );
  }, [availableAgents, searchTerm]);

  const resetForm = () => {
    setStep(1);
    setSelectedAgent(null);
    setSearchTerm("");
    setHelenaCountId("");
    setHelenaToken("");
    setHelenaUserId("");
    setWpNumber("");
    setWpCountry("BR");
    setStatus(true);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSelectAgent = (agent: AvailableAgent) => {
    setSelectedAgent(agent);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length <= 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleWpNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWpNumber(formatPhoneNumber(e.target.value));
  };

  const handleSubmit = async () => {
    if (!selectedAgent) return;
    
    if (!helenaCountId.trim()) {
      toast.error("Atende Julia Count ID é obrigatório");
      return;
    }
    
    if (!helenaToken.trim()) {
      toast.error("Atende Julia Token é obrigatório");
      return;
    }

    const countryData = COUNTRIES.find(c => c.value === wpCountry);
    const ddi = countryData?.ddi.replace('+', '') || '55';
    const cleanNumber = wpNumber.replace(/\D/g, '');
    const fullWpNumber = cleanNumber ? `${ddi}${cleanNumber}` : undefined;

    const data: LinkAgentHelenaData = {
      cod_agent: selectedAgent.cod_agent,
      helena_count_id: helenaCountId.trim(),
      helena_token: helenaToken.trim(),
      helena_user_id: helenaUserId.trim() || undefined,
      wp_number: fullWpNumber,
      status,
    };

    try {
      await linkMutation.mutateAsync(data);
      toast.success(`Agente ${selectedAgent.cod_agent} vinculado com sucesso!`);
      handleClose();
    } catch (error) {
      toast.error(`Erro ao vincular agente: ${(error as Error).message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b bg-muted/30">
          <DialogTitle className="text-lg">
            {step === 1 ? "Vincular Agente ao Atende Julia" : "Configurar Atende Julia"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {step === 1 
              ? "Busque e selecione um agente disponível para vincular" 
              : `Configure os dados do Atende Julia para o agente selecionado`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6 py-4">
          {step === 1 ? (
            <div className="space-y-3 h-full flex flex-col">
              {/* Search with counter */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, razão social ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-9"
                    autoFocus
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Badge variant="secondary" className="whitespace-nowrap h-9 px-3">
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  {filteredAgents.length}
                  {searchTerm && ` / ${availableAgents?.length || 0}`}
                </Badge>
              </div>

              {/* Agents List */}
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-[350px] border rounded-lg bg-background">
                  {agentsLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Carregando agentes...</p>
                    </div>
                  ) : filteredAgents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                      <div className="p-4 bg-muted/50 rounded-full mb-3">
                        <User className="h-8 w-8" />
                      </div>
                      {searchTerm ? (
                        <>
                          <p className="font-medium">Nenhum resultado encontrado</p>
                          <p className="text-sm">Tente buscar com outros termos</p>
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={clearSearch}
                            className="mt-2"
                          >
                            Limpar busca
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="font-medium">Nenhum agente disponível</p>
                          <p className="text-sm">Todos os agentes já estão vinculados</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredAgents.map((agent) => (
                        <button
                          key={agent.cod_agent}
                          onClick={() => handleSelectAgent(agent)}
                          className={cn(
                            "w-full px-4 py-3 text-left transition-all",
                            "hover:bg-accent/50 active:bg-accent",
                            "focus:outline-none focus:bg-accent/50",
                            "group"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <Badge variant="outline" className="text-xs font-mono px-1.5 py-0">
                                  <Hash className="h-2.5 w-2.5 mr-0.5" />
                                  {agent.cod_agent}
                                </Badge>
                                <span className="font-medium text-sm truncate">
                                  {agent.name}
                                </span>
                              </div>
                              {agent.business_name && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Building className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{agent.business_name}</span>
                                </div>
                              )}
                            </div>
                            
                            <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Quick tip */}
              {!agentsLoading && filteredAgents.length > 0 && (
                <p className="text-xs text-muted-foreground text-center flex-shrink-0">
                  Clique em um agente para continuar
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected agent info */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-full flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      #{selectedAgent?.cod_agent}
                    </Badge>
                    <span className="font-medium text-sm truncate">
                      {selectedAgent?.name}
                    </span>
                  </div>
                  {selectedAgent?.business_name && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {selectedAgent.business_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="helena_count_id" className="text-sm">
                      Count ID <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="helena_count_id"
                      value={helenaCountId}
                      onChange={(e) => setHelenaCountId(e.target.value)}
                      placeholder="Digite o Count ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="helena_user_id" className="text-sm">
                      User ID
                    </Label>
                    <Input
                      id="helena_user_id"
                      value={helenaUserId}
                      onChange={(e) => setHelenaUserId(e.target.value)}
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="helena_token" className="text-sm">
                    Token <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="helena_token"
                    value={helenaToken}
                    onChange={(e) => setHelenaToken(e.target.value)}
                    placeholder="Digite o Token do Atende Julia"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wp_number" className="text-sm">
                    Número WhatsApp
                  </Label>
                  <div className="flex gap-2">
                    <Select value={wpCountry} onValueChange={setWpCountry}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue>
                          {(() => {
                            const country = COUNTRIES.find(c => c.value === wpCountry);
                            return country ? (
                              <span className="flex items-center gap-2">
                                <span>{getCountryFlag(country.code)}</span>
                                <span>{country.ddi}</span>
                              </span>
                            ) : null;
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            <span className="flex items-center gap-2">
                              <span>{getCountryFlag(country.code)}</span>
                              <span>{country.ddi}</span>
                              <span className="text-muted-foreground">{country.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="wp_number"
                      value={wpNumber}
                      onChange={handleWpNumberChange}
                      placeholder="(XX) XXXXX-XXXX"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                  <div>
                    <Label htmlFor="status" className="cursor-pointer text-sm font-medium">
                      Status do Agente
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {status ? "O agente será ativado imediatamente" : "O agente ficará inativo"}
                    </p>
                  </div>
                  <Switch
                    id="status"
                    checked={status}
                    onCheckedChange={setStatus}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-muted/30">
          <div className="flex items-center justify-between w-full">
            <div>
              {step === 2 && (
                <Button variant="ghost" onClick={handleBack} disabled={linkMutation.isPending}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} disabled={linkMutation.isPending}>
                Cancelar
              </Button>
              {step === 2 && (
                <Button onClick={handleSubmit} disabled={linkMutation.isPending}>
                  {linkMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Vincular Agente
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
