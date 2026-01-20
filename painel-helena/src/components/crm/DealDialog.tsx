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
import { Deal } from '@/hooks/useCRMData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Contact {
  id: string;
  name: string;
  phone: string;
}

interface DealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineId?: string;
  deal?: Deal;
  onSave: (
    pipelineId: string,
    title: string,
    contactId?: string,
    description?: string,
    value?: number
  ) => void;
  onUpdate?: (dealId: string, updates: Partial<Deal>) => void;
}

export function DealDialog({
  open,
  onOpenChange,
  pipelineId,
  deal,
  onSave,
  onUpdate,
}: DealDialogProps) {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [priority, setPriority] = useState('medium');
  const [contactId, setContactId] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (deal) {
      setTitle(deal.title);
      setDescription(deal.description || '');
      setValue(deal.value ? String(deal.value) : '');
      setPriority(deal.priority);
      setContactId(deal.contact_id || '');
    } else {
      setTitle('');
      setDescription('');
      setValue('');
      setPriority('medium');
      setContactId('');
    }
  }, [deal]);

  useEffect(() => {
    if (open && profile?.client_id) {
      loadContacts();
    }
  }, [open, profile?.client_id]);

  const loadContacts = async () => {
    if (!profile?.client_id) return;

    const { data } = await supabase
      .from('contacts')
      .select('id, name, phone')
      .eq('client_id', profile.client_id)
      .order('name');

    if (data) {
      setContacts(data);
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;

    if (deal && onUpdate) {
      onUpdate(deal.id, {
        title,
        description: description || null,
        value: value ? parseFloat(value) : null,
        priority,
        contact_id: contactId || null,
      });
    } else if (pipelineId) {
      onSave(
        pipelineId,
        title,
        contactId || undefined,
        description || undefined,
        value ? parseFloat(value) : undefined
      );
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{deal ? 'Editar Negócio' : 'Novo Negócio'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título do negócio"
            />
          </div>

          <div>
            <Label htmlFor="contact">Contato</Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um contato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum contato</SelectItem>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name} - {contact.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva os detalhes do negócio"
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
          <Button onClick={handleSave} disabled={!title.trim()}>
            {deal ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
