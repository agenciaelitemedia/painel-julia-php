import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Loader2, Plus, X, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePublicCaseCategories } from "@/hooks/usePublicCaseCategories";
import { usePublicCaseLegal } from "@/hooks/usePublicCaseLegal";
import { usePublicAgentMutations } from "@/hooks/usePublicAgentMutations";

interface LinkCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codAgent: string;
  sessionToken: string | null;
  generateFreshToken: (() => string | null) | null;
}

export function LinkCaseDialog({
  open,
  onOpenChange,
  codAgent,
  sessionToken,
  generateFreshToken,
}: LinkCaseDialogProps) {
  const [categoryId, setCategoryId] = useState<string>("");
  const [caseId, setCaseId] = useState<string>("");
  const [casePopoverOpen, setCasePopoverOpen] = useState(false);
  const [activationPhrases, setActivationPhrases] = useState<string[]>([]);
  const [newPhrase, setNewPhrase] = useState("");
  const [campaingLink, setCampaingLink] = useState("");
  const [caseFees, setCaseFees] = useState("");

  const { data: categories, isLoading: loadingCategories } = usePublicCaseCategories(
    sessionToken,
    generateFreshToken
  );

  const { data: cases, isLoading: loadingCases } = usePublicCaseLegal(
    categoryId,
    sessionToken,
    generateFreshToken
  );

  const { createAgentCase } = usePublicAgentMutations();

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setCategoryId("");
      setCaseId("");
      setActivationPhrases([]);
      setNewPhrase("");
      setCampaingLink("");
      setCaseFees("");
    }
  }, [open]);

  // Reset case when category changes
  useEffect(() => {
    setCaseId("");
  }, [categoryId]);

  const handleAddPhrase = () => {
    const trimmed = newPhrase.trim();
    if (trimmed && !activationPhrases.includes(trimmed)) {
      setActivationPhrases([...activationPhrases, trimmed]);
      setNewPhrase("");
    }
  };

  const handleRemovePhrase = (phrase: string) => {
    setActivationPhrases(activationPhrases.filter((p) => p !== phrase));
  };

  const handleSubmit = () => {
    if (!sessionToken || !categoryId || !caseId || activationPhrases.length === 0) {
      return;
    }

    createAgentCase.mutate(
      {
        cod_agent: codAgent,
        case_category_id: categoryId,
        case_legal_id: caseId,
        activation_phrase: activationPhrases.join("||"),
        campaing_link: campaingLink.trim() || undefined,
        case_fees: caseFees.trim() || undefined,
        sessionToken,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const isFormValid = categoryId && caseId && activationPhrases.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vincular Caso Jurídico</DialogTitle>
          <DialogDescription>
            Associe um caso com frases de ativação para criar uma campanha
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {loadingCategories ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : categories && categories.length > 0 ? (
                  categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color || "#6366f1" }}
                        />
                        {cat.name}
                        <span className="text-muted-foreground text-xs">
                          ({cat.case_count ?? 0})
                        </span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Nenhuma categoria disponível
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Caso Legal - Combobox com busca */}
          <div className="space-y-2">
            <Label>Caso Jurídico *</Label>
            <Popover open={casePopoverOpen} onOpenChange={setCasePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={casePopoverOpen}
                  className="w-full justify-between font-normal"
                  disabled={!categoryId}
                >
                  {caseId
                    ? cases?.find((c) => c.id.toString() === caseId)?.title || "Selecione o caso"
                    : "Selecione o caso"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar caso..." />
                  <CommandList>
                    {loadingCases ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      <>
                        <CommandEmpty>Nenhum caso encontrado.</CommandEmpty>
                        <CommandGroup>
                          {cases?.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.title}
                              onSelect={() => {
                                setCaseId(c.id.toString());
                                setCasePopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  caseId === c.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{c.title}</span>
                                {c.case_number && (
                                  <span className="text-xs text-muted-foreground">
                                    {c.case_number}
                                  </span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Frases de Ativação */}
          <div className="space-y-2">
            <Label>Frases de Ativação *</Label>
            <div className="flex gap-2">
              <Input
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value.slice(0, 200))}
                placeholder="Digite uma frase de ativação"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddPhrase();
                  }
                }}
                maxLength={200}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddPhrase}
                disabled={!newPhrase.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {activationPhrases.length > 0 && (
              <div className="space-y-1 mt-2">
                {activationPhrases.map((phrase) => (
                  <div
                    key={phrase}
                    className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                  >
                    <span className="truncate flex-1">{phrase}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-2"
                      onClick={() => handleRemovePhrase(phrase)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Adicione uma ou mais frases que ativam esta campanha ({activationPhrases.length} adicionadas)
            </p>
          </div>

          {/* Link da Campanha */}
          <div className="space-y-2">
            <Label htmlFor="link">Link da Campanha (opcional)</Label>
            <Input
              id="link"
              type="url"
              value={campaingLink}
              onChange={(e) => setCampaingLink(e.target.value.slice(0, 200))}
              placeholder="https://..."
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              URL para rastreamento ou landing page da campanha
            </p>
          </div>

          {/* Mensagem de Honorários */}
          <div className="space-y-2">
            <Label htmlFor="fees">Mensagem de Honorários do Caso (opcional)</Label>
            <Textarea
              id="fees"
              value={caseFees}
              onChange={(e) => setCaseFees(e.target.value.slice(0, 1000))}
              placeholder="Digite a mensagem sobre os honorários do caso..."
              className="min-h-[100px] resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {caseFees.length}/1000 caracteres
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createAgentCase.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || createAgentCase.isPending}
          >
            {createAgentCase.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Vinculando...
              </>
            ) : (
              "Vincular Caso"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
