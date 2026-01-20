import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  FlaskConical, 
  Send, 
  Paperclip, 
  Pencil, 
  Trash2, 
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Bell
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { ContractTemplate, useDeleteContractTemplate } from "@/hooks/usePublicContractTemplates";
import { TemplateNotificationsDialog } from "./TemplateNotificationsDialog";

interface TemplateCardProps {
  template: ContractTemplate;
  sessionToken: string | null;
  onEdit: () => void;
  onRefresh: () => void;
}

const STATUS_CONFIG = {
  draft: { label: 'Rascunho', icon: Clock, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  testing: { label: 'Testando', icon: FlaskConical, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  active: { label: 'Ativo', icon: CheckCircle2, color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  error: { label: 'Erro', icon: AlertCircle, color: 'bg-red-500/10 text-red-600 border-red-500/20' }
};

export function TemplateCard({ template, sessionToken, onEdit, onRefresh }: TemplateCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showNotificationsDialog, setShowNotificationsDialog] = useState(false);
  
  const deleteTemplateMutation = useDeleteContractTemplate();

  const statusConfig = STATUS_CONFIG[template.status] || STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;

  const handleDelete = async () => {
    if (!sessionToken) return;

    try {
      // Delete from ZapSign, storage, and database (all handled by the mutation now)
      await deleteTemplateMutation.mutateAsync({
        id: template.id,
        storagePath: template.storage_path,
        zapsignTemplateId: template.zapsign_template_id,
        sessionToken
      });

      toast.success("Template excluído com sucesso");
      onRefresh();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || "Erro ao excluir template");
    }

    setShowDeleteDialog(false);
  };

  const relationshipLabels: Record<string, string> = {
    pai: 'Pai',
    mae: 'Mãe',
    tutor: 'Tutor',
    curador: 'Curador',
    responsavel: 'Responsável Legal',
    outro: 'Outro'
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-medium">{template.template_name}</h3>
              </div>

              {template.case_name && (
                <p className="text-sm text-muted-foreground">
                  📁 Caso: {template.case_name}
                </p>
              )}

              {template.is_legal_representative && template.legal_representative_data && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                    <User className="h-3 w-3 mr-1" />
                    Representante Legal 
                    {template.legal_representative_data.representative_relationship && (
                      <span className="ml-1">
                        ({relationshipLabels[template.legal_representative_data.representative_relationship] || template.legal_representative_data.representative_relationship}
                        {template.legal_representative_data.representative_name && ` - ${template.legal_representative_data.representative_name}`})
                      </span>
                    )}
                  </Badge>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>📊 {template.variables?.length || 0} variáveis</span>
                {!template.is_main_document && (
                  <span>🔗 Anexo</span>
                )}
                <Badge variant="outline" className={statusConfig.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>

              {template.error_message && (
                <p className="text-sm text-red-500">
                  ⚠️ {template.error_message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="gap-1"
              >
                <FlaskConical className="h-4 w-4" />
                <span className="hidden sm:inline">Testar</span>
              </Button>

              {template.status === 'draft' && (
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1"
                  onClick={onEdit}
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Enviar</span>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar Variáveis
                  </DropdownMenuItem>
                  {template.zapsign_template_id && (
                    <>
                      <DropdownMenuItem>
                        <Paperclip className="h-4 w-4 mr-2" />
                        Anexar Documento
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowNotificationsDialog(true)}>
                        <Bell className="h-4 w-4 mr-2" />
                        Notificações Externas
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{template.template_name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TemplateNotificationsDialog
        open={showNotificationsDialog}
        onOpenChange={setShowNotificationsDialog}
        templateToken={template.zapsign_template_id}
        templateName={template.template_name}
        sessionToken={sessionToken}
        onSave={onRefresh}
      />
    </>
  );
}
