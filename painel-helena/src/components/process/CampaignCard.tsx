import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eye, Play, Pause, Trash2, Clock } from "lucide-react";
import { ProcessCampaign } from "@/hooks/useProcessCampaigns";
import { CampaignDetailsDialog } from "./CampaignDetailsDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CampaignCardProps {
  campaign: ProcessCampaign;
}

export const CampaignCard = ({ campaign }: CampaignCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const statusColors = {
    pending: "bg-gray-500",
    scheduled: "bg-blue-500",
    running: "bg-green-500",
    paused: "bg-yellow-500",
    completed: "bg-primary",
    failed: "bg-destructive",
  };

  const statusLabels = {
    pending: "Pendente",
    scheduled: "Agendada",
    running: "Em Andamento",
    paused: "Pausada",
    completed: "Concluída",
    failed: "Falhou",
  };

  const progress = campaign.total_records > 0
    ? ((campaign.sent_count + campaign.failed_count) / campaign.total_records) * 100
    : 0;

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{campaign.name}</CardTitle>
              <CardDescription className="mt-1">
                {campaign.whatsapp_instances?.instance_name || "Instância"}
              </CardDescription>
            </div>
            <Badge className={statusColors[campaign.status]}>
              {statusLabels[campaign.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Enviados: {campaign.sent_count}</span>
              <span>Falhas: {campaign.failed_count}</span>
              <span>Total: {campaign.total_records}</span>
            </div>
          </div>

          {campaign.scheduled_start_at && campaign.status === 'scheduled' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Início: {format(new Date(campaign.scheduled_start_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setDetailsOpen(true)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Detalhes
            </Button>
          </div>
        </CardContent>
      </Card>

      <CampaignDetailsDialog
        campaign={campaign}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  );
};
