import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Check, Send } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function WebhookConfig() {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  
  const webhookUrl = "https://qoifgfawfkdukjakhssv.supabase.co/functions/v1/whatsapp-webhook";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast.success("URL copiada!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar URL");
    }
  };

  const testWhatsAppWebhook = async () => {
    setTesting(true);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'messages.upsert',
          messages: [{
            key: { remoteJid: '5511999999999@s.whatsapp.net', id: 'TEST123', fromMe: false },
            message: { conversation: 'Teste de webhook' },
            messageTimestamp: Date.now() / 1000,
            pushName: 'Teste'
          }]
        })
      });
      
      if (response.ok) {
        toast.success("Webhook está funcionando! Verifique o Chat.");
      } else {
        const error = await response.text();
        toast.error(`Erro no webhook: ${error}`);
      }
    } catch (error) {
      toast.error("Erro ao testar webhook: " + String(error));
    } finally {
      setTesting(false);
    }
  };

  const testWebhookIntegration = async () => {
    setTestingWebhook(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-rabbitmq', {
        method: 'POST'
      });

      if (error) throw error;

      if (data.success) {
        toast.success("✅ Mensagem enviada para o webhook!", {
          description: `URL oculta por segurança`
        });
      } else {
        toast.error("❌ Erro ao enviar para webhook", {
          description: data.error
        });
      }
    } catch (error) {
      toast.error("❌ Erro ao testar webhook: " + String(error));
    } finally {
      setTestingWebhook(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuração de Webhook</h1>
        <p className="text-muted-foreground">
          Configure o webhook na API uazap para receber mensagens automaticamente
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>URL do Webhook</CardTitle>
          <CardDescription>
            Use esta URL nas configurações da sua instância uazap
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">URL do Webhook</Label>
            <div className="flex gap-2">
              <Input
                id="webhook-url"
                value={webhookUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={testWhatsAppWebhook} disabled={testing} variant="outline">
              {testing ? "Testando..." : "Testar Webhook"}
            </Button>
          </div>

          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="font-semibold">✅ Checklist de Configuração na uazap:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Copie a URL do webhook acima</li>
              <li>Acesse: <code className="bg-background px-1 py-0.5 rounded">https://atende-julia.uazapi.com</code></li>
              <li>Vá em <strong>Configurações → Webhooks</strong></li>
              <li>Cole a URL no campo <strong>Webhook URL</strong></li>
              <li><strong className="text-primary">CRÍTICO:</strong> Marque os eventos:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li><code>messages.upsert</code> (novas mensagens)</li>
                  <li><code>messages.update</code> (status de mensagens)</li>
                </ul>
              </li>
              <li><strong className="text-primary">Salve</strong> as configurações</li>
              <li><strong className="text-primary">Ative/Habilite</strong> o webhook (verifique se há um toggle/switch)</li>
            </ol>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg space-y-2">
            <h4 className="font-semibold text-amber-900 dark:text-amber-100">🔗 Testar Integração Webhook</h4>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Clique no botão abaixo para enviar uma mensagem de teste para o webhook e verificar se a conexão está funcionando.
            </p>
            <Button 
              onClick={testWebhookIntegration} 
              disabled={testingWebhook}
              className="w-full"
            >
              <Send className="mr-2 h-4 w-4" />
              {testingWebhook ? "Enviando..." : "Enviar Teste para Webhook"}
            </Button>
          </div>

          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm">
              <strong>📝 Nota:</strong> Após configurar o webhook, todas as mensagens recebidas no WhatsApp 
              aparecerão automaticamente no sistema de atendimento. As mensagens enviadas pelo sistema 
              também serão sincronizadas.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Testando o Webhook</CardTitle>
          <CardDescription>
            Verifique se o webhook está funcionando corretamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Após configurar o webhook, envie uma mensagem de teste para o seu número do WhatsApp. 
              A mensagem deve aparecer automaticamente na tela de Chat em alguns segundos.
            </p>
          </div>

          <div className="flex gap-2">
            <Button asChild>
              <a href="/chat">Ir para o Chat</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
