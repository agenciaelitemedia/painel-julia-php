import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, Plus, QrCode, Trash2, RefreshCw, Download, Bell, Star } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWhatsAppInstances } from "@/hooks/useWhatsAppInstances";
import { useClientData } from "@/hooks/useClientData";
import { useAuth } from "@/hooks/useAuth";
import { useSystemNotificationConfig } from "@/hooks/useSystemNotificationConfig";
import { uazapApi } from "@/lib/api/uazap";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Connections = () => {
  const { 
    instances, 
    loading, 
    createInstance, 
    deleteInstance, 
    getQRCode, 
    updateProfileInfo, 
    refreshInstances,
    getInstancesForImport,
    importContacts 
  } = useWhatsAppInstances();
  const { clientData } = useClientData();
  const { profile } = useAuth();
  const { 
    setDefaultInstance, 
    toggleNotificationInstance 
  } = useSystemNotificationConfig();
  const [showNewConnection, setShowNewConnection] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [receiveGroupMessages, setReceiveGroupMessages] = useState(true);
  const [showQRCode, setShowQRCode] = useState(false);
  const [currentQRCode, setCurrentQRCode] = useState("");
  const [currentInstanceId, setCurrentInstanceId] = useState("");
  const [currentInstanceToken, setCurrentInstanceToken] = useState("");
  const [qrCodeTimer, setQrCodeTimer] = useState(30);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [instanceToDelete, setInstanceToDelete] = useState<{ id: string; token: string; name: string } | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showImportConfirmDialog, setShowImportConfirmDialog] = useState(false);
  const [currentInstanceForImport, setCurrentInstanceForImport] = useState<string>('');
  const [availableInstances, setAvailableInstances] = useState<any[]>([]);
  const [selectedSourceInstance, setSelectedSourceInstance] = useState<string>('');
  const [contactCounts, setContactCounts] = useState<Record<string, number>>({});

  const isAdmin = profile?.role === 'admin';
  const canAddConnection = clientData 
    ? instances.length < clientData.max_connections 
    : false;

  // Carregar contagem de contatos para cada instância
  useEffect(() => {
    const loadContactCounts = async () => {
      const counts: Record<string, number> = {};
      
      for (const instance of instances) {
        const { count } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('instance_id', instance.id);
        
        counts[instance.id] = count || 0;
      }
      
      setContactCounts(counts);
    };

    if (instances.length > 0) {
      loadContactCounts();
    }
  }, [instances]);

  // QR Code timer and renewal logic
  useEffect(() => {
    if (!showQRCode || !currentInstanceId || !currentInstanceToken) return;

    // Countdown timer
    const timerInterval = setInterval(() => {
      setQrCodeTimer((prev) => {
        if (prev <= 1) {
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    // Renew QR code every 30 seconds
    const renewInterval = setInterval(async () => {
      const qrCode = await getQRCode(currentInstanceId, currentInstanceToken);
      if (qrCode) {
        setCurrentQRCode(qrCode);
        setQrCodeTimer(30);
      }
    }, 30000);

    // Check connection status every 3 seconds
    const statusInterval = setInterval(async () => {
      try {
        const response = await uazapApi.getInstanceStatus(currentInstanceToken);
        
        const instanceStatus = response.data?.instance?.status;
        const isConnected = instanceStatus === 'connected';
        
        console.log('Checking connection status:', { instanceStatus, isConnected });
        
        if (isConnected) {
          console.log('WhatsApp connected! Closing QR dialog and updating profile...');
          
          clearInterval(timerInterval);
          clearInterval(renewInterval);
          clearInterval(statusInterval);
          
          setShowQRCode(false);
          setQrCodeTimer(30);
          
          await updateProfileInfo(currentInstanceId, currentInstanceToken);
          
          toast.success("WhatsApp conectado com sucesso!");
        }
      } catch (error) {
        console.log('Still checking connection...');
      }
    }, 3000);

    return () => {
      clearInterval(timerInterval);
      clearInterval(renewInterval);
      clearInterval(statusInterval);
    };
  }, [showQRCode, currentInstanceId, currentInstanceToken]);

  const handleCreateConnection = async () => {
    if (!newInstanceName.trim()) {
      toast.error("Nome da conexão é obrigatório");
      return;
    }

    const instance = await createInstance(newInstanceName, receiveGroupMessages);

    if (instance) {
      setNewInstanceName("");
      setReceiveGroupMessages(true);
      setShowNewConnection(false);
    }
  };

  const handleDeleteConnection = (instanceId: string, instanceToken: string, instanceName: string) => {
    setInstanceToDelete({ id: instanceId, token: instanceToken, name: instanceName });
    setShowDeleteDialog(true);
  };

  const confirmDeleteConnection = async () => {
    if (instanceToDelete) {
      await deleteInstance(instanceToDelete.id, instanceToDelete.token);
      setShowDeleteDialog(false);
      setInstanceToDelete(null);
    }
  };

  const handleOpenImportDialog = async (instanceId: string) => {
    setCurrentInstanceForImport(instanceId);
    const instances = await getInstancesForImport(instanceId);
    
    // Buscar contagem de contatos para cada instância
    const instancesWithCounts = await Promise.all(
      instances.map(async (inst) => {
        const { count } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('instance_id', inst.id);
        
        return { ...inst, contactCount: count || 0 };
      })
    );
    
    setAvailableInstances(instancesWithCounts);
    setShowImportDialog(true);
  };

  const handleConfirmImport = async () => {
    if (!selectedSourceInstance || !currentInstanceForImport) return;
    
    // Fechar diálogo de seleção e abrir diálogo de confirmação
    setShowImportDialog(false);
    setShowImportConfirmDialog(true);
  };

  const executeImport = async () => {
    if (!selectedSourceInstance || !currentInstanceForImport) return;

    const success = await importContacts(selectedSourceInstance, currentInstanceForImport);

    if (success) {
      setShowImportConfirmDialog(false);
      setSelectedSourceInstance('');
      setCurrentInstanceForImport('');
    }
  };

  const handleShowQRCode = async (instanceId: string, instanceToken: string) => {
    try {
      const statusResponse = await uazapApi.getInstanceStatus(instanceToken);
      const currentStatus = statusResponse.data?.instance?.status;
      
      if (currentStatus === 'connecting' || currentStatus === 'connected') {
        toast.info("Desconectando instância atual...");
        await uazapApi.logoutInstance(instanceToken);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      toast.info("Preparando nova conexão...");
      await supabase
        .from('whatsapp_instances')
        .update({ 
          status: 'disconnected',
          phone_number: null,
          profile_name: null,
          profile_picture_url: null,
          qr_code: null
        })
        .eq('id', instanceId);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const qrCode = await getQRCode(instanceId, instanceToken);
      if (qrCode) {
        setCurrentQRCode(qrCode);
        setCurrentInstanceId(instanceId);
        setCurrentInstanceToken(instanceToken);
        setQrCodeTimer(30);
        setShowQRCode(true);
      }
    } catch (error) {
      console.error('Error showing QR code:', error);
      toast.error("Erro ao gerar QR Code");
    }
  };

  const handleDisconnect = async (instanceId: string, instanceToken: string) => {
    try {
      await uazapApi.logoutInstance(instanceToken);
      
      await supabase
        .from('whatsapp_instances')
        .update({ 
          status: 'disconnected',
          phone_number: null,
          profile_name: null,
          profile_picture_url: null,
          qr_code: null
        })
        .eq('id', instanceId);
      
      await refreshInstances();
      
      toast.success("WhatsApp desconectado com sucesso");
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error("Erro ao desconectar WhatsApp");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Carregando conexões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conexões WhatsApp</h1>
          <p className="text-muted-foreground">
            {instances.length} de {clientData?.max_connections || 0} conexões ativas
          </p>
        </div>
        <Button
          onClick={() => setShowNewConnection(true)}
          disabled={!canAddConnection}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Conexão
        </Button>
      </div>

      {!canAddConnection && instances.length >= (clientData?.max_connections || 0) && (
        <Alert>
          <AlertDescription>
            Você atingiu o limite de {clientData?.max_connections} conexões. 
            Entre em contato para aumentar seu limite.
          </AlertDescription>
        </Alert>
      )}

      {showNewConnection && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Nova Conexão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instanceName">Nome da Conexão</Label>
              <Input
                id="instanceName"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                placeholder="Ex: WhatsApp Principal"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="receiveGroups"
                checked={receiveGroupMessages}
                onChange={(e) => setReceiveGroupMessages(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="receiveGroups" className="text-sm font-medium cursor-pointer">
                Receber mensagens de grupos
              </Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateConnection}>Criar Conexão</Button>
              <Button variant="outline" onClick={() => {
                setShowNewConnection(false);
                setNewInstanceName('');
              }}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instances.map((instance) => (
          <Card key={instance.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={instance.profile_picture_url || undefined} />
                    <AvatarFallback>
                      <Smartphone className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{instance.instance_name}</CardTitle>
                      {(instance as any).is_default_notification && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="default" className="gap-1">
                                <Star className="h-3 w-3" />
                                Padrão
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Conexão padrão para notificações</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {(instance as any).is_notifications && !(instance as any).is_default_notification && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="secondary" className="gap-1">
                                <Bell className="h-3 w-3" />
                                Notificação
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Habilitada para notificações do sistema</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    {instance.phone_number && (
                      <p className="text-sm text-muted-foreground">
                        {instance.phone_number}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={instance.status === 'connected' ? 'default' : 'secondary'}>
                    {instance.status === 'connected' ? 'Conectado' : 'Desconectado'}
                  </Badge>
                </div>
                
                {instance.profile_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Nome do WhatsApp:</span>
                    <span className="text-sm font-medium">{instance.profile_name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Contatos:</span>
                  <Badge variant="outline">
                    {contactCounts[instance.id] || 0}
                  </Badge>
                </div>
              </div>

              {isAdmin && (
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
                  <p className="text-xs font-medium text-muted-foreground">Gerenciar Notificações (Admin)</p>
                  <div className="flex gap-2">
                    {!(instance as any).is_notifications ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleNotificationInstance.mutate({ instanceId: instance.id, enable: true })}
                        className="gap-2 flex-1"
                      >
                        <Bell className="h-4 w-4" />
                        Habilitar Notificações
                      </Button>
                    ) : (
                      <>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if ((instance as any).is_default_notification) {
                                    toast.error('Defina outra conexão como padrão primeiro');
                                    return;
                                  }
                                  toggleNotificationInstance.mutate({ instanceId: instance.id, enable: false });
                                }}
                                disabled={(instance as any).is_default_notification}
                                className="gap-2 flex-1"
                              >
                                <Bell className="h-4 w-4" />
                                Desabilitar
                              </Button>
                            </TooltipTrigger>
                            {(instance as any).is_default_notification && (
                              <TooltipContent>
                                <p>Defina outra conexão como padrão primeiro</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                        {!(instance as any).is_default_notification && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => setDefaultInstance.mutate(instance.id)}
                            className="gap-2 flex-1"
                          >
                            <Star className="h-4 w-4" />
                            Tornar Padrão
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4 justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenImportDialog(instance.id)}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Importar
                </Button>
                {instance.status === 'connected' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDisconnect(instance.id, instance.api_token)}
                    className="gap-2"
                  >
                    <Smartphone className="h-4 w-4" />
                    Desconectar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShowQRCode(instance.id, instance.api_token)}
                    className="gap-2"
                  >
                    <QrCode className="h-4 w-4" />
                    Gerar QR Code
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteConnection(instance.id, instance.api_token, instance.instance_name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {instances.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma conexão encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Crie sua primeira conexão WhatsApp para começar
            </p>
            <Button onClick={() => setShowNewConnection(true)} disabled={!canAddConnection}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Conexão
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showQRCode} onOpenChange={(open) => {
        setShowQRCode(open);
        if (!open) {
          setQrCodeTimer(30);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escaneie o QR Code com seu WhatsApp para conectar
            </p>
            {currentQRCode && (
              <div className="flex justify-center">
                <img src={currentQRCode} alt="QR Code" className="w-64 h-64" />
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-medium">
                Renovando em {qrCodeTimer}s
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                O QR Code será renovado automaticamente a cada 30 segundos
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {instanceToDelete && contactCounts[instanceToDelete.id] > 0 ? (
                <>
                  A conexão "{instanceToDelete.name}" possui{' '}
                  <strong>{contactCounts[instanceToDelete.id]} contato(s)</strong> vinculado(s).
                  <br /><br />
                  Ela será <strong>arquivada</strong> e você poderá importar seus contatos
                  em outra conexão posteriormente.
                </>
              ) : (
                <>
                  Tem certeza que deseja excluir permanentemente a conexão "{instanceToDelete?.name}"?
                  <br /><br />
                  Esta ação não pode ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteConnection} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {instanceToDelete && contactCounts[instanceToDelete.id] > 0 ? 'Arquivar' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Contatos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione a conexão de onde deseja importar os contatos:
            </p>
            
            {availableInstances.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Nenhuma conexão disponível para importação.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableInstances.map((inst) => (
                  <Card 
                    key={inst.id}
                    className={`cursor-pointer transition-colors ${
                      selectedSourceInstance === inst.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedSourceInstance(inst.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{inst.instance_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {inst.phone_number || 'Sem número'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {inst.contactCount || 0} contato(s)
                          </p>
                        </div>
                        {inst.deleted_at && (
                          <Badge variant="secondary">Arquivada</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={handleConfirmImport}
                disabled={!selectedSourceInstance}
                className="flex-1"
              >
                Importar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowImportDialog(false);
                  setSelectedSourceInstance('');
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showImportConfirmDialog} onOpenChange={setShowImportConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Importação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja importar os contatos da conexão selecionada?
              <br /><br />
              <strong>Esta ação não pode ser desfeita.</strong> Os contatos serão vinculados permanentemente a esta conexão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowImportConfirmDialog(false);
              setShowImportDialog(true);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={executeImport}>
              Confirmar Importação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Connections;
