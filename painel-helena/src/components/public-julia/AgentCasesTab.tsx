import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Plus, MoreVertical, ExternalLink, Loader2, Trash2, Pencil, FileText } from "lucide-react";
import { usePublicAgentCases } from "@/hooks/usePublicAgentCases";
import { usePublicAgentMutations } from "@/hooks/usePublicAgentMutations";
import { LinkCaseDialog } from "./LinkCaseDialog";
import { EditCaseDialog } from "./EditCaseDialog";

interface AgentCasesTabProps {
  codAgent: string;
  sessionToken: string | null;
  generateFreshToken: (() => string | null) | null;
}

export function AgentCasesTab({ codAgent, sessionToken, generateFreshToken }: AgentCasesTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feesDialogOpen, setFeesDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<number | null>(null);
  const [caseToEdit, setCaseToEdit] = useState<any | null>(null);
  const [selectedCaseFees, setSelectedCaseFees] = useState<string | null>(null);

  const { data: cases, isLoading } = usePublicAgentCases(
    codAgent,
    sessionToken,
    generateFreshToken
  );

  const { updateAgentCase, deleteAgentCase } = usePublicAgentMutations();

  const handleToggleStatus = (id: number, currentStatus: boolean) => {
    if (!sessionToken) return;
    updateAgentCase.mutate({
      id: id.toString(),
      status: !currentStatus,
      sessionToken,
    });
  };

  const handleEditClick = (caseItem: any) => {
    setCaseToEdit(caseItem);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setCaseToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!sessionToken || !caseToDelete) return;
    deleteAgentCase.mutate(
      {
        id: caseToDelete.toString(),
        sessionToken,
      },
      {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setCaseToDelete(null);
        },
      }
    );
  };

  const handleViewFees = (caseFees: string | null) => {
    setSelectedCaseFees(caseFees);
    setFeesDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Casos Jurídicos Vinculados</CardTitle>
            <CardDescription>
              Gerencie os casos e frases de ativação de campanhas
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Vincular Novo Caso
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !cases || cases.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-muted-foreground mb-4">
              Nenhum caso vinculado ainda
            </p>
            <Button onClick={() => setDialogOpen(true)} variant="outline">
              <Plus className="h-4 w-4" />
              Vincular Primeiro Caso
            </Button>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Caso</TableHead>
                  <TableHead className="hidden md:table-cell">Frase de Ativação</TableHead>
                  <TableHead className="hidden lg:table-cell">Ver Honorários</TableHead>
                  <TableHead className="hidden lg:table-cell">Link</TableHead>
                  <TableHead className="text-center">Usos</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: item.category_color || undefined,
                          color: "white",
                        }}
                      >
                        {item.category_name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.case_title}</p>
                        {item.case_number && (
                          <p className="text-xs text-muted-foreground">
                            {item.case_number}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(item.activation_phrase || "").split("||").filter(Boolean).length > 0 ? (
                          (item.activation_phrase || "").split("||").filter(Boolean).map((phrase, idx) => (
                            <code key={idx} className="text-xs bg-muted px-2 py-1 rounded">
                              {phrase}
                            </code>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">Sem frase</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-center">
                      {item.case_fees ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewFees(item.case_fees)}
                          className="h-8 w-8"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {item.campaing_link ? (
                        <a
                          href={item.campaing_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{item.used_total}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={item.status}
                        onCheckedChange={() =>
                          handleToggleStatus(item.id, item.status)
                        }
                        disabled={updateAgentCase.isPending}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(item)}>
                            <Pencil className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(item.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <LinkCaseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        codAgent={codAgent}
        sessionToken={sessionToken}
        generateFreshToken={generateFreshToken}
      />

      <EditCaseDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        caseData={caseToEdit}
        sessionToken={sessionToken}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este vínculo de caso? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={feesDialogOpen} onOpenChange={setFeesDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mensagem de Honorários</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="mt-4 max-h-[400px] overflow-y-auto">
                {selectedCaseFees ? (
                  <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedCaseFees}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    Nenhuma mensagem de honorários cadastrada para este caso.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
