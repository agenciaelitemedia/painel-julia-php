import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Settings as SettingsIcon, Trash2, DollarSign, Shield } from 'lucide-react';

interface Client {
  id: string;
  client_code?: string;
  name: string;
  email: string;
  cpf_cnpj?: string;
  whatsapp_phone?: string;
  max_connections: number;
  max_team_members: number;
  max_agents: number;
  max_julia_agents: number;
  max_monthly_contacts: number;
  is_active: boolean;
  created_at: string;
  julia_agent_codes?: string[];
  release_customization?: boolean;
}

interface ClientCardProps {
  client: Client;
  clientRole?: string;
  currentUserId?: string;
  onToggleStatus: (clientId: string, currentStatus: boolean) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onNavigateBilling: (clientId: string) => void;
}

export function ClientCard({
  client,
  clientRole,
  currentUserId,
  onToggleStatus,
  onEdit,
  onDelete,
  onNavigateBilling,
}: ClientCardProps) {
  const isAdmin = clientRole === 'admin';
  const isCurrentUser = currentUserId === client.id;

  const formatPhone = (phone: string | undefined) => {
    if (!phone) return '-';
    // Formato brasileiro: 5534988860163 -> +55 (34) 98886-0163
    if (phone.startsWith('55') && phone.length === 13) {
      const ddd = phone.slice(2, 4);
      const num = phone.slice(4);
      return `+55 (${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
    }
    return `+${phone}`;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
            isAdmin ? 'bg-amber-500/10' : 'bg-primary/10'
          }`}>
            {isAdmin ? (
              <Shield className="h-5 w-5 text-amber-500" />
            ) : (
              <Users className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{client.name}</CardTitle>
            <CardDescription>{client.email}</CardDescription>
            <div className="flex items-center gap-2 justify-end mt-2">
              {isAdmin && (
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  Admin
                </Badge>
              )}
              <Badge variant={client.is_active ? "default" : "secondary"}>
                {client.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 flex-1 min-h-64">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Conexões permitidas:</span>
          <span className="font-semibold">{client.max_connections}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Membros da equipe:</span>
          <span className="font-semibold">{client.max_team_members === 0 ? 'Ilimitado' : client.max_team_members}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Agentes da Jul.IA:</span>
          <span className="font-semibold">{client.max_agents}</span>
        </div>
        {client.client_code && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Código:</span>
            <span className="font-semibold">{client.client_code}</span>
          </div>
        )}
        {client.cpf_cnpj && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">CPF/CNPJ:</span>
            <span className="font-semibold">{client.cpf_cnpj}</span>
          </div>
        )}
        {client.whatsapp_phone && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">WhatsApp:</span>
            <span className="font-semibold">{formatPhone(client.whatsapp_phone)}</span>
          </div>
        )}
        <div className="flex flex-col gap-2 mt-auto pt-4 border-t">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onToggleStatus(client.id, client.is_active)}
              className="flex-1"
              disabled={isCurrentUser}
            >
              {client.is_active ? 'Desativar' : 'Ativar'}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onEdit(client)}
              className="flex-1"
            >
              <SettingsIcon className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(client)}
              disabled={isCurrentUser || isAdmin}
              title={isCurrentUser ? 'Você não pode excluir seu próprio cadastro' : isAdmin ? 'Não é permitido excluir administradores' : ''}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Button
            size="sm"
            onClick={() => onNavigateBilling(client.id)}
            className="w-full"
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Faturamento
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
