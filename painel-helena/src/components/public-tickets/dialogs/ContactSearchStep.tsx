import { useState, useCallback } from "react";
import { Search, UserPlus, User, Phone, Mail, Loader2, ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useHelenaContactSearch, HelenaContact } from "@/hooks/useHelenaContactSearch";
import { toast } from "sonner";

interface ContactSearchStepProps {
  helenaCountId: string;
  onContactSelected: (contact: HelenaContact) => void;
  onCancel: () => void;
}

export function ContactSearchStep({
  helenaCountId,
  onContactSelected,
  onCancel,
}: ContactSearchStepProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<HelenaContact[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("55");

  const { searchContacts, createContact, isSearching, isCreating } = useHelenaContactSearch(helenaCountId);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast.error("Digite um nome ou número para buscar");
      return;
    }

    try {
      // Detect if search query is a phone number (digits only or with common separators)
      const cleanQuery = searchQuery.replace(/[\s\-\(\)]/g, '');
      const isPhoneNumber = /^\+?\d{8,}$/.test(cleanQuery);

      const results = await searchContacts(
        isPhoneNumber ? undefined : searchQuery.trim(),
        isPhoneNumber ? cleanQuery : undefined
      );

      setSearchResults(results);
      setHasSearched(true);

      if (results.length === 0) {
        toast.info("Nenhum contato encontrado. Você pode cadastrar um novo.");
      }
    } catch (error) {
      console.error('[ContactSearchStep] Search error:', error);
      toast.error("Erro ao buscar contatos");
    }
  }, [searchQuery, searchContacts]);

  const handleCreate = useCallback(async () => {
    if (!newContactName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    const cleanPhone = newContactPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error("Número de WhatsApp inválido");
      return;
    }

    try {
      const contact = await createContact(newContactName.trim(), cleanPhone);
      if (contact) {
        toast.success("Contato cadastrado com sucesso!");
        onContactSelected(contact);
      }
    } catch (error) {
      console.error('[ContactSearchStep] Create error:', error);
      toast.error("Erro ao cadastrar contato");
    }
  }, [newContactName, newContactPhone, createContact, onContactSelected]);

  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 13) {
      return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
    }
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    return phone;
  };

  // Create form view
  if (showCreateForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateForm(false)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-medium">Cadastrar Novo Contato</h3>
        </div>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="newContactName">Nome *</Label>
            <Input
              id="newContactName"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              placeholder="Nome do contato"
              autoFocus
            />
          </div>

          <PhoneInput
            id="newContactPhone"
            label="WhatsApp *"
            value={newContactPhone}
            onChange={setNewContactPhone}
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCreateForm(false)}
          >
            Voltar
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cadastrar e Continuar
          </Button>
        </div>
      </div>
    );
  }

  // Search view
  return (
    <div className="space-y-4">
      <div className="pb-2 border-b">
        <h3 className="font-medium">Buscar Contato</h3>
        <p className="text-sm text-muted-foreground">
          Pesquise por nome ou número de WhatsApp
        </p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Nome ou número de WhatsApp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            autoFocus
          />
        </div>
        <Button
          type="button"
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Results */}
      {hasSearched && (
        <ScrollArea className="h-[240px] rounded-md border">
          {searchResults.length > 0 ? (
            <div className="p-2 space-y-2">
              {searchResults.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors group"
                  onClick={() => onContactSelected(contact)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">{contact.name}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{formatPhoneDisplay(contact.phoneNumber)}</span>
                        </div>
                        {contact.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{contact.email}</span>
                          </div>
                        )}
                        {contact.tagNames && contact.tagNames.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {contact.tagNames.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {contact.tagNames.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{contact.tagNames.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Nenhum contato encontrado para "{searchQuery}"
              </p>
            </div>
          )}
        </ScrollArea>
      )}

      {/* Create new contact option */}
      {hasSearched && (
        <div className="flex items-center gap-2">
          <div className="flex-1 border-t" />
          <span className="text-xs text-muted-foreground uppercase">ou</span>
          <div className="flex-1 border-t" />
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => {
          setShowCreateForm(true);
          // Pre-fill name/phone if search query looks like one or the other
          const cleanQuery = searchQuery.replace(/[\s\-\(\)]/g, '');
          const isPhoneNumber = /^\+?\d{8,}$/.test(cleanQuery);
          if (isPhoneNumber) {
            setNewContactPhone(cleanQuery.replace(/^\+/, ''));
          } else if (searchQuery.trim()) {
            setNewContactName(searchQuery.trim());
          }
        }}
      >
        <UserPlus className="mr-2 h-4 w-4" />
        Cadastrar Novo Contato
      </Button>

      <div className="flex justify-end pt-2 border-t">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
