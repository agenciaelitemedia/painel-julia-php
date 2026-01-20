import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Users, Search, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWhatsAppData } from '@/context/WhatsAppDataContext';
import { Contact } from '@/types/chat';

const CONTACTS_PER_PAGE = 50;

export default function Contacts() {
  const navigate = useNavigate();
  const { contacts, loading } = useWhatsAppData();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('individual');

  // Separate individual contacts and groups, sort alphabetically
  const individualContacts = contacts
    .filter(contact => !contact.isGroup)
    .sort((a, b) => {
      const nameA = (a.name || a.phone).toLowerCase();
      const nameB = (b.name || b.phone).toLowerCase();
      return nameA.localeCompare(nameB, 'pt-BR');
    });

  const groupContacts = contacts
    .filter(contact => contact.isGroup)
    .sort((a, b) => {
      const nameA = (a.name || a.phone).toLowerCase();
      const nameB = (b.name || b.phone).toLowerCase();
      return nameA.localeCompare(nameB, 'pt-BR');
    });

  // Get current tab contacts
  const currentContacts = activeTab === 'individual' ? individualContacts : groupContacts;

  // Filter by search query
  const filteredContacts = currentContacts.filter(contact => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return true;
    
    const name = (contact.name || '').toLowerCase();
    const phone = contact.phone.toLowerCase();
    
    return name.includes(searchLower) || phone.includes(searchLower);
  });

  // Pagination
  const totalPages = Math.ceil(filteredContacts.length / CONTACTS_PER_PAGE);
  const startIndex = (currentPage - 1) * CONTACTS_PER_PAGE;
  const endIndex = startIndex + CONTACTS_PER_PAGE;
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

  // Reset to page 1 when search or tab changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
    setSearchQuery('');
  };

  const handleOpenChat = (contact: Contact) => {
    navigate('/chat', { state: { selectedContact: contact } });
  };

  const getDisplayName = (contact: Contact) => {
    return contact.name || contact.phone;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando contatos...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Contatos</h1>
        <p className="text-muted-foreground">
          Lista de todos os contatos que enviaram mensagens
        </p>
      </div>

      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="individual" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Contatos
                <span className="ml-1 text-xs text-muted-foreground">
                  ({individualContacts.length})
                </span>
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Grupos
                <span className="ml-1 text-xs text-muted-foreground">
                  ({groupContacts.length})
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeTab === 'individual' ? <User className="h-5 w-5" /> : <Users className="h-5 w-5" />}
              Total: {filteredContacts.length}
            </div>
          </CardTitle>
          
          {/* Search Input */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou número..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {paginatedContacts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? 'Nenhum contato encontrado' : 'Nenhum contato disponível'}
              </p>
            ) : (
              paginatedContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={contact.avatar} alt={contact.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getDisplayName(contact).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col">
                      <h3 className="font-semibold text-sm">
                        {getDisplayName(contact)}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        +{contact.phone}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenChat(contact)}
                    className="p-3 rounded-full bg-[#25D366] hover:bg-[#1ebe57] transition-colors text-white"
                    title="Abrir conversa"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredContacts.length)} de {filteredContacts.length} contatos
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
