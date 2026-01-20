import { useEffect } from "react";

interface TicketChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  helenaCountId: string;
  codAgent: string | null;
  whatsappNumber: string | null;
  sessionId?: string | null;
}

export const TicketChatModal = ({
  open,
  onOpenChange,
  helenaCountId,
  codAgent,
  whatsappNumber,
  sessionId,
}: TicketChatModalProps) => {
  
  useEffect(() => {
    if (open && helenaCountId && (whatsappNumber || sessionId)) {
      const width = 1024;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      // Construir URL absoluta para a página de popup (mesmo padrão do CRM)
      let popupUrl = `${window.location.origin}/app_popup_mensagens?count_id=${encodeURIComponent(helenaCountId)}&cod_agent=${encodeURIComponent(codAgent || '')}&whatsapp_number=${encodeURIComponent(whatsappNumber || '')}`;
      
      // Se tiver session_id, adicionar à URL para navegação direta
      if (sessionId) {
        popupUrl += `&session_id=${encodeURIComponent(sessionId)}`;
      }
      
      popupUrl += `&timestamp=${Date.now()}`;
      
      window.open(
        popupUrl,
        'whatsapp_chat',
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
      );
      
      onOpenChange(false);
    }
  }, [open, helenaCountId, codAgent, whatsappNumber, sessionId, onOpenChange]);

  return null;
};
