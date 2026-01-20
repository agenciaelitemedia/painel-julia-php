# 🚀 Guia de Instalação - Portainer + Traefik + Supabase Cloud

## 📋 Pré-requisitos

### Infraestrutura
- ✅ VPS com Docker Swarm configurado
- ✅ Portainer instalado e funcionando
- ✅ Traefik configurado como reverse proxy
- ✅ Network `traefik-public` criada
- ✅ Domínio apontando para o servidor

### Recursos Mínimos
- **RAM:** 4GB
- **CPU:** 2 cores
- **Disco:** 50GB SSD
- **Rede:** IP público fixo

### Serviços Externos
- ✅ Conta no Supabase Cloud (https://supabase.com)
- ✅ Projeto criado no Supabase
- ✅ Credenciais do projeto (URL, Keys)

---

## 🎯 Passo a Passo

### 1️⃣ Criar Projeto no Supabase Cloud

1. **Acessar Supabase**
   - Acesse: https://supabase.com
   - Faça login ou crie uma conta

2. **Criar Novo Projeto**
   ```
   - Clique em "New Project"
   - Nome do projeto: ex. "masterchat-prod"
   - Database Password: crie uma senha forte
   - Region: escolha a mais próxima (South America - São Paulo)
   - Plan: Free ou Pro (conforme necessidade)
   ```

3. **Aguardar Provisionamento**
   - Aguarde ~2 minutos até o projeto estar pronto
   - Status mudará para "Active"

4. **Coletar Credenciais**
   - Vá em: Settings → API
   - Anote:
     - `Project URL`: https://seu-projeto.supabase.co
     - `Project ID`: seu-projeto-id
     - `anon public`: sua chave pública
     - `service_role`: sua chave privada (⚠️ mantenha segura!)

---

### 2️⃣ Aplicar Migrações no Banco de Dados

#### Opção A: SQL Editor (Recomendado)

1. **Acessar SQL Editor**
   ```
   Supabase Dashboard → SQL Editor → New Query
   ```

2. **Copiar Arquivos de Migração**
   - Acesse a pasta: `docker-traefik-cloud/migrations/`
   - Execute os arquivos na ordem:
     - `001_initial_schema.sql`
     - `002_rls_policies.sql`
     - `003_functions.sql`
     - `004_indexes.sql`
     - `005_edge_functions.sql`

3. **Executar Cada Migração**
   - Cole o conteúdo do arquivo
   - Clique em "Run" ou `Ctrl+Enter`
   - Aguarde conclusão (✓ Success)
   - Repita para cada arquivo

#### Opção B: CLI do Supabase (Avançado)

```bash
# Instalar CLI
npm install -g supabase

# Fazer login
supabase login

# Linkar projeto
supabase link --project-ref seu-projeto-id

# Aplicar migrações
supabase db push
```

---

### 3️⃣ Configurar Edge Functions (Opcional)

Se você usa Edge Functions no projeto:

1. **Acessar Edge Functions**
   ```
   Supabase Dashboard → Edge Functions
   ```

2. **Deploy das Functions**
   ```bash
   # Instalar CLI se ainda não fez
   npm install -g supabase

   # Fazer login
   supabase login

   # Linkar projeto
   supabase link --project-ref seu-projeto-id

   # Deploy de todas as functions
   cd supabase/functions
   supabase functions deploy
   ```

3. **Configurar Secrets nas Functions**
   ```bash
   # Exemplo: OpenAI API Key
   supabase secrets set OPENAI_API_KEY=sk-seu-token-aqui
   
   # RabbitMQ
   supabase secrets set RABBITMQ_URL=amqp://admin:senha@seu-dominio:5672
   
   # Verificar secrets configurados
   supabase secrets list
   ```

---

### 4️⃣ Preparar Variáveis de Ambiente

1. **Criar arquivo .env**
   - Copie o template: `docker-traefik-cloud/.env.example`
   - Renomeie para `.env`

2. **Preencher Variáveis**

```bash
# ===== DOMÍNIO =====
DOMAIN=seudominio.com

# ===== SUPABASE CLOUD =====
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PROJECT_ID=seu-projeto-id
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ===== RABBITMQ =====
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=SenhaForte@2024
RABBITMQ_VHOST=/
RABBITMQ_QUEUE_NAME=julia_queue

# ===== APIs EXTERNAS =====
VITE_UAZAP_API_URL=https://atende-julia.uazapi.com
UAZAP_ADMIN_TOKEN=seu-token-uazap

VITE_EVOLUTION_API_URL=https://evo001.atendejulia.com.br
VITE_EVOLUTION_API_TOKEN=seu-token-evolution

# ===== OPENAI =====
OPENAI_API_KEY=sk-seu-token-openai
```

---

### 5️⃣ Deploy via Portainer

#### Preparar Stack File

1. **Acessar Portainer**
   ```
   https://seu-dominio:9443
   ```

2. **Ir para Stacks**
   ```
   Menu → Stacks → Add Stack
   ```

3. **Configurar Stack**
   - **Name:** `masterchat-app` (ou nome de sua preferência)
   - **Build method:** Web editor
   - **Web editor:** Cole o conteúdo de `docker-traefik-cloud/docker-compose.yml`

4. **Configurar Environment Variables**
   
   Clique em "Add an environment variable" e adicione **TODAS** as variáveis do arquivo `.env`:

   | Name | Value |
   |------|-------|
   | DOMAIN | seudominio.com |
   | VITE_SUPABASE_URL | https://seu-projeto.supabase.co |
   | VITE_SUPABASE_ANON_KEY | eyJhbGc... |
   | RABBITMQ_USER | admin |
   | RABBITMQ_PASSWORD | SenhaForte@2024 |
   | ... | ... |

   💡 **Dica:** Use a opção "Load variables from .env file" se disponível

#### Deploy da Stack

5. **Verificar Configurações**
   - ✅ Nome da stack correto
   - ✅ Todas as variáveis preenchidas
   - ✅ docker-compose.yml colado corretamente

6. **Deploy**
   ```
   Clique em "Deploy the stack"
   ```

7. **Aguardar Conclusão**
   - O Portainer irá:
     - Baixar as imagens Docker
     - Build da imagem do frontend
     - Criar os serviços
     - Conectar às networks
     - Configurar volumes

   ⏱️ Tempo estimado: 3-5 minutos

---

### 6️⃣ Verificar Deploy

#### No Portainer

1. **Acessar Stack**
   ```
   Stacks → masterchat-app
   ```

2. **Verificar Serviços**
   - Todos devem estar com status: ✅ **Running**
   - Réplicas: frontend (3/3), rabbitmq (1/1)

3. **Ver Logs**
   ```
   Clique em cada serviço → Logs
   ```

#### Via CLI (Opcional)

```bash
# Conectar no servidor via SSH
ssh usuario@seu-servidor

# Listar serviços
docker service ls

# Ver logs do frontend
docker service logs masterchat-app_frontend

# Ver logs do RabbitMQ
docker service logs masterchat-app_rabbitmq
```

---

### 7️⃣ Testar Aplicação

#### Frontend
```
https://seudominio.com
```

Deve carregar a aplicação normalmente.

#### RabbitMQ Management
```
https://seudominio.com/rabbitmq
```

Credenciais: as definidas em `RABBITMQ_USER` e `RABBITMQ_PASSWORD`

#### Health Check
```bash
curl https://seudominio.com/health
# Deve retornar: healthy
```

---

## 🔧 Configurações Adicionais

### SSL/TLS (Let's Encrypt)

Se o Traefik já está configurado com Let's Encrypt:
- ✅ Certificados serão gerados automaticamente
- ✅ Renovação automática

Se não estiver configurado:

```bash
# Adicionar certificado resolver no Traefik
# Edite o docker-compose.yml do Traefik:

command:
  - "--certificatesresolvers.letsencrypt.acme.email=seu-email@dominio.com"
  - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
  - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
```

### Firewall

Portas necessárias abertas:
```bash
# HTTP (para redirect)
sudo ufw allow 80/tcp

# HTTPS
sudo ufw allow 443/tcp

# RabbitMQ (se acesso externo necessário)
sudo ufw allow 5672/tcp
sudo ufw allow 15672/tcp
```

---

## 📊 Monitoramento

### Portainer Dashboard
- CPU, RAM, Network por serviço
- Logs em tempo real
- Restart de serviços

### Supabase Dashboard
- Queries do banco
- Auth logs
- API usage
- Storage usage

### RabbitMQ Management
```
https://seudominio.com/rabbitmq
```
- Mensagens em fila
- Conexões
- Throughput

---

## 🔄 Atualizações

### Atualizar Aplicação

1. **Build Nova Imagem**
   ```bash
   # No servidor ou CI/CD
   docker build -t app/frontend:v2 \
     -f docker-traefik-cloud/frontend/Dockerfile \
     --build-arg VITE_SUPABASE_URL=https://seu-projeto.supabase.co \
     .
   ```

2. **Atualizar via Portainer**
   ```
   Stacks → masterchat-app → Editor
   - Altere VERSION=v2
   - Clique em "Update the stack"
   ```

### Rolling Update (Zero Downtime)

O Docker Swarm fará update gradual:
- Para 1 réplica
- Inicia nova versão
- Se OK, continua com as outras
- Se falhar, rollback automático

---

## 🆘 Troubleshooting

### Serviço não inicia

```bash
# Ver logs
docker service logs masterchat-app_frontend --tail 100

# Ver eventos
docker service ps masterchat-app_frontend --no-trunc
```

### Erro de conexão com Supabase

1. **Verificar credenciais**
   - URL correta?
   - Keys corretas?

2. **Testar conexão**
   ```bash
   curl https://seu-projeto.supabase.co/rest/v1/
   ```

3. **Verificar CORS no Supabase**
   ```
   Dashboard → Settings → API → URL Configuration
   Adicione: https://seudominio.com
   ```

### RabbitMQ não conecta

```bash
# Verificar se está rodando
docker service ps masterchat-app_rabbitmq

# Ver logs
docker service logs masterchat-app_rabbitmq

# Testar conexão
curl http://localhost:15672/api/overview
```

### SSL não funciona

1. **Verificar labels do Traefik**
2. **Verificar DNS apontando corretamente**
3. **Ver logs do Traefik**
   ```bash
   docker service logs traefik
   ```

---

## 📚 Recursos Adicionais

### Documentação
- [Docker Swarm](https://docs.docker.com/engine/swarm/)
- [Portainer](https://docs.portainer.io/)
- [Traefik](https://doc.traefik.io/traefik/)
- [Supabase](https://supabase.com/docs)

### Backup

#### Banco de Dados
- Supabase Cloud faz backup automático
- Acesse: Dashboard → Database → Backups

#### Dados da Aplicação
```bash
# Backup volumes
docker run --rm -v masterchat-app_rabbitmq-data:/data \
  -v $(pwd):/backup alpine tar czf /backup/rabbitmq-backup.tar.gz /data
```

---

## 🎉 Conclusão

Sua aplicação está rodando com:
- ✅ Frontend React/Vite escalável (3 réplicas)
- ✅ RabbitMQ para filas de mensagens
- ✅ Supabase Cloud como backend
- ✅ Traefik para SSL automático
- ✅ Portainer para gestão visual
- ✅ Docker Swarm para alta disponibilidade

**Acesse:** https://seudominio.com 🚀
