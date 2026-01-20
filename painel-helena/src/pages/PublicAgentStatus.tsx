import { useSearchParams } from "react-router-dom";
import { usePublicAgentStatus } from "@/hooks/usePublicAgentStatus";
import { AgentStatusCard } from "@/components/public-agent-status/AgentStatusCard";
import { Loader2, AlertCircle, Bot, ShieldX } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useCallback, useMemo } from "react";

// Hostnames permitidos
const ALLOWED_HOSTNAMES = [
  'agents.atendejulia.com.br',
  'localhost',
  '127.0.0.1',
];

// Verifica se o hostname atual é permitido (inclui lovable para desenvolvimento)
const isHostnameAllowed = () => {
  const hostname = window.location.hostname;
  return ALLOWED_HOSTNAMES.includes(hostname) || 
         hostname.endsWith('.lovable.app') || 
         hostname.endsWith('.lovableproject.com');
};

export default function PublicAgentStatus() {
  const [searchParams] = useSearchParams();
  
  // Validar origem
  const isOriginAllowed = useMemo(() => isHostnameAllowed(), []);
  
  // Extrair parâmetros diretamente da URL
  const countId = searchParams.get('count_id');
  const whatsappNumber = searchParams.get('number');
  
  // Gerar token simples para as requisições
  const generateFreshToken = useCallback(() => {
    return btoa(`${Date.now()}:${countId || 'public'}`);
  }, [countId]);

  const sessionToken = useMemo(() => {
    return btoa(`${Date.now()}:${countId || 'public'}`);
  }, [countId]);
  
  const { 
    data: agents, 
    isLoading: agentLoading, 
    error 
  } = usePublicAgentStatus(countId, whatsappNumber, sessionToken, generateFreshToken);

  const agent = agents?.[0];

  // Bloquear acesso se origem não permitida
  if (!isOriginAllowed) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldX className="h-5 w-5" />
                Acesso não autorizado
              </CardTitle>
              <CardDescription>
                Esta página só pode ser acessada através do domínio autorizado.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Status do Agent
          </h1>
          <p className="text-muted-foreground">
            Visualize e controle o status do seu agent
          </p>
        </div>

        {/* Loading */}
        {agentLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando dados do agent...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Erro ao carregar
              </CardTitle>
              <CardDescription>
                Não foi possível carregar os dados do agent.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {/* No Data */}
        {!agentLoading && !error && !agent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                Agent não encontrado
              </CardTitle>
              <CardDescription>
                Não foi possível encontrar um agent com os parâmetros informados.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Agent Card */}
        {agent && (
          <AgentStatusCard 
            agent={agent} 
            sessionToken={sessionToken}
            generateFreshToken={generateFreshToken}
          />
        )}
      </div>
    </div>
  );
}
