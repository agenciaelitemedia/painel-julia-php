import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCreateCaseLegal, useCaseCategories } from "@/hooks/useJuliaContracts";

interface CreateCaseLegalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId?: number | null;
  onCaseCreated?: (newCaseId: number) => void;
}

export function CreateCaseLegalDialog({ 
  open, 
  onOpenChange, 
  categoryId,
  onCaseCreated 
}: CreateCaseLegalDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryId?.toString() || "");
  const [title, setTitle] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [description, setDescription] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientCpf, setClientCpf] = useState("");
  const [responsibleLawyer, setResponsibleLawyer] = useState("");

  const { data: categories } = useCaseCategories();
  const createMutation = useCreateCaseLegal();

  useEffect(() => {
    if (categoryId) {
      setSelectedCategory(categoryId.toString());
    }
  }, [categoryId]);

  useEffect(() => {
    if (open) {
      if (!categoryId) setSelectedCategory("");
      setTitle("");
      setCaseNumber("");
      setDescription("");
      setClientName("");
      setClientCpf("");
      setResponsibleLawyer("");
    }
  }, [open, categoryId]);

  const handleCreate = () => {
    if (!selectedCategory || !title) return;

    createMutation.mutate({
      case_category_id: parseInt(selectedCategory),
      title,
      case_number: caseNumber || null,
      description: description || null,
      client_name: clientName || null,
      client_cpf: clientCpf || null,
      responsible_lawyer: responsibleLawyer || null,
    } as any, {
      onSuccess: (data: any) => {
        onOpenChange(false);
        if (onCaseCreated && data?.data?.[0]?.id) {
          onCaseCreated(data.data[0].id);
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Caso Jurídico</DialogTitle>
          <DialogDescription>
            Preencha as informações do novo caso
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-category">Categoria *</Label>
            <Select 
              value={selectedCategory} 
              onValueChange={setSelectedCategory}
              disabled={!!categoryId}
            >
              <SelectTrigger id="new-category">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título do Caso *</Label>
            <Input
              id="title"
              placeholder="Ex: Ação Trabalhista - Horas Extras"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="case-number">Número do Processo</Label>
            <Input
              id="case-number"
              placeholder="Ex: 0000000-00.0000.0.00.0000"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o caso..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Nome do Cliente</Label>
              <Input
                id="client-name"
                placeholder="Nome completo"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-cpf">CPF do Cliente</Label>
              <Input
                id="client-cpf"
                placeholder="000.000.000-00"
                value={clientCpf}
                onChange={(e) => setClientCpf(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lawyer">Advogado Responsável</Label>
            <Input
              id="lawyer"
              placeholder="Nome do advogado"
              value={responsibleLawyer}
              onChange={(e) => setResponsibleLawyer(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!selectedCategory || !title || createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Caso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
