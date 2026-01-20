import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, MessageCircle, FileText, ExternalLink, CheckCircle, Trash2, Info } from "lucide-react";
import { JuliaContractRecord } from "@/hooks/useJuliaContracts";

interface ContractActionsMenuProps {
  contract: JuliaContractRecord;
  onOpenChat: () => void;
  onViewDetails: () => void;
  onViewSummary: () => void;
  onValidate: () => void;
  onDelete: () => void;
}

export function ContractActionsMenu({
  contract,
  onOpenChat,
  onViewDetails,
  onViewSummary,
  onValidate,
  onDelete,
}: ContractActionsMenuProps) {
  const handleOpenContract = () => {
    if (!contract.cod_document) {
      return;
    }
    const url = `https://app.zapsign.com.br/verificar/${contract.cod_document}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onOpenChat}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Abrir Chat
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onViewDetails}>
          <FileText className="mr-2 h-4 w-4" />
          Ver Detalhes
        </DropdownMenuItem>
        
        {contract.resumo_do_caso && (
          <DropdownMenuItem onClick={onViewSummary}>
            <Info className="mr-2 h-4 w-4" />
            Ver Resumo
          </DropdownMenuItem>
        )}
        
        {contract.cod_document && (
          <DropdownMenuItem onClick={handleOpenContract}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir Contrato
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        {contract.data_assinatura ? (
          // Contrato já assinado - mostrar opção de validar se ainda não foi validado
          contract.is_confirm !== 'VÁLIDO' && (
            <DropdownMenuItem onClick={onValidate} className="text-green-600">
              <CheckCircle className="mr-2 h-4 w-4" />
              Validar Contrato
            </DropdownMenuItem>
          )
        ) : (
          // Contrato não assinado - mostrar opção de excluir
          <DropdownMenuItem onClick={onDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Contrato
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
