import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, CheckCircle, Clock, AlertCircle, CreditCard, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function ClientBilling() {
  const { toast } = useToast();
  const [copiedPix, setCopiedPix] = useState<string | null>(null);

  // Buscar cliente atual
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      const { data: userData } = await supabase
        .from("users")
        .select("client_id")
        .eq("id", user.id)
        .single();
      
      return userData;
    },
  });

  // Buscar faturas do cliente
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["client-invoices", currentUser?.client_id],
    queryFn: async () => {
      if (!currentUser?.client_id) return [];
      
      const { data, error } = await supabase
        .from("asaas_invoices")
        .select("*")
        .eq("client_id", currentUser.client_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser?.client_id,
  });

  // Buscar assinaturas do cliente
  const { data: subscriptions = [] } = useQuery({
    queryKey: ["client-subscriptions", currentUser?.client_id],
    queryFn: async () => {
      if (!currentUser?.client_id) return [];
      
      const { data, error } = await supabase
        .from("asaas_subscriptions")
        .select("*")
        .eq("client_id", currentUser.client_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser?.client_id,
  });

  const handleCopyPix = (pixCode: string, invoiceId: string) => {
    navigator.clipboard.writeText(pixCode);
    setCopiedPix(invoiceId);
    setTimeout(() => setCopiedPix(null), 2000);
    toast({
      title: "Código PIX copiado!",
      description: "Cole no seu app de pagamento para efetuar o pagamento.",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      pending: { variant: "outline", icon: Clock },
      confirmed: { variant: "default", icon: CheckCircle },
      received: { variant: "default", icon: CheckCircle },
      overdue: { variant: "destructive", icon: AlertCircle },
      cancelled: { variant: "secondary", icon: AlertCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    const labels: Record<string, string> = {
      pending: "Pendente",
      confirmed: "Confirmado",
      received: "Pago",
      overdue: "Vencido",
      cancelled: "Cancelado",
    };

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {labels[status] || status}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", { timeZone: 'America/Sao_Paulo' });
  };

  const openInvoice = (url: string) => {
    window.open(url, "_blank");
  };

  const pendingInvoices = invoices.filter(inv => inv.status === "pending" || inv.status === "overdue");
  const paidInvoices = invoices.filter(inv => inv.status === "received" || inv.status === "confirmed");

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground">Gerencie suas faturas e assinaturas</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Faturas em Aberto ({pendingInvoices.length})
          </TabsTrigger>
          <TabsTrigger value="paid" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Histórico ({paidInvoices.length})
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Assinaturas ({subscriptions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingInvoices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Você não possui faturas pendentes</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Faturas Pendentes</CardTitle>
                <CardDescription>
                  Faturas que aguardam pagamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Fatura</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.description}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(Number(invoice.value))}</TableCell>
                        <TableCell>{formatDate(invoice.due_date)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {invoice.billing_type === "BOLETO" && invoice.invoice_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openInvoice(invoice.invoice_url!)}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Ver Boleto
                              </Button>
                            )}
                            {invoice.billing_type === "PIX" && invoice.pix_code && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyPix(invoice.pix_code!, invoice.id)}
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                {copiedPix === invoice.id ? "Copiado!" : "Copiar PIX"}
                              </Button>
                            )}
                            {invoice.invoice_url && invoice.billing_type !== "BOLETO" && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => openInvoice(invoice.invoice_url!)}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Acessar Fatura
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          {paidInvoices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum pagamento realizado ainda</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Pagamentos</CardTitle>
                <CardDescription>
                  Faturas já pagas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Fatura</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data Pagamento</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.description}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(Number(invoice.value))}</TableCell>
                        <TableCell>{invoice.payment_date ? formatDate(invoice.payment_date) : "-"}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          {subscriptions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Você não possui assinaturas ativas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {subscriptions.map((sub) => (
                <Card key={sub.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{sub.plan_name}</CardTitle>
                        <CardDescription>{sub.description}</CardDescription>
                      </div>
                      {getStatusBadge(sub.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Valor</p>
                        <p className="font-bold">{formatCurrency(Number(sub.value))}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ciclo</p>
                        <p className="font-medium">{sub.cycle}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                        <p className="font-medium">{sub.billing_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Próximo Vencimento</p>
                        <p className="font-medium">{sub.next_due_date ? formatDate(sub.next_due_date) : "-"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
