import { useSearchParams } from "react-router-dom";
import { usePublicAppSecurity } from "@/hooks/usePublicAppSecurity";
import { PopupTicketContent } from "@/components/public-popup-tickets/PopupTicketContent";
import { Loader2 } from "lucide-react";

export default function PublicPopupTickets() {
  const [searchParams] = useSearchParams();
  
  // Use existing security hook pattern - now extracts contact_id and number
  const { isAuthorized, isLoading, countId, userId, whatsappNumber: securityNumber, contactId } = usePublicAppSecurity();
  
  // Get additional params from URL or use security hook values
  const whatsappNumber = searchParams.get("number") || securityNumber || "";
  const contactName = searchParams.get("contact_name") || "";
  const codAgent = searchParams.get("cod_agent") || "";
  const helenaContactId = searchParams.get("contact_id") || contactId || "";
  const sessionId = searchParams.get("chat_id") || "";
  
  // Get user name from URL or default
  const userName = searchParams.get("user_name") || "Usuário";

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized || !countId) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">Acesso Negado</h1>
          <p className="text-muted-foreground mt-2">
            Parâmetros inválidos ou sessão expirada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      <PopupTicketContent
        helenaCountId={countId}
        codAgent={codAgent}
        whatsappNumber={whatsappNumber}
        contactName={contactName}
        userId={userId || ""}
        userName={userName}
        helenaContactId={helenaContactId}
        sessionId={sessionId}
      />
    </div>
  );
}
