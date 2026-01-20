import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { useCaseCategories, useCaseLegalByCategory, useLinkContractToCase, JuliaContractRecord } from "@/hooks/useJuliaContracts";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface LinkCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: JuliaContractRecord | null;
}

export function LinkCaseDialog({ open, onOpenChange, contract }: LinkCaseDialogProps) {
  const { profile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCase, setSelectedCase] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [openCaseCombobox, setOpenCaseCombobox] = useState(false);

  const { data: categories, isLoading: loadingCategories } = useCaseCategories();
  const { data: cases, isLoading: loadingCases } = useCaseLegalByCategory(
    selectedCategory ? parseInt(selectedCategory) : null
  );
  const linkMutation = useLinkContractToCase();

  useEffect(() => {
    if (open) {
      setSelectedCategory("");
      setSelectedCase("");
      setNotes("");
    }
  }, [open]);

  const handleLink = () => {
    if (!contract || !selectedCase) return;

    linkMutation.mutate({
      codDocument: contract.cod_document,
      caseLegalId: parseInt(selectedCase),
      linkedBy: profile?.full_name || "Sistema",
      notes,
    }, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Vincular Caso ao Contrato</DialogTitle>
          <DialogDescription>
            Contrato #{contract?.cod_document}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            {loadingCategories ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category">
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
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="case">Caso Jurídico *</Label>
            {loadingCases ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Popover open={openCaseCombobox} onOpenChange={setOpenCaseCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCaseCombobox}
                    className="w-full justify-between"
                    disabled={!selectedCategory}
                  >
                    {selectedCase
                      ? cases?.find((c) => c.id.toString() === selectedCase)?.title +
                        (cases?.find((c) => c.id.toString() === selectedCase)?.case_number 
                          ? ` (${cases?.find((c) => c.id.toString() === selectedCase)?.case_number})`
                          : '')
                      : "Selecione o caso jurídico"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar caso jurídico..." />
                    <CommandList>
                      <CommandEmpty>Nenhum caso encontrado.</CommandEmpty>
                      <CommandGroup>
                        {cases?.map((caseItem) => (
                          <CommandItem
                            key={caseItem.id}
                            value={`${caseItem.title} ${caseItem.case_number || ''}`}
                            onSelect={() => {
                              setSelectedCase(caseItem.id.toString());
                              setOpenCaseCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCase === caseItem.id.toString() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {caseItem.title} {caseItem.case_number && `(${caseItem.case_number})`}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre este vínculo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleLink}
            disabled={!selectedCase || linkMutation.isPending}
          >
            {linkMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Vincular Caso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
