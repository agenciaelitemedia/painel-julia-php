import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useTestFollowupSend = () => {
  const testSend = async (executionId?: string) => {
    try {
      toast({ title: "Testando envio de follow-up..." });
      
      const { data, error } = await supabase.functions.invoke('test-followup-send', {
        body: { execution_id: executionId }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "✅ Mensagem de follow-up enviada!",
          description: `Para: ${data.contact} (${data.phone})\nEtapa: ${data.step}`,
        });
        
        console.log('[TestFollowup] Resultado completo:', data);
        
        return data;
      } else {
        toast({
          title: "❌ Falha no envio",
          description: data.error || data.message,
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      console.error('[TestFollowup] Erro:', error);
      toast({
        title: "❌ Erro ao testar envio",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return null;
    }
  };

  return { testSend };
};
