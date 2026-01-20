import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_URL = 'https://app.atendejulia.com.br/redirect?type=SESSION&id=';

interface CRMHelenaChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  countId: string | null;
  codAgent: string | null;
  whatsappNumber: string | null;
}

export const CRMHelenaChatModal = ({
  open,
  onOpenChange,
  countId,
  codAgent,
  whatsappNumber,
}: CRMHelenaChatModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setIsLoading(true);
      setIframeUrl(null);
      return;
    }

    const fetchRedirectUrl = async () => {
      if (!countId || !codAgent || !whatsappNumber) {
        setIframeUrl(FALLBACK_URL);
        setIsLoading(false);
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
          setIframeUrl(FALLBACK_URL);
          setIsLoading(false);
          return;
        }

        setIframeUrl(data.redirectUrl);
        setIsLoading(false);

      } catch {
        setIframeUrl(FALLBACK_URL);
        setIsLoading(false);
      }
    };

    fetchRedirectUrl();
  }, [open, countId, codAgent, whatsappNumber]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] h-[85vh] p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Carregando conversa...</p>
            </div>
          </div>
        ) : iframeUrl ? (
          <iframe
            src={iframeUrl}
            className="w-full h-full border-0"
            title="Atende Julia Chat"
            allow="clipboard-write"
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
