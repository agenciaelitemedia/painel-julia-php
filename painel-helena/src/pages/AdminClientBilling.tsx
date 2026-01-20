import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Loader2, DollarSign, FileText, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientData {
  id: string;
  name: string;
  email: string;
  cpf_cnpj?: string;
}

interface AsaasIntegration {
  id: string;
  asaas_customer_id?: string;
  is_active: boolean;
}

export default function AdminClientBilling() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientData | null>(null);
  const [integration, setIntegration] = useState<AsaasIntegration | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [creatingSubscription, setCreatingSubscription] = useState(false);

  const [invoiceForm, setInvoiceForm] = useState({
    value: "",
    due_date: "",
    billing_type: "BOLETO",
    description: "",
  });

  const [subscriptionForm, setSubscriptionForm] = useState({
    plan_name: "",
    value: "",
    cycle: "MONTHLY",
    billing_type: "BOLETO",
    description: "",
  });

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);

      // Buscar dados do cliente
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      // Buscar integração Asaas
      const { data: integrationData } = await supabase
        .from("client_asaas_integration")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();

      setIntegration(integrationData);

      // Buscar faturas
      const { data: invoicesData } = await supabase
        .from("asaas_invoices")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      setInvoices(invoicesData || []);

      // Buscar assinaturas
      const { data: subscriptionsData } = await supabase
        .from("asaas_subscriptions")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      setSubscriptions(subscriptionsData || []);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados do cliente");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsaasCustomer = async () => {
    if (!clientId || !client) return;

    try {
      setCreatingCustomer(true);

      // Chamar edge function para criar customer no Asaas usando config global
      const { data, error } = await supabase.functions.invoke('create-asaas-customer', {
        body: { clientId },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar customer no Asaas');
      }

      toast.success(`Cliente vinculado ao Asaas! Customer ID: ${data.customerId}`);
      loadClientData();
    } catch (error: any) {
      console.error("Erro ao criar integração:", error);
      toast.error(error.message || "Erro ao criar integração Asaas");
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!clientId) return;

    try {
      setCreatingInvoice(true);

      // Verificar se cliente tem integração Asaas
      if (!integration || !integration.asaas_customer_id) {
        toast.error("Cliente precisa estar vinculado ao Asaas primeiro");
        return;
      }

      // Verificar se cliente tem CPF/CNPJ válido
      if (!client?.cpf_cnpj || client.cpf_cnpj === '0000000000' || client.cpf_cnpj.replace(/\D/g, '').length < 11) {
        toast.error("Cliente precisa ter CPF ou CNPJ cadastrado. Configure na página de clientes primeiro.");
        return;
      }

      // Chamar edge function para criar fatura no Asaas
      const { data, error } = await supabase.functions.invoke('create-asaas-invoice', {
        body: {
          clientId,
          value: invoiceForm.value,
          dueDate: invoiceForm.due_date,
          billingType: invoiceForm.billing_type,
          description: invoiceForm.description,
        },
      });

      if (error) throw error;

      if (!data.success) {
        // Extrair mensagem de erro mais específica se disponível
        let errorMsg = data.error || 'Erro ao criar fatura no Asaas';
        if (data.details) {
          try {
            const details = JSON.parse(data.details);
            if (details.errors && details.errors[0]) {
              errorMsg = details.errors[0].description || errorMsg;
            }
          } catch (e) {
            // Se não conseguir parsear, usar mensagem padrão
          }
        }
        throw new Error(errorMsg);
      }

      toast.success("Fatura criada com sucesso no Asaas!");
      if (data.invoiceUrl) {
        toast.info("Link da fatura disponível na tabela");
      }
      
      setShowInvoiceDialog(false);
      setInvoiceForm({ value: "", due_date: "", billing_type: "BOLETO", description: "" });
      loadClientData();
    } catch (error: any) {
      console.error("Erro ao criar fatura:", error);
      toast.error(error.message || "Erro ao criar fatura");
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handleCreateSubscription = async () => {
    if (!clientId) return;

    try {
      setCreatingSubscription(true);

      // Verificar se cliente tem integração Asaas
      if (!integration || !integration.asaas_customer_id) {
        toast.error("Cliente precisa estar vinculado ao Asaas primeiro");
        return;
      }

      // Verificar se cliente tem CPF/CNPJ válido
      if (!client?.cpf_cnpj || client.cpf_cnpj === '0000000000' || client.cpf_cnpj.replace(/\D/g, '').length < 11) {
        toast.error("Cliente precisa ter CPF ou CNPJ cadastrado. Configure na página de clientes primeiro.");
        return;
      }

      // Chamar edge function para criar assinatura no Asaas
      const { data, error } = await supabase.functions.invoke('create-asaas-subscription', {
        body: {
          clientId,
          planName: subscriptionForm.plan_name,
          value: subscriptionForm.value,
          cycle: subscriptionForm.cycle,
          billingType: subscriptionForm.billing_type,
          description: subscriptionForm.description,
        },
      });

      if (error) throw error;

      if (!data.success) {
        // Extrair mensagem de erro mais específica se disponível
        let errorMsg = data.error || 'Erro ao criar assinatura no Asaas';
        if (data.details) {
          try {
            const details = JSON.parse(data.details);
            if (details.errors && details.errors[0]) {
              errorMsg = details.errors[0].description || errorMsg;
            }
          } catch (e) {
            // Se não conseguir parsear, usar mensagem padrão
          }
        }
        throw new Error(errorMsg);
      }

      toast.success("Assinatura criada com sucesso no Asaas!");
      setShowSubscriptionDialog(false);
      setSubscriptionForm({ plan_name: "", value: "", cycle: "MONTHLY", billing_type: "BOLETO", description: "" });
      loadClientData();
    } catch (error: any) {
      console.error("Erro ao criar assinatura:", error);
      toast.error(error.message || "Erro ao criar assinatura");
    } finally {
      setCreatingSubscription(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendente", variant: "outline" },
      received: { label: "Recebido", variant: "default" },
      overdue: { label: "Vencido", variant: "destructive" },
      confirmed: { label: "Confirmado", variant: "default" },
      active: { label: "Ativa", variant: "default" },
      canceled: { label: "Cancelada", variant: "secondary" },
    };
    const config = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto p-6">
        <p>Cliente não encontrado</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Faturamento - {client.name}</h1>
          <p className="text-muted-foreground">{client.email}</p>
        </div>
      </div>

      {/* Card de Status Integração Asaas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Integração Asaas
              </CardTitle>
              <CardDescription>
                Status da integração do cliente com o Asaas
              </CardDescription>
            </div>
            {!integration && (
              <Button onClick={handleCreateAsaasCustomer} disabled={creatingCustomer}>
                {creatingCustomer ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Vincular ao Asaas"
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        {integration ? (
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status da Integração:</span>
                <Badge variant={integration.is_active ? "default" : "secondary"}>
                  {integration.is_active ? "Ativa" : "Inativa"}
                </Badge>
              </div>
              {integration.asaas_customer_id ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Customer ID:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{integration.asaas_customer_id}</code>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                  <p className="text-sm text-amber-800">
                    <strong>Atenção:</strong> Cliente vinculado localmente, mas ainda não possui Customer ID no Asaas. 
                    Configure a API do Asaas em <strong>Config Asaas</strong> para criar automaticamente o customer.
                  </p>
                  <Button 
                    onClick={loadClientData} 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                  >
                    <Loader2 className="h-4 w-4 mr-2" />
                    Recarregar Status
                  </Button>
                </div>
              )}
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  💡 As configurações técnicas (API Token, Webhook, Templates) são gerenciadas na página <strong>Config Asaas</strong>
                </p>
              </div>
            </div>
          </CardContent>
        ) : (
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Este cliente ainda não está vinculado ao Asaas. Clique em "Vincular ao Asaas" para criar a integração.
            </p>
            <Button 
              onClick={loadClientData} 
              variant="outline" 
              size="sm"
              className="w-full"
            >
              <Loader2 className="h-4 w-4 mr-2" />
              Recarregar
            </Button>
          </CardContent>
        )}
      </Card>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">
            <FileText className="h-4 w-4 mr-2" />
            Faturas
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            <DollarSign className="h-4 w-4 mr-2" />
            Assinaturas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Faturas</CardTitle>
                  <CardDescription>Gerencie as faturas do cliente</CardDescription>
                </div>
                <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Fatura
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Fatura</DialogTitle>
                      <DialogDescription>Crie uma nova fatura para o cliente</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Valor (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={invoiceForm.value}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, value: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Data de Vencimento</Label>
                        <Input
                          type="date"
                          value={invoiceForm.due_date}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Forma de Pagamento</Label>
                        <Select
                          value={invoiceForm.billing_type}
                          onValueChange={(value) => setInvoiceForm({ ...invoiceForm, billing_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BOLETO">Boleto</SelectItem>
                            <SelectItem value="PIX">PIX</SelectItem>
                            <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                          value={invoiceForm.description}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                          placeholder="Descrição da fatura..."
                        />
                      </div>
                      <Button onClick={handleCreateInvoice} className="w-full" disabled={creatingInvoice}>
                        {creatingInvoice ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Criando no Asaas...
                          </>
                        ) : (
                          "Criar Fatura"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Link/Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Nenhuma fatura encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(Number(invoice.value))}
                          </TableCell>
                          <TableCell>{format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{invoice.billing_type}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell>
                            {invoice.invoice_url ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(invoice.invoice_url, '_blank')}
                              >
                                <LinkIcon className="h-4 w-4 mr-1" />
                                Acessar Fatura
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sem link</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Assinaturas</CardTitle>
                  <CardDescription>Gerencie as assinaturas recorrentes do cliente</CardDescription>
                </div>
                <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Assinatura
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Assinatura</DialogTitle>
                      <DialogDescription>Crie uma nova assinatura recorrente para o cliente</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome do Plano</Label>
                        <Input
                          value={subscriptionForm.plan_name}
                          onChange={(e) => setSubscriptionForm({ ...subscriptionForm, plan_name: e.target.value })}
                          placeholder="Ex: Plano Premium"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Valor (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={subscriptionForm.value}
                          onChange={(e) => setSubscriptionForm({ ...subscriptionForm, value: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ciclo de Cobrança</Label>
                        <Select
                          value={subscriptionForm.cycle}
                          onValueChange={(value) => setSubscriptionForm({ ...subscriptionForm, cycle: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MONTHLY">Mensal</SelectItem>
                            <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                            <SelectItem value="SEMIANNUALLY">Semestral</SelectItem>
                            <SelectItem value="YEARLY">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Forma de Pagamento</Label>
                        <Select
                          value={subscriptionForm.billing_type}
                          onValueChange={(value) => setSubscriptionForm({ ...subscriptionForm, billing_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BOLETO">Boleto</SelectItem>
                            <SelectItem value="PIX">PIX</SelectItem>
                            <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                          value={subscriptionForm.description}
                          onChange={(e) => setSubscriptionForm({ ...subscriptionForm, description: e.target.value })}
                          placeholder="Descrição da assinatura..."
                        />
                      </div>
                      <Button onClick={handleCreateSubscription} className="w-full" disabled={creatingSubscription}>
                        {creatingSubscription ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Criando no Asaas...
                          </>
                        ) : (
                          "Criar Assinatura"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plano</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Ciclo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Nenhuma assinatura encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      subscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.plan_name}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(Number(sub.value))}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{sub.cycle}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{sub.billing_type}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
