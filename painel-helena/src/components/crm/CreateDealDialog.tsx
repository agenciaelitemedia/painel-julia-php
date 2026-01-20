import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Contact {
  id: string;
  name: string;
  phone: string;
}

interface CreateDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineId: string;
  onSubmit: (title: string, description: string, value: number | null, contactId: string | null, priority: string) => void;
  initialData?: any;
}

export function CreateDealDialog({
  open,
  onOpenChange,
  pipelineId,
  onSubmit,
  initialData,
}: CreateDealDialogProps) {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [priority, setPriority] = useState('medium');
  const [contactId, setContactId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    if (open && profile?.client_id) {
      loadContacts();
    }
    
    // Load initial data if editing
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setValue(initialData.value ? String(initialData.value) : '');
      setPriority(initialData.priority || 'medium');
      setContactId(initialData.contact_id || null);
    } else {
      // Reset form when creating new
      setTitle('');
      setDescription('');
      setValue('');
      setPriority('medium');
      setContactId(null);
    }
  }, [open, profile?.client_id, initialData]);

  const loadContacts = async () => {
    if (!profile?.client_id) return;

    const { data } = await supabase
      .from('contacts')
      .select('id, name, phone')
      .eq('client_id', profile.client_id)
      .order('name');

    setContacts(data || []);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    const numValue = value ? parseFloat(value) : null;
    onSubmit(title, description, numValue, contactId, priority);
    setTitle('');
    setDescription('');
    setValue('');
    setPriority('medium');
    setContactId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Card' : 'Novo Card'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do negócio"
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes do negócio"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="value">Valor (R$)</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="contact">Contato</Label>
            <Popover open={contactOpen} onOpenChange={setContactOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={contactOpen}
                  className="w-full justify-between"
                >
                  {contactId
                    ? contacts.find((contact) => contact.id === contactId)?.name
                    : "Selecione um contato"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar contato..." />
                  <CommandList>
                    <CommandEmpty>Nenhum contato encontrado.</CommandEmpty>
                    <CommandGroup>
                      {contacts.map((contact) => (
                        <CommandItem
                          key={contact.id}
                          value={`${contact.name} ${contact.phone}`}
                          onSelect={() => {
                            setContactId(contact.id);
                            setContactOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              contactId === contact.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {contact.name} - {contact.phone}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="priority">Prioridade</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            {initialData ? 'Salvar' : 'Criar Card'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
