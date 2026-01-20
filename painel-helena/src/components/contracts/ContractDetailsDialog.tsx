import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { JuliaContractRecord } from "@/hooks/useJuliaContracts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileCheck, User, MapPin, Building2, FileText, Link2 } from "lucide-react";

interface ContractDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: JuliaContractRecord | null;
}

export function ContractDetailsDialog({ open, onOpenChange, contract }: ContractDetailsDialogProps) {
  if (!contract) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "---";
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatCPF = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.slice(0,3)}.${cleaned.slice(3,6)}.${cleaned.slice(6,9)}-${cleaned.slice(9)}`;
    }
    return cpf;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'SIGNED': return 'bg-green-500';
      case 'CREATED': return 'bg-yellow-500';
      case 'DELETED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Detalhes do Contrato
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dados do Contrato */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Dados do Contrato
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Código:</span>
                <p className="font-medium">{contract.cod_document}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <div className="mt-1">
                  <Badge className={getStatusBadgeColor(contract.status_document)}>
                    {contract.status_document}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Situação:</span>
                <p className="font-medium">{contract.situacao}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Data Assinatura:</span>
                <p className="font-medium">{formatDate(contract.data_assinatura)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Data Criação:</span>
                <p className="font-medium">{formatDate(contract.created_at)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Validação:</span>
                <div className="mt-1">
                  <Badge variant={contract.is_confirm === 'VÁLIDO' ? 'default' : 'secondary'}>
                    {contract.is_confirm}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Dados do Contratante */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Dados do Contratante
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Nome:</span>
                <p className="font-medium">{contract.signer_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">CPF:</span>
                <p className="font-medium">{formatCPF(contract.signer_cpf)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">WhatsApp:</span>
                <p className="font-medium">{contract.whatsapp}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Endereço */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">CEP:</span>
                <p className="font-medium">{contract.signer_cep}</p>
              </div>
              <div>
                <span className="text-muted-foreground">UF:</span>
                <p className="font-medium">{contract.signer_uf}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Cidade:</span>
                <p className="font-medium">{contract.signer_cidade}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Bairro:</span>
                <p className="font-medium">{contract.signer_bairro}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Endereço:</span>
                <p className="font-medium">{contract.signer_endereco}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Dados do Agente */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Dados do Agente
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Nome/Escritório:</span>
                <p className="font-medium">{contract.name || contract.business_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Perfil:</span>
                <Badge variant="outline">{contract.perfil_agent}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Total de Mensagens:</span>
                <p className="font-medium">{contract.total_msg}</p>
              </div>
            </div>
          </div>

          {/* Caso Vinculado */}
          {contract.document_case_id && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Caso Vinculado
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Categoria:</span>
                    <div className="mt-1">
                      <Badge style={{ backgroundColor: contract.case_category_color || '#6366f1' }}>
                        {contract.case_category_name}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Título:</span>
                    <p className="font-medium">{contract.case_title}</p>
                  </div>
                  {contract.case_number && (
                    <div>
                      <span className="text-muted-foreground">Número do Processo:</span>
                      <p className="font-medium">{contract.case_number}</p>
                    </div>
                  )}
                  {contract.case_notes && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Observações:</span>
                      <p className="font-medium">{contract.case_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Resumo do Caso */}
          {contract.resumo_do_caso && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Resumo do Caso</h3>
                <div className="bg-muted p-4 rounded-lg text-sm">
                  <p className="whitespace-pre-wrap">{contract.resumo_do_caso}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
