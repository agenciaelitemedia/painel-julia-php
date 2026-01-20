import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, CheckCircle, Info, MessageSquare } from "lucide-react";
import { usePublicAgentDetails } from "@/hooks/usePublicAgentDetails";
import { usePublicAgentMutations } from "@/hooks/usePublicAgentMutations";
import { formatInBrazil } from "@/lib/utils/timezone";

interface AgentInfoTabProps {
  codAgent: string;
  sessionToken: string | null;
  generateFreshToken: (() => string | null) | null;
}

export function AgentInfoTab({ codAgent, sessionToken, generateFreshToken }: AgentInfoTabProps) {
  const { data: agentDetails, isLoading } = usePublicAgentDetails(
    codAgent,
    sessionToken,
    generateFreshToken
  );

  const agent = agentDetails?.[0];
  
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState("");

  const { updateAgentBio, updateAgentStatus, updateAgentMessages } = usePublicAgentMutations();

  useEffect(() => {
    if (agent) {
      setBio(agent.bio || "");
      setStatus(agent.status);
      setWelcomeMessage(agent.agent_welcome || "");
    }
  }, [agent]);

  const handleSaveBio = () => {
    if (!sessionToken) return;
    updateAgentBio.mutate({
      cod_agent: codAgent,
      bio,
      sessionToken,
    });
  };

  const handleStatusChange = (checked: boolean) => {
    if (!sessionToken) return;
    setStatus(checked);
    updateAgentStatus.mutate({
      cod_agent: codAgent,
      status: checked,
      sessionToken,
    });
  };

  const handleSaveMessages = () => {
    if (!sessionToken) return;
    updateAgentMessages.mutate({
      cod_agent: codAgent,
      agent_welcome: welcomeMessage,
      agent_fees: "",
      sessionToken,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status do Agent */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">Status do Agente</h3>
              <p className="text-sm text-muted-foreground">
                {status ? "Agente ativo para todas as conversas" : "Agente pausado - não responderá conversas"}
              </p>
            </div>
            <Switch
              checked={status}
              onCheckedChange={handleStatusChange}
              disabled={updateAgentStatus.isPending}
            />
          </div>

          {/* Informações Adicionais */}
          {agent && (
            <div className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nome</Label>
                  <p className="text-sm font-medium">{agent.name}</p>
                </div>
                {agent.business_name && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Empresa</Label>
                    <p className="text-sm font-medium">{agent.business_name}</p>
                  </div>
                )}
                {agent.plan && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Plano</Label>
                    <p className="text-sm font-medium">{agent.plan}</p>
                  </div>
                )}
                {agent.due_date && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Vencimento</Label>
                    <p className="text-sm font-medium">
                      {formatInBrazil(new Date(agent.due_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Info className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">
                  Uso: <span className="font-medium text-foreground">{agent.used}</span> de{" "}
                  <span className="font-medium text-foreground">{agent.limit}</span> mensagens
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bio do Agent */}
      <Card>
        <CardHeader>
          <CardTitle>Bio do Agente</CardTitle>
          <CardDescription>
            Como uma bio do Instagram: nome, endereço, telefone, redes sociais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Mensagem de Bio</Label>
              <span className="text-xs text-muted-foreground">
                {bio.length}/200 caracteres
              </span>
            </div>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              placeholder="Ex: Sou Maria, atendente virtual da Clínica BelaVida 🏥 | 📍 Rua das Flores, 123 - Centro | 📞 (11) 98765-4321"
              className="min-h-[100px] resize-none"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              Esta bio será exibida nas primeiras interações com clientes
            </p>
          </div>

          <Button
            onClick={handleSaveBio}
            disabled={updateAgentBio.isPending || bio === agent?.bio}
            className="w-full sm:w-auto"
          >
            {updateAgentBio.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Salvar Bio
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Mensagens do Agent */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>Mensagens do Agente</CardTitle>
          </div>
          <CardDescription>
            Configure as mensagens automáticas do agente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mensagem de Boas Vindas */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Mensagem de Boas Vindas</Label>
              <span className="text-xs text-muted-foreground">
                {welcomeMessage.length}/500 caracteres
              </span>
            </div>
            <Textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value.slice(0, 500))}
              placeholder="Ex: Olá! Seja bem-vindo ao nosso atendimento jurídico. Como posso ajudá-lo hoje?"
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              Mensagem enviada no início do atendimento
            </p>
          </div>

          <Button
            onClick={handleSaveMessages}
            disabled={
              updateAgentMessages.isPending || 
              welcomeMessage === (agent?.agent_welcome || "")
            }
            className="w-full sm:w-auto"
          >
            {updateAgentMessages.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Salvar Mensagens
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
