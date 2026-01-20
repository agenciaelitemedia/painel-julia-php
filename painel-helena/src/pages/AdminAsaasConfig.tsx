import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, TestTube, Copy, Check } from "lucide-react";
import { useAsaasConfig } from "@/hooks/useAsaasConfig";
import { useNotificationInstances } from "@/hooks/useNotificationInstances";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminAsaasConfig() {
  const { toast } = useToast();
  const { config, loading, saveConfig, testConnection } = useAsaasConfig();
  const { instances } = useNotificationInstances();
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    api_token: "",
    wallet_id: "",
    environment: "sandbox",
    whatsapp_notifications_enabled: false,
    whatsapp_instance_id: "",
    split_config: { default_percentage: 0 },
    notification_templates: {
      invoice_created: "Olá {nome}! Nova fatura gerada no valor de R$ {valor}, vencimento em {data_vencimento}. {link_pagamento}",
      payment_received: "Pagamento confirmado! Obrigado pelo pagamento da fatura {numero_fatura} no valor de R$ {valor}.",
      payment_overdue: "Olá {nome}, sua fatura {numero_fatura} no valor de R$ {valor} está vencida desde {data_vencimento}. Por favor, regularize sua situação.",
      subscription_created: "Sua assinatura {plano} foi ativada com sucesso! Próxima cobrança em {proxima_data}.",
      subscription_expiring: "Sua assinatura {plano} vence em {dias} dias. Mantenha seus pagamentos em dia."
    }
  });

  // Atualizar formData quando config carregar
  useEffect(() => {
    if (config) {
      setFormData({
        api_token: config.api_token || "",
        wallet_id: config.wallet_id || "",
        environment: config.environment || "sandbox",
        whatsapp_notifications_enabled: config.whatsapp_notifications_enabled || false,
        whatsapp_instance_id: config.whatsapp_instance_id || "",
        split_config: config.split_config || { default_percentage: 0 },
        notification_templates: config.notification_templates || {
          invoice_created: "Olá {nome}! Nova fatura gerada no valor de R$ {valor}, vencimento em {data_vencimento}. {link_pagamento}",
          payment_received: "Pagamento confirmado! Obrigado pelo pagamento da fatura {numero_fatura} no valor de R$ {valor}.",
          payment_overdue: "Olá {nome}, sua fatura {numero_fatura} no valor de R$ {valor} está vencida desde {data_vencimento}. Por favor, regularize sua situação.",
          subscription_created: "Sua assinatura {plano} foi ativada com sucesso! Próxima cobrança em {proxima_data}.",
          subscription_expiring: "Sua assinatura {plano} vence em {dias} dias. Mantenha seus pagamentos em dia."
        }
      });
    }
  }, [config]);

  const connectedInstances = instances.filter(i => i.status === 'connected');
  
  const webhookUrl = `https://qoifgfawfkdukjakhssv.supabase.co/functions/v1/asaas-webhook`;

  const handleSave = async () => {
    try {
      await saveConfig(formData);
      toast({
        title: "Configuração salva",
        description: "As configurações do Asaas foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await testConnection(formData.api_token, formData.environment);
      if (result.success) {
        toast({
          title: "Conexão bem-sucedida",
          description: "O token da API está válido e funcionando.",
        });
      } else {
        toast({
          title: "Erro na conexão",
          description: result.error || "Não foi possível conectar ao Asaas.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao testar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast({
      title: "URL copiada",
      description: "A URL do webhook foi copiada para a área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuração Asaas</h1>
        <p className="text-muted-foreground mt-2">
          Configure a integração com o sistema de pagamentos Asaas
        </p>
      </div>

      <Tabs defaultValue="credentials" className="space-y-6">
        <TabsList>
          <TabsTrigger value="credentials">Credenciais</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Credenciais da API</CardTitle>
              <CardDescription>
                Configure as credenciais de acesso ao Asaas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="environment">Ambiente</Label>
                <Select
                  value={formData.environment}
                  onValueChange={(value) => setFormData({ ...formData, environment: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox (Teste)</SelectItem>
                    <SelectItem value="production">Produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_token">Token da API</Label>
                <Input
                  id="api_token"
                  type="password"
                  placeholder="seu_token_api_asaas"
                  value={formData.api_token}
                  onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wallet_id">Wallet ID (Opcional)</Label>
                <Input
                  id="wallet_id"
                  placeholder="ID da carteira para split"
                  value={formData.wallet_id}
                  onChange={(e) => setFormData({ ...formData, wallet_id: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="split_percentage">Porcentagem de Split Padrão (%)</Label>
                <Input
                  id="split_percentage"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={formData.split_config?.default_percentage || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    split_config: { default_percentage: parseFloat(e.target.value) || 0 }
                  })}
                />
              </div>

              <Button onClick={handleTest} disabled={testing || !formData.api_token}>
                {testing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="mr-2 h-4 w-4" />
                )}
                Testar Conexão
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Webhook URL</CardTitle>
              <CardDescription>
                Configure esta URL no painel do Asaas para receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={webhookUrl} readOnly />
                <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notificações WhatsApp</CardTitle>
              <CardDescription>
                Configure o envio automático de notificações via WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="whatsapp_enabled">Habilitar notificações WhatsApp</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar notificações automáticas sobre faturas e pagamentos
                  </p>
                </div>
                <Switch
                  id="whatsapp_enabled"
                  checked={formData.whatsapp_notifications_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, whatsapp_notifications_enabled: checked })
                  }
                />
              </div>

              {formData.whatsapp_notifications_enabled && (
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_instance">Instância WhatsApp</Label>
                  <Select
                    value={formData.whatsapp_instance_id}
                    onValueChange={(value) => setFormData({ ...formData, whatsapp_instance_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma instância" />
                    </SelectTrigger>
                    <SelectContent>
                      {connectedInstances.map((instance) => (
                        <SelectItem key={instance.id} value={instance.id}>
                          {instance.instance_name} - {instance.phone_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {connectedInstances.length === 0 && (
                    <p className="text-sm text-amber-600">
                      Nenhuma instância WhatsApp conectada. Configure uma instância primeiro.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Mensagens</CardTitle>
              <CardDescription>
                Personalize as mensagens enviadas aos clientes. Use variáveis como {"{nome}"}, {"{valor}"}, {"{data_vencimento}"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invoice_created">Fatura Criada</Label>
                <Textarea
                  id="invoice_created"
                  rows={3}
                  value={formData.notification_templates?.invoice_created || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    notification_templates: {
                      ...formData.notification_templates,
                      invoice_created: e.target.value
                    }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_received">Pagamento Recebido</Label>
                <Textarea
                  id="payment_received"
                  rows={3}
                  value={formData.notification_templates?.payment_received || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    notification_templates: {
                      ...formData.notification_templates,
                      payment_received: e.target.value
                    }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_overdue">Pagamento Vencido</Label>
                <Textarea
                  id="payment_overdue"
                  rows={3}
                  value={formData.notification_templates?.payment_overdue || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    notification_templates: {
                      ...formData.notification_templates,
                      payment_overdue: e.target.value
                    }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscription_created">Assinatura Criada</Label>
                <Textarea
                  id="subscription_created"
                  rows={3}
                  value={formData.notification_templates?.subscription_created || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    notification_templates: {
                      ...formData.notification_templates,
                      subscription_created: e.target.value
                    }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscription_expiring">Assinatura Expirando</Label>
                <Textarea
                  id="subscription_expiring"
                  rows={3}
                  value={formData.notification_templates?.subscription_expiring || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    notification_templates: {
                      ...formData.notification_templates,
                      subscription_expiring: e.target.value
                    }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} size="lg">
          <Save className="mr-2 h-4 w-4" />
          Salvar Configuração
        </Button>
      </div>
    </div>
  );
}
