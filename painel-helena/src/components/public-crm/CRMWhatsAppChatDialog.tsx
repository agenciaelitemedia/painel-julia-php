import { useEffect } from "react";
import { CRMCard } from "@/hooks/usePublicCRMCardsOptimized";

interface CRMWhatsAppChatDialogProps {
  card: CRMCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  countId: string | null;
}

export const CRMWhatsAppChatDialog = ({ 
  card, 
  open, 
  onOpenChange,
  countId 
}: CRMWhatsAppChatDialogProps) => {
  
  useEffect(() => {
    if (open && card && countId) {
      const width = 1024;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      // Construir URL absoluta para a página de popup
      const popupUrl = `${window.location.origin}/app_popup_mensagens?count_id=${encodeURIComponent(countId)}&cod_agent=${encodeURIComponent(card.cod_agent || '')}&whatsapp_number=${encodeURIComponent(card.whatsapp_number || '')}&timestamp=${Date.now()}`;
      
      window.open(
        popupUrl,
        'whatsapp_chat',
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
      );
      
      onOpenChange(false);
    }
  }, [open, card, countId, onOpenChange]);

  return null;
};
