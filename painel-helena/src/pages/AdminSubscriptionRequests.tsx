import { useState } from "react";
import { useAdminSubscriptionRequests } from "@/hooks/useAdminSubscriptionRequests";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle, Clock, Search, Phone, Mail, CreditCard, Calendar, Send, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminSubscriptionRequests() {
  const { requests, loading, filter, setFilter, approveRequest, rejectRequest, fetchRequests } = useAdminSubscriptionRequests();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | "delete" | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getStatusBadge = (status: string, paymentStatus?: string) => {
    const statusMap = {
      pending: { 
        label: "Aguardando Verificação", 
        variant: "outline" as const, 
        icon: Clock,
        description: "Pedido criado, aguardando verificação do código"
      },
      verified: { 
        label: "Aguardando Pagamento", 
        variant: "secondary" as const, 
        icon: Clock,
        description: "Código verificado, aguardando confirmação de pagamento"
      },
      approved: { 
        label: "Conta Ativa", 
        variant: "default" as const, 
        icon: CheckCircle,
        description: "Pagamento confirmado e conta criada"
      },
      payment_confirmed: { 
        label: "Pagamento Confirmado", 
        variant: "default" as const, 
        icon: CheckCircle,
        description: "Pagamento confirmado, processando criação da conta"
      },
      completed: { 
        label: "Conta Ativa", 
        variant: "default" as const, 
        icon: CheckCircle,
        description: "Pagamento confirmado e conta criada"
      },
      rejected: { 
        label: "Rejeitado", 
        variant: "destructive" as const, 
        icon: XCircle,
        description: "Pedido rejeitado"
      },
    } as const;
    const config = (statusMap as any)[status] || statusMap.pending;
    const Icon = config.icon;
    return (
      <div className="flex flex-col gap-1">
        <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </div>
    );
  };

  const filteredRequests = requests.filter((req) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      req.full_name.toLowerCase().includes(search) ||
      req.email.toLowerCase().includes(search) ||
      req.whatsapp_phone.includes(search) ||
      req.cpf_cnpj.includes(search)
    );
  });

  const handleApprove = async () => {
    if (!selectedRequest) return;
    const success = await approveRequest(selectedRequest);
    if (success) {
      setSelectedRequest(null);
      setActionType(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) return;
    const success = await rejectRequest(selectedRequest, rejectionReason);
    if (success) {
      setSelectedRequest(null);
      setActionType(null);
      setRejectionReason("");
    }
  };

  const sendInvoiceWhatsApp = async (requestId: string) => {
    setSendingInvoice(requestId);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-invoice-notification', {
        body: { requestId },
      });

      if (error) {
        console.error('Erro:', error);
        toast.error('Erro ao enviar fatura via WhatsApp');
        return;
      }

      if (data?.success) {
        toast.success('Fatura enviada via WhatsApp com sucesso!');
      } else {
        toast.error(data?.error || 'Erro ao enviar fatura');
      }
    } catch (err) {
      console.error('Erro:', err);
      toast.error('Erro ao processar envio');
    } finally {
      setSendingInvoice(null);
    }
  };

  const reprocessPayment = async (requestId: string, asaasPaymentId?: string | null) => {
    if (!asaasPaymentId) {
      toast.error('Sem payment_id do Asaas neste pedido');
      return;
    }
    setReprocessingId(requestId);
    try {
      const { data, error } = await supabase.functions.invoke('reprocess-asaas-payment', {
        body: { payment_id: asaasPaymentId },
      });
      if (error) {
        console.error('Erro reprocessando:', error);
        toast.error('Erro ao reprocessar pagamento');
        return;
      }
      if (data?.success) {
        toast.success('Pagamento reprocessado com sucesso');
      } else {
        toast.error(data?.error || 'Falha ao reprocessar pagamento');
      }
    } catch (err) {
      console.error('Erro:', err);
      toast.error('Erro ao reprocessar');
    } finally {
      setReprocessingId(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedRequest) return;
    setDeletingId(selectedRequest);
    try {
      const { error } = await supabase
        .from('subscription_requests')
        .delete()
        .eq('id', selectedRequest);
      
      if (error) {
        console.error('Erro ao deletar:', error);
        toast.error('Erro ao deletar pedido');
        return;
      }
      
      toast.success('Pedido deletado com sucesso');
      
      // Recarregar a lista
      await fetchRequests();
      
      setSelectedRequest(null);
      setActionType(null);
    } catch (err) {
      console.error('Erro:', err);
      toast.error('Erro ao deletar pedido');
    } finally {
      setDeletingId(null);
    }
  };
  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Pedidos de Assinatura</h1>
        <p className="text-muted-foreground">
          Gerencie os pedidos de novos clientes
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, telefone ou CPF/CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="verified">Verificados</TabsTrigger>
          <TabsTrigger value="approved">Aprovados</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Pedidos</CardTitle>
              <CardDescription>
                {filteredRequests.length} pedido(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Verificação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.full_name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {request.cpf_cnpj}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {request.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {request.whatsapp_phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.subscription_plans?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            R$ {request.subscription_plans?.price.toFixed(2)}/{request.subscription_plans?.billing_cycle}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(request.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.is_verified ? (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3 w-3" />
                            Verificado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <Clock className="h-3 w-3" />
                            Aguardando
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {request.status === 'verified' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  setSelectedRequest(request.id);
                                  setActionType("approve");
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedRequest(request.id);
                                  setActionType("reject");
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rejeitar
                              </Button>
                            </>
                          )}
                          
                          {request.status !== 'rejected' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => sendInvoiceWhatsApp(request.id)}
                                disabled={sendingInvoice === request.id}
                              >
                                {sendingInvoice === request.id ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4 mr-1" />
                                )}
                                Enviar Fatura
                              </Button>
                              {request.asaas_payment_id && request.status !== 'approved' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => reprocessPayment(request.id, request.asaas_payment_id)}
                                  disabled={reprocessingId === request.id}
                                >
                                  {reprocessingId === request.id ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <RotateCcw className="h-4 w-4 mr-1" />
                                  )}
                                  Reprocessar Pagamento
                                </Button>
                              )}
                            </>
                          )}

                          {request.status === 'approved' && (
                            <Badge variant="default">Conta criada</Badge>
                          )}

                          {request.status === 'rejected' && request.rejection_reason && (
                            <div className="text-sm text-muted-foreground max-w-xs truncate" title={request.rejection_reason}>
                              {request.rejection_reason}
                            </div>
                          )}

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedRequest(request.id);
                              setActionType("delete");
                            }}
                            disabled={deletingId === request.id}
                          >
                            {deletingId === request.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-1" />
                            )}
                            Deletar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum pedido encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Aprovação */}
      <AlertDialog open={actionType === "approve"} onOpenChange={() => { setActionType(null); setSelectedRequest(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja aprovar este pedido? Uma nova conta será criada e o cliente receberá suas credenciais de acesso via WhatsApp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              Aprovar e Criar Conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Rejeição */}
      <AlertDialog open={actionType === "reject"} onOpenChange={() => { setActionType(null); setSelectedRequest(null); setRejectionReason(""); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo da rejeição. O cliente será notificado via WhatsApp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Motivo da rejeição..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Rejeitar Pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Deleção */}
      <AlertDialog open={actionType === "delete"} onOpenChange={() => { setActionType(null); setSelectedRequest(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este pedido? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar Pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
