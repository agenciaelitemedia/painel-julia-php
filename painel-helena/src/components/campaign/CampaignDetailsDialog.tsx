import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCampaignDetails } from "@/hooks/useCampaigns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CampaignDetailsDialogProps {
  campaignId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignDetailsDialog({
  campaignId,
  open,
  onOpenChange,
}: CampaignDetailsDialogProps) {
  const { data, isLoading } = useCampaignDetails(campaignId);

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      lead: "bg-blue-500",
      qualified_lead: "bg-purple-500",
      opportunity: "bg-orange-500",
      customer: "bg-green-500",
    };
    return colors[stage] || "bg-gray-500";
  };

  const getStageName = (stage: string) => {
    const names: Record<string, string> = {
      lead: "Lead",
      qualified_lead: "Lead Qualificado",
      opportunity: "Oportunidade",
      customer: "Cliente",
    };
    return names[stage] || stage;
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!data) return null;

  const { campaign, leads, metrics } = data;

  // Calcular estatísticas do funil
  const funnelStats = {
    lead: (leads as any[]).filter((l: any) => l.conversion_stage === "lead").length,
    qualified_lead: (leads as any[]).filter((l: any) => l.conversion_stage === "qualified_lead").length,
    opportunity: (leads as any[]).filter((l: any) => l.conversion_stage === "opportunity").length,
    customer: (leads as any[]).filter((l: any) => l.conversion_stage === "customer").length,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{(campaign as any).name}</DialogTitle>
          <DialogDescription>
            Plataforma: {(campaign as any).platform} • Criada em{" "}
            {new Date((campaign as any).created_at).toLocaleDateString("pt-BR", { timeZone: 'America/Sao_Paulo' })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Funil de Conversão */}
          <Card>
            <CardHeader>
              <CardTitle>Funil de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(funnelStats).map(([stage, count]) => {
                  const percentage = (leads as any[]).length > 0 ? (count / (leads as any[]).length) * 100 : 0;
                  return (
                    <div key={stage}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{getStageName(stage)}</span>
                        <span className="text-sm text-muted-foreground">
                          {count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getStageColor(stage)} transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Leads */}
          <Card>
            <CardHeader>
              <CardTitle>Leads Recentes ({(leads as any[]).length} total)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contato</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Estágio</TableHead>
                    <TableHead>Primeira Mensagem</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(leads as any[]).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhum lead encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    (leads as any[]).slice(0, 10).map((lead: any) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={lead.contacts?.avatar} />
                              <AvatarFallback>
                                {lead.contacts?.name?.charAt(0)?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{lead.contacts?.name || "Desconhecido"}</div>
                              <div className="text-xs text-muted-foreground">
                                {lead.contacts?.phone}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{lead.entry_point || "Desconhecido"}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${getStageColor(lead.conversion_stage)} text-white border-0`}
                          >
                            {getStageName(lead.conversion_stage)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {lead.first_message || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {lead.first_message_at
                            ? formatDistanceToNow(new Date(lead.first_message_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
