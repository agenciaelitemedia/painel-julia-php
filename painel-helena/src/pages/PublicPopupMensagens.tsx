import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_URL = 'https://app.atendejulia.com.br/redirect?type=SESSION&id=';

const PublicPopupMensagens = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  const countId = searchParams.get('count_id');
  const codAgent = searchParams.get('cod_agent');
  const whatsappNumber = searchParams.get('whatsapp_number');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const fetchRedirectUrl = async () => {
      // Se tiver session_id, tentar buscar diretamente pela sessão
      if (sessionId && countId) {
        try {
          const { data, error: fnError } = await supabase.functions.invoke('helena-chat-redirect', {
            body: {
              helena_count_id: countId,
              session_id: sessionId
            }
          });

          if (!fnError && data?.redirectUrl) {
            window.location.href = data.redirectUrl;
            return;
          }
        } catch {
          // Se falhar, continua para o fluxo normal
        }
      }

      // Fluxo normal: precisa de countId e whatsappNumber
      if (!countId || !whatsappNumber) {
        window.location.href = FALLBACK_URL;
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke('helena-chat-redirect', {
          body: {
            cod_agent: codAgent,
            helena_count_id: countId,
            whatsapp_number: whatsappNumber
          }
        });

        if (fnError || !data?.redirectUrl) {
          window.location.href = FALLBACK_URL;
          return;
        }

        window.location.href = data.redirectUrl;

      } catch {
        window.location.href = FALLBACK_URL;
      }
    };

    fetchRedirectUrl();
  }, [countId, codAgent, whatsappNumber, sessionId]);

  if (!isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
};

export default PublicPopupMensagens;
