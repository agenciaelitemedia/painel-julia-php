import { usePublicAppSecurity } from "@/hooks/usePublicAppSecurity";
import { usePublicHelenaAgents } from "@/hooks/usePublicHelenaAgents";
import { Loader2, Kanban } from "lucide-react";
import { CRMContent } from "@/components/public-crm/CRMContent";

export default function PublicCRMJulia() {
  const { sessionToken, countId, generateFreshToken, isAuthorized, isLoading } = usePublicAppSecurity();
  
  const { data: helenaAgents } = usePublicHelenaAgents(countId, sessionToken, generateFreshToken);
  const codAgents = helenaAgents?.map(agent => agent.cod_agent.toString()) || [];

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
      <div className="p-4 md:p-6 lg:p-8 pb-4 space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Kanban className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              CRM Atende Julia
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie leads e acompanhe o pipeline de atendimento
            </p>
          </div>
        </div>
      </div>

      {/* CRM Content */}
      <div className="px-4 md:px-6 lg:px-8 pb-8">
        <CRMContent
          countId={countId}
          codAgents={codAgents}
          sessionToken={sessionToken}
          generateFreshToken={generateFreshToken}
        />
      </div>
    </div>
  );
}
