import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Settings, MessageSquare, FileText, Loader2, Bot } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { usePublicAgentSettings, NotificationSettings } from "@/hooks/usePublicAgentSettings";

interface AgentSettingsTabProps {
  codAgent: string;
  sessionToken: string | null;
  generateFreshToken: (() => string | null) | null;
}

export function AgentSettingsTab({ codAgent, sessionToken, generateFreshToken }: AgentSettingsTabProps) {
  const { settings, isLoading, updateSettings } = usePublicAgentSettings(
    codAgent,
    sessionToken,
    generateFreshToken
  );

  const [chatResume, setChatResume] = useState(false);
  const [onlyMeResume, setOnlyMeResume] = useState(false);
  const [notifyResume, setNotifyResume] = useState("");
  const [notifyDocCreated, setNotifyDocCreated] = useState("");
  const [notifyDocSigned, setNotifyDocSigned] = useState("");
  const [sessionStart, setSessionStart] = useState("");
  const [contractSigned, setContractSigned] = useState("");

  // Load settings when data arrives
  useEffect(() => {
    if (settings) {
      setChatResume(settings.CHAT_RESUME || false);
      setOnlyMeResume(settings.ONLY_ME_RESUME || false);
      setNotifyResume(settings.NOTIFY_RESUME || "");
      setNotifyDocCreated(settings.NOTIFY_DOC_CREATED || "");
      setNotifyDocSigned(settings.NOTIFY_DOC_SIGNED || "");
      setSessionStart(settings.SESSION_START || "");
      setContractSigned(settings.CONTRACT_SIGNED || "");
    }
  }, [settings]);

  const handleSave = () => {
    const newSettings: NotificationSettings = {
      CHAT_RESUME: chatResume,
      ONLY_ME_RESUME: onlyMeResume,
      NOTIFY_RESUME: notifyResume,
      NOTIFY_DOC_CREATED: notifyDocCreated,
      NOTIFY_DOC_SIGNED: notifyDocSigned,
      SESSION_START: sessionStart,
      CONTRACT_SIGNED: contractSigned
    };

    updateSettings.mutate(newSettings);
  };

  const hasChanges = 
    chatResume !== (settings.CHAT_RESUME || false) ||
    onlyMeResume !== (settings.ONLY_ME_RESUME || false) ||
    notifyResume !== (settings.NOTIFY_RESUME || "") ||
    notifyDocCreated !== (settings.NOTIFY_DOC_CREATED || "") ||
    notifyDocSigned !== (settings.NOTIFY_DOC_SIGNED || "") ||
    sessionStart !== (settings.SESSION_START || "") ||
    contractSigned !== (settings.CONTRACT_SIGNED || "");

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
      {/* Resume Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>Configurações de Resumo</CardTitle>
          </div>
          <CardDescription>
            Configure como os resumos das conversas serão enviados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {/* Chat Resume */}
            <div className="flex items-center justify-between space-x-4 rounded-lg border border-border p-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="chat-resume" className="text-base font-medium">
                  Resumo no Chat
                </Label>
                <p className="text-sm text-muted-foreground">
                  Exibe resumo da conversa no chat do cliente
                </p>
              </div>
              <Switch
                id="chat-resume"
                checked={chatResume}
                onCheckedChange={setChatResume}
              />
            </div>

            {/* Only Me Resume */}
            <div className="flex items-center justify-between space-x-4 rounded-lg border border-border p-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="only-me-resume" className="text-base font-medium">
                  Resumo Privado
                </Label>
                <p className="text-sm text-muted-foreground">
                  Resumo visível apenas no WhatsApp e para atendentes
                </p>
              </div>
              <Switch
                id="only-me-resume"
                checked={onlyMeResume}
                onCheckedChange={setOnlyMeResume}
              />
            </div>

            {/* Notify Resume Phone */}
            <div className="space-y-2">
              <Label htmlFor="notify-resume">WhatsApp para Resumos</Label>
              <PhoneInput
                id="notify-resume"
                value={notifyResume}
                onChange={setNotifyResume}
              />
              <p className="text-xs text-muted-foreground">
                Número que receberá os resumos das conversas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Notifications Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Notificações de Documentos</CardTitle>
          </div>
          <CardDescription>
            Configure os números que receberão notificações sobre documentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Notify Doc Created */}
            <div className="space-y-2">
              <Label htmlFor="notify-doc-created">Notificar Documentos Criados</Label>
              <PhoneInput
                id="notify-doc-created"
                value={notifyDocCreated}
                onChange={setNotifyDocCreated}
              />
              <p className="text-xs text-muted-foreground">
                Número notificado quando documentos são criados
              </p>
            </div>

            {/* Notify Doc Signed */}
            <div className="space-y-2">
              <Label htmlFor="notify-doc-signed">Notificar Documentos Assinados</Label>
              <PhoneInput
                id="notify-doc-signed"
                value={notifyDocSigned}
                onChange={setNotifyDocSigned}
              />
              <p className="text-xs text-muted-foreground">
                Número notificado quando documentos são assinados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle>Configurações de Mensagens</CardTitle>
          </div>
          <CardDescription>
            Configure mensagens personalizadas do agent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session Start */}
          <div className="space-y-2">
            <Label htmlFor="session-start">Frase de Reinício da Julia</Label>
            <div className="relative">
              <Input
                id="session-start"
                value={sessionStart}
                onChange={(e) => setSessionStart(e.target.value.slice(0, 100))}
                maxLength={100}
                placeholder="Ex: reiniciar"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {sessionStart.length}/100
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Frase que o cliente pode enviar para reiniciar o atendimento
            </p>
          </div>

          {/* Contract Signed */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="contract-signed">Mensagem de Contrato Assinado</Label>
              <span className="text-xs text-muted-foreground">
                {contractSigned.length}/1500
              </span>
            </div>
            <Textarea
              id="contract-signed"
              value={contractSigned}
              onChange={(e) => setContractSigned(e.target.value.slice(0, 1500))}
              maxLength={1500}
              placeholder="Ex: Acabei de receber o seu documento assinado ✅..."
              className="min-h-[200px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Mensagem enviada automaticamente quando um contrato é assinado
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateSettings.isPending}
          size="lg"
        >
          {updateSettings.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Settings className="mr-2 h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
