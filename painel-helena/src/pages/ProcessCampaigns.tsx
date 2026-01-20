import { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProcessCampaigns } from "@/hooks/useProcessCampaigns";
import { CreateCampaignDialog } from "@/components/process/CreateCampaignDialog";
import { CampaignCard } from "@/components/process/CampaignCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProcessCampaigns = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { campaigns, isLoading } = useProcessCampaigns();

  const pendingCampaigns = campaigns?.filter(c => c.status === 'pending' || c.status === 'scheduled') || [];
  const runningCampaigns = campaigns?.filter(c => c.status === 'running' || c.status === 'paused') || [];
  const completedCampaigns = campaigns?.filter(c => c.status === 'completed' || c.status === 'failed') || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Andamento de Processo
          </h1>
          <p className="text-muted-foreground mt-1">
            Envio massivo de notificações de processos via WhatsApp
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Campanhas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningCampaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCampaigns.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todas ({campaigns?.length || 0})</TabsTrigger>
          <TabsTrigger value="pending">Pendentes ({pendingCampaigns.length})</TabsTrigger>
          <TabsTrigger value="running">Em Andamento ({runningCampaigns.length})</TabsTrigger>
          <TabsTrigger value="completed">Concluídas ({completedCampaigns.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {campaigns && campaigns.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Nenhuma campanha encontrada</CardTitle>
                <CardDescription>
                  Crie sua primeira campanha para começar a enviar notificações
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingCampaigns.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Nenhuma campanha pendente</CardTitle>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="running" className="space-y-4">
          {runningCampaigns.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {runningCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Nenhuma campanha em andamento</CardTitle>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedCampaigns.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Nenhuma campanha concluída</CardTitle>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <CreateCampaignDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </div>
  );
};

export default ProcessCampaigns;
