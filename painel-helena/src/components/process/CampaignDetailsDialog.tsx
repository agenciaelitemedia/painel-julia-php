import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Play, Pause, XCircle, Trash2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { ProcessCampaign, ProcessRecord, useProcessCampaigns } from "@/hooks/useProcessCampaigns";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface CampaignDetailsDialogProps {
  campaign: ProcessCampaign;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CampaignDetailsDialog = ({ campaign, open, onOpenChange }: CampaignDetailsDialogProps) => {
  const { updateCampaignStatus, deleteCampaign, getCampaignRecords } = useProcessCampaigns();
  const [records, setRecords] = useState<ProcessRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadRecords();
    }
  }, [open]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await getCampaignRecords(campaign.id);
      setRecords(data);
    } catch (error) {
      console.error("Error loading records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    await updateCampaignStatus({ id: campaign.id, status: 'running' });
  };

  const handlePause = async () => {
    await updateCampaignStatus({ id: campaign.id, status: 'paused' });
  };

  const handleResume = async () => {
    await updateCampaignStatus({ id: campaign.id, status: 'running' });
  };

  const handleCancel = async () => {
    await updateCampaignStatus({ id: campaign.id, status: 'failed' });
  };

  const handleDelete = async () => {
    await deleteCampaign(campaign.id);
    onOpenChange(false);
  };

  const progress = campaign.total_records > 0
    ? ((campaign.sent_count + campaign.failed_count) / campaign.total_records) * 100
    : 0;

  const statusIcons = {
    pending: <Clock className="h-4 w-4" />,
    sending: <Clock className="h-4 w-4 animate-pulse" />,
    sent: <CheckCircle className="h-4 w-4 text-green-500" />,
    failed: <AlertCircle className="h-4 w-4 text-red-500" />,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign.name}</DialogTitle>
          <DialogDescription>
            Detalhes e progresso da campanha
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaign.total_records}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Enviados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{campaign.sent_count}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Falhas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{campaign.failed_count}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {campaign.total_records - campaign.sent_count - campaign.failed_count}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progresso Geral</span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          <div className="flex gap-2">
            {campaign.status === 'pending' || campaign.status === 'scheduled' ? (
              <Button onClick={handleStart} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Iniciar Campanha
              </Button>
            ) : null}

            {campaign.status === 'running' ? (
              <Button onClick={handlePause} variant="outline" className="flex-1">
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </Button>
            ) : null}

            {campaign.status === 'paused' ? (
              <Button onClick={handleResume} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Retomar
              </Button>
            ) : null}

            {(campaign.status === 'running' || campaign.status === 'paused') && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar Campanha?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá parar o envio de mensagens. Os registros já enviados não serão afetados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel}>Cancelar Campanha</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {(campaign.status === 'completed' || campaign.status === 'failed') && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Campanha?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Todos os dados da campanha serão removidos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Registros ({records.length})</h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Processo</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Andamento</TableHead>
                    <TableHead>Tentativas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.slice(0, 50).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {statusIcons[record.send_status]}
                          <span className="text-xs capitalize">{record.send_status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{record.process_number}</TableCell>
                      <TableCell>{record.phone_number}</TableCell>
                      <TableCell className="max-w-xs truncate">{record.process_status}</TableCell>
                      <TableCell>{record.retry_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {records.length > 50 && (
                <div className="p-4 text-center text-sm text-muted-foreground border-t">
                  Mostrando 50 de {records.length} registros
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
