import { usePublicAppSecurity } from "@/hooks/usePublicAppSecurity";
import { TicketContent } from "@/components/public-tickets/TicketContent";
import { Loader2 } from "lucide-react";

export default function PublicTickets() {
  const { sessionToken, countId, userId, isAuthorized, isLoading } = usePublicAppSecurity();

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

  if (!countId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">
            Acesso Negado
          </h1>
          <p className="text-muted-foreground">
            Parâmetro count_id é obrigatório.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-6 px-4">
        <TicketContent 
          helenaCountId={countId} 
          currentUserId={userId || undefined}
        />
      </div>
    </div>
  );
}
