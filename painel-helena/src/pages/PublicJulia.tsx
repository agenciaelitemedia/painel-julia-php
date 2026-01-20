import { useState } from "react";
import { usePublicAppSecurity } from "@/hooks/usePublicAppSecurity";
import { usePublicHelenaAgents } from "@/hooks/usePublicHelenaAgents";
import { usePublicDashboardStats } from "@/hooks/usePublicDashboardStats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BarChart3, Users, MessageSquare, FileText, Files } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentSelector } from "@/components/public-julia/AgentSelector";
import { AgentTabs } from "@/components/public-julia/AgentTabs";
import { DocumentsTab } from "@/components/public-julia/DocumentsTab";
export default function PublicJulia() {
  const { sessionToken, countId, userId, generateFreshToken, isAuthorized, isLoading } = usePublicAppSecurity();
  
  const { data: helenaAgents } = usePublicHelenaAgents(countId, sessionToken, generateFreshToken);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const codAgents = helenaAgents?.map(agent => agent.cod_agent.toString()) || [];
  const agentsList = helenaAgents || [];
  
  const { leads, contratos, followups, isLoading: statsLoading } = usePublicDashboardStats(
    codAgents.length > 0 ? codAgents : null,
    sessionToken,
    generateFreshToken
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="p-4 md:p-6 lg:p-8 pb-4 space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Painel Julia
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus agentes, visualize métricas e configure follow-ups
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto mx-4 md:mx-6 lg:mx-8">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="agents" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Meus Agents</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <Files className="h-4 w-4" />
            <span className="hidden sm:inline">Anotações e Documentos</span>
          </TabsTrigger>
          <TabsTrigger value="followup" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">FollowUp</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6 p-4 md:p-6 lg:p-8 pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Agents
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{codAgents.length}</div>
                <p className="text-xs text-muted-foreground">
                  Agents ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Leads
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : leads}
                </div>
                <p className="text-xs text-muted-foreground">
                  Leads de hoje
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Contratos
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : contratos}
                </div>
                <p className="text-xs text-muted-foreground">
                  Contratos gerados hoje
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Follow-ups
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : followups}
                </div>
                <p className="text-xs text-muted-foreground">
                  Follow-ups enviados hoje
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Visão Geral</CardTitle>
              <CardDescription>
                Métricas e estatísticas dos seus agentes Julia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Conteúdo de dashboard em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-6 p-4 md:p-6 lg:p-8 pt-6">
          <AgentSelector
            agents={agentsList}
            selectedAgent={selectedAgent}
            onSelect={setSelectedAgent}
          />

          {selectedAgent && (
            <AgentTabs
              codAgent={selectedAgent}
              sessionToken={sessionToken}
              generateFreshToken={generateFreshToken}
            />
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6 p-4 md:p-6 lg:p-8 pt-6">
          <DocumentsTab
            countId={countId}
            codAgents={codAgents}
            sessionToken={sessionToken}
            generateFreshToken={generateFreshToken}
          />
        </TabsContent>


        {/* FollowUp Tab */}
        <TabsContent value="followup" className="space-y-6 p-4 md:p-6 lg:p-8 pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de FollowUp</CardTitle>
              <CardDescription>
                Gerencie as configurações de follow-up dos seus agentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configurações de follow-up em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
