# Arquitetura Multi-Tenant - Sistema SAAS

## Visão Geral

Este sistema foi arquitetado como uma plataforma SAAS multi-tenant, onde cada cliente (empresa) possui seus dados completamente isolados dos demais.

## Modelo de Dados

### Hierarquia de Entidades

```
ADMIN (Super usuário)
└── CLIENTE (Empresa/Tenant)
    ├── USUÁRIOS (Membros da equipe)
    ├── INSTÂNCIAS WHATSAPP (Conexões)
    ├── CONTATOS
    ├── MENSAGENS
    ├── CRM (Deals, Pipelines)
    └── CONFIGURAÇÕES
```

### Tabelas Principais

Todas as tabelas de dados de negócio possuem `client_id` como coluna obrigatória (NOT NULL):

- **clients**: Empresas cadastradas no sistema
- **whatsapp_instances**: Conexões WhatsApp de cada cliente
- **contacts**: Contatos de cada cliente
- **messages**: Mensagens de cada cliente
- **crm_deals**: Negociações CRM de cada cliente
- **crm_pipelines**: Funis CRM de cada cliente
- **settings**: Configurações específicas de cada cliente

## Segurança e Isolamento

### Row Level Security (RLS)

Todas as tabelas implementam políticas RLS baseadas em `client_id`:

```sql
-- Exemplo de política RLS multi-tenant
CREATE POLICY "Multi-tenant: view contacts" ON contacts
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    (client_id = get_user_client_id(auth.uid()))
  );
```

### Funções de Segurança

- `get_user_client_id(user_id)`: Retorna o client_id do usuário
- `has_role(user_id, role)`: Verifica se o usuário tem determinada função

### Níveis de Acesso

1. **Admin**: Acesso total a todos os dados de todos os clientes
2. **Client** (Proprietário): Acesso total aos dados de sua empresa
3. **Team Member**: Acesso aos dados conforme permissões definidas

## Fluxo de Dados

### Webhook WhatsApp

O webhook recebe mensagens do WhatsApp e:
1. Identifica o `client_id` através do `api_token` da instância
2. Cria ou atualiza contatos com o `client_id` correto
3. Salva mensagens associadas ao `client_id`

```typescript
// Exemplo de criação de contato no webhook
const { data: instance } = await supabase
  .from('whatsapp_instances')
  .select('client_id, id')
  .eq('api_token', instanceToken)
  .maybeSingle();

await supabase.from('contacts').insert({
  phone,
  name,
  client_id: instance.client_id, // Isolamento garantido
  instance_id: instance.id
});
```

### Frontend

Todas as queries do frontend filtram automaticamente por `client_id` através das políticas RLS:

```typescript
// A query abaixo automaticamente filtra por client_id do usuário logado
const { data: contacts } = await supabase
  .from('contacts')
  .select('*');
// RLS garante que apenas contatos do cliente são retornados
```

## Performance

### Índices Implementados

Para otimizar queries por `client_id`:

```sql
CREATE INDEX idx_contacts_client_id ON contacts(client_id);
CREATE INDEX idx_messages_client_id ON messages(client_id);
CREATE INDEX idx_whatsapp_instances_client_id ON whatsapp_instances(client_id);
```

## Escalabilidade

### Vantagens da Arquitetura

1. **Isolamento Total**: Cada cliente não tem acesso aos dados de outros
2. **Segurança em Camadas**: RLS + Funções SECURITY DEFINER
3. **Performance**: Índices otimizados por tenant
4. **Simplicidade**: Modelo single-database facilita manutenção
5. **Flexibilidade**: Fácil adicionar novos recursos por tenant

### Limitações e Considerações

- Limite de linhas por tabela: Supabase suporta milhões de registros
- Para escala massiva (centenas de milhares de clientes), considerar particionamento
- Backup e restore afetam todos os clientes simultaneamente

## Administração

### Gestão de Clientes

Apenas usuários com role `admin` podem:
- Criar novos clientes
- Visualizar dados de qualquer cliente
- Gerenciar permissões globais

### Gestão de Equipe

Cada cliente pode:
- Criar membros de equipe
- Definir permissões por módulo
- Gerenciar suas próprias configurações

## Módulos do Sistema

Cada cliente pode ter acesso a diferentes módulos:

- **Chat**: Atendimento via WhatsApp
- **CRM**: Gestão de vendas
- **Contacts**: Gerenciamento de contatos
- **Connections**: Gerenciamento de instâncias WhatsApp
- **Team**: Gestão de equipe
- **Settings**: Configurações

Permissões são controladas através da tabela `client_permissions`.

## Auditoria e Logs

- Todas as tabelas possuem `created_at` e `updated_at`
- Triggers automáticos atualizam `updated_at`
- Logs de autenticação via Supabase Auth
- Logs de webhook para rastreamento de mensagens

## Manutenção

### Limpeza de Dados

```sql
-- Exemplo: Deletar dados de um cliente específico
DELETE FROM contacts WHERE client_id = 'uuid-do-cliente';
-- Cascade automático deletará mensagens relacionadas
```

### Migração de Dados

Para migrar dados entre clientes:

```sql
UPDATE contacts 
SET client_id = 'novo-client-id' 
WHERE client_id = 'antigo-client-id';
```

## Monitoramento

### Métricas Importantes

- Número de contatos por cliente
- Volume de mensagens por cliente
- Instâncias ativas por cliente
- Taxa de crescimento por tenant

### Alertas Recomendados

- Cliente atingindo limite de instâncias
- Volume anormal de mensagens
- Falhas no webhook
- Tentativas de acesso não autorizado
