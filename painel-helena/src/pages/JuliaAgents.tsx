import { useState, useMemo } from "react";
import { useExternalDbQuery } from "@/hooks/useExternalDbQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Bot, Activity, MoreHorizontal, Search, ArrowUpDown, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { CreateJuliaAgentTabbedDialog, JuliaAgentFormData } from "@/components/agents/CreateJuliaAgentTabbedDialog";

interface ViewClient {
  id_client: number;
  uuid: string;
  status: boolean;
  name: string;
  business_name: string | null;
  federal_id: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  zip_code: string | null;
  client_created_at: string;
  client_updated_at: string;
  id: number;
  client_id: number;
  agent_id: number | null;
  cod_agent: number | null;
  plan: string;
  due_date: string | null;
  limit: number;
  used: number;
  last_used: string | null;
  created_at: string;
  updated_at: string;
  alert_send: boolean;
  total_last_used: number;
  total_last_used_text: number;
  total_last_used_audio: number;
  total_last_used_video: number;
}

type SortField = 'status' | 'cod_agent' | 'name' | 'plan' | 'used' | 'last_used' | 'due_date';
type SortOrder = 'asc' | 'desc';

export default function JuliaAgents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('created_at' as any);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const itemsPerPage = 20;

  const { data: clients, isLoading, error } = useExternalDbQuery<ViewClient>(
    'julia-clients-list',
    'SELECT id_client, uuid, status, name, business_name, federal_id, email, phone, country, state, city, zip_code, client_created_at, client_updated_at, id, client_id, agent_id, cod_agent, plan, due_date, "limit", used, last_used, created_at, updated_at, alert_send, total_last_used, total_last_used_text, total_last_used_audio, total_last_used_video FROM public.view_clients ORDER BY created_at DESC'
  );

  const filteredAndSortedClients = useMemo(() => {
    if (!clients) return [];

    let filtered = clients.filter(client => {
      const searchLower = searchTerm.toLowerCase();
      return (
        client.name?.toLowerCase().includes(searchLower) ||
        client.business_name?.toLowerCase().includes(searchLower) ||
        client.cod_agent?.toString().includes(searchLower) ||
        client.plan?.toLowerCase().includes(searchLower)
      );
    });

    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (aVal === null) aVal = '';
      if (bVal === null) bVal = '';

      if (sortField === 'used') {
        aVal = a.used || 0;
        bVal = b.used || 0;
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [clients, searchTerm, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedClients.length / itemsPerPage);
  const paginatedClients = filteredAndSortedClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getUsageColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getUsageBarColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPlanColor = (plan: string) => {
    const planLower = plan?.toLowerCase() || '';
    if (planLower.includes('ultra')) return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    if (planLower.includes('start')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  const handleCreateAgent = (data: JuliaAgentFormData) => {
    console.log("Creating agent with data:", data);
    // TODO: Integrar com o hook useJuliaAgents para criar o agente
    // TODO: Mapear os dados do formulário para os campos do banco
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-destructive mb-2">Erro ao carregar agents</h3>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-destructive mb-2">Erro ao carregar clientes</h3>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8" />
            Agents da Julia
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerenciamento de clients e agents do banco externo
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search:"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Agente
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : paginatedClients && paginatedClients.length > 0 ? (
        <>
          <div className="flex justify-center items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              D
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 3) {
                pageNum = i + 1;
              } else if (currentPage === 1) {
                pageNum = i + 1;
              } else if (currentPage === totalPages) {
                pageNum = totalPages - 2 + i;
              } else {
                pageNum = currentPage - 1 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="icon"
                  onClick={() => setCurrentPage(pageNum)}
                  className={currentPage === pageNum ? "rounded-full" : ""}
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[80px]">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('status')}
                        className="h-8 px-2"
                      >
                        Status
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('cod_agent')}
                        className="h-8 px-2"
                      >
                        Cod. Agente
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('name')}
                        className="h-8 px-2"
                      >
                        Nome/Escritório
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('plan')}
                        className="h-8 px-2"
                      >
                        Plano
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[180px]">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('used')}
                        className="h-8 px-2"
                      >
                        Limite/Uso
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('last_used')}
                        className="h-8 px-2"
                      >
                        Last
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('due_date')}
                        className="h-8 px-2"
                      >
                        Venci.
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right w-[80px]">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map((client) => {
                    const usagePercentage = client.limit ? ((client.used || 0) / client.limit) * 100 : 0;
                    const isActive = client.status === true;
                    console.log('Client status:', client.cod_agent, client.status, 'isActive:', isActive);
                    return (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Switch 
                              checked={isActive} 
                              disabled
                              className={isActive ? 'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500' : 'opacity-40'}
                            />
                          </div>
                        </TableCell>
                      <TableCell className="font-mono font-medium">{client.cod_agent || '-'}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          {client.business_name && (
                            <div className="text-sm text-muted-foreground">{client.business_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPlanColor(client.plan)}>
                          {client.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className={`text-sm font-medium ${getUsageColor(client.used || 0, client.limit || 1)}`}>
                            {(client.used || 0).toLocaleString()}/{(client.limit || 0).toLocaleString()}
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full transition-all ${getUsageBarColor(client.used || 0, client.limit || 1)}`}
                              style={{ width: `${Math.min(100, usagePercentage)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.last_used ? (
                          <div className="text-sm">
                            {new Date(client.last_used).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.due_date ? (
                          <div className="text-sm">
                            Dia {new Date(client.due_date).getDate()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </>
    ) : (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bot className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">
            {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum cliente encontrado'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {searchTerm 
              ? 'Tente ajustar os termos de busca' 
              : 'Não há clientes cadastrados no banco externo'
            }
          </p>
        </CardContent>
      </Card>
    )}

    <CreateJuliaAgentTabbedDialog
      open={createDialogOpen}
      onOpenChange={setCreateDialogOpen}
      onCreateAgent={handleCreateAgent}
    />
  </div>
);
}
