# 🚀 Guia de Instalação - Docker Swarm + Supabase Cloud

## 📋 Visão Geral

Esta configuração utiliza:
- **Frontend + RabbitMQ**: Rodando no seu VPS via Docker Swarm
- **Banco de Dados**: Hospedado no Supabase Cloud (supabase.com)
- **Edge Functions**: Hospedadas no Supabase Cloud

## Vantagens desta Abordagem

✅ **Banco gerenciado**: Supabase Cloud cuida de backups, updates e manutenção  
✅ **Escalabilidade**: Fácil upgrade de plano conforme necessidade  
✅ **Monitoramento**: Dashboard completo do Supabase  
✅ **Custo-benefício**: Plano free disponível ou planos pagos a partir de $25/mês  
✅ **Menos recursos no VPS**: Não precisa rodar PostgreSQL localmente  

## 🎯 Pré-requisitos

### No Supabase Cloud
1. Conta no [Supabase](https://supabase.com)
2. Projeto criado
3. Credenciais anotadas (URL, Anon Key, Service Role Key)

### No VPS
- **CPU**: 2 cores (mínimo)
- **RAM**: 2GB (mínimo)
- **Disco**: 20GB SSD
- **OS**: Ubuntu 20.04+ / Debian 11+
- **Docker**: 20.10+
- **Domínio** apontando para o servidor

## 📖 Passo a Passo

### 1. Preparar Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Configurar firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 2377/tcp  # Docker Swarm
sudo ufw allow 7946/tcp  # Docker Swarm
sudo ufw allow 7946/udp
sudo ufw allow 4789/udp
sudo ufw enable
```

### 2. Configurar Projeto Supabase Cloud

#### a) Criar Projeto
1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique em "New Project"
3. Escolha nome, senha do banco e região
4. Aguarde criação (~2 minutos)

#### b) Obter Credenciais
No dashboard do projeto, vá em **Settings > API**:

- **URL**: `https://seu-projeto.supabase.co`
- **Project ID**: `seu-projeto-id` (na URL)
- **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **service_role**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

⚠️ **IMPORTANTE**: Nunca exponha a `service_role` key no frontend!

### 3. Clonar e Configurar Aplicação

```bash
# Clonar repositório
cd /opt
sudo git clone https://seu-repositorio.git app
cd app
sudo chown -R $USER:$USER .

# Copiar template de configuração
cp docker-cloud/.env.example .env

# Editar configurações
nano .env
```

#### Configurar .env:

```bash
# Seu domínio
SITE_URL=https://seudominio.com

# Credenciais do Supabase Cloud (obtidas no passo 2)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PROJECT_ID=seu-projeto-id
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# RabbitMQ (escolha senha forte)
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=senha_forte_aqui

# APIs WhatsApp (se aplicável)
VITE_UAZAP_API_URL=https://atende-julia.uazapi.com
UAZAP_ADMIN_TOKEN=seu_token

VITE_EVOLUTION_API_URL=https://evo001.atendejulia.com.br
VITE_EVOLUTION_API_TOKEN=seu_token
```

### 4. Aplicar Migrações no Supabase

Você tem duas opções:

#### Opção A: SQL Editor (Recomendado - Mais Fácil)

1. Acesse: [Dashboard > SQL Editor](https://supabase.com/dashboard/project/seu-projeto-id/editor)

2. Copie e execute cada arquivo em ordem:
   ```
   docker-cloud/migrations/001_initial_schema.sql
   docker-cloud/migrations/002_rls_policies.sql
   docker-cloud/migrations/003_functions.sql
   docker-cloud/migrations/004_indexes.sql
   ```

3. Execute um de cada vez, na ordem numérica

#### Opção B: Via Script (Avançado)

```bash
# Instalar cliente PostgreSQL
sudo apt install postgresql-client

# Executar script de migração
chmod +x docker-cloud/scripts/migrate-database.sh
./docker-cloud/scripts/migrate-database.sh

# Você precisará fornecer a Connection String
# Encontre em: Dashboard > Settings > Database > Connection String
```

### 5. Configurar Edge Functions (Opcional)

Se sua aplicação usa Edge Functions:

1. Instale Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login no Supabase:
   ```bash
   supabase login
   ```

3. Link ao projeto:
   ```bash
   supabase link --project-ref seu-projeto-id
   ```

4. Deploy das functions:
   ```bash
   supabase functions deploy
   ```

### 6. Deploy da Aplicação

```bash
# Tornar scripts executáveis
chmod +x docker-cloud/scripts/*.sh

# Inicializar Docker Swarm
./docker-cloud/scripts/init-swarm.sh

# Deploy da stack
./docker-cloud/scripts/deploy.sh
```

### 7. Verificar Instalação

```bash
# Health check
./docker-cloud/scripts/health-check.sh

# Ver logs
docker service logs -f app_frontend
docker service logs -f app_nginx

# Ver status
docker service ls
```

### 8. Configurar SSL (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install -y certbot

# Parar nginx temporariamente
docker service scale app_nginx=0

# Gerar certificado
sudo certbot certonly --standalone -d seudominio.com

# Copiar certificados
sudo mkdir -p docker-cloud/nginx/ssl
sudo cp /etc/letsencrypt/live/seudominio.com/fullchain.pem docker-cloud/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/seudominio.com/privkey.pem docker-cloud/nginx/ssl/key.pem
sudo chown -R $USER:$USER docker-cloud/nginx/ssl

# Reiniciar nginx
docker service scale app_nginx=1

# Renovação automática
sudo crontab -e
# Adicionar:
0 0 1 * * certbot renew --quiet && cp /etc/letsencrypt/live/seudominio.com/*.pem /opt/app/docker-cloud/nginx/ssl/
```

## 🔧 Gestão e Manutenção

### Acessar Aplicação
- **Frontend**: https://seudominio.com
- **RabbitMQ**: https://seudominio.com/rabbitmq
- **Supabase Dashboard**: https://supabase.com/dashboard/project/seu-projeto-id

### Monitoramento

```bash
# Verificar serviços locais
./docker-cloud/scripts/health-check.sh

# Ver logs em tempo real
docker service logs -f app_frontend

# Métricas de recursos
docker stats
```

### Escalar Aplicação

```bash
# Escalar frontend para mais usuários
docker service scale app_frontend=5

# Voltar ao normal
docker service scale app_frontend=3
```

### Atualizar Aplicação

```bash
# Rebuild frontend com novas mudanças
docker build -t app-frontend:latest -f docker-cloud/frontend/Dockerfile .

# Atualizar serviço
docker service update --image app-frontend:latest app_frontend
```

## 📊 Planos Supabase Cloud

| Plano | Preço | Banco de Dados | Bandwidth | Storage |
|-------|-------|----------------|-----------|---------|
| **Free** | $0 | 500 MB | 5 GB | 1 GB |
| **Pro** | $25/mês | 8 GB | 250 GB | 100 GB |
| **Team** | $599/mês | 256 GB | 2 TB | 1 TB |

💡 **Dica**: Comece com Free, upgrade conforme necessidade.

## 🔒 Segurança

### Checklist Essencial
- [ ] Firewall configurado
- [ ] SSH com chave pública (desabilitar senha)
- [ ] SSL/TLS ativo (Let's Encrypt)
- [ ] Service Role Key NUNCA exposta no frontend
- [ ] RLS (Row Level Security) ativo no Supabase
- [ ] Senhas fortes no .env
- [ ] Backup automático configurado no Supabase

### Configurações no Supabase

1. **Habilitar RLS** em todas as tabelas:
   - Dashboard > Table Editor > selecionar tabela
   - Settings > Enable RLS

2. **Configurar políticas** de acesso

3. **Email verification**:
   - Dashboard > Authentication > Email Auth
   - Enable email confirmation

## ⚠️ Troubleshooting

### Erro: Cannot connect to Supabase

```bash
# Testar conexão
curl -H "apikey: SUA_ANON_KEY" https://seu-projeto.supabase.co/rest/v1/

# Verificar credenciais no .env
cat .env | grep SUPABASE
```

### Erro: Frontend não carrega

```bash
# Ver logs do frontend
docker service logs app_frontend

# Verificar build
docker build -t app-frontend:latest -f docker-cloud/frontend/Dockerfile .
```

### Problema: Edge Functions não funcionam

1. Verifique deploy: `supabase functions list`
2. Ver logs: Dashboard > Edge Functions > selecionar function > Logs
3. Redeploy: `supabase functions deploy nome-da-function`

## 💰 Estimativa de Custos

### Custo Mensal Total

| Item | Custo |
|------|-------|
| **VPS** (2 CPU, 2GB RAM) | $5-10 |
| **Supabase Free** | $0 |
| **Domínio** | ~$1 |
| **Total (mínimo)** | **$6-11/mês** |

Com Supabase Pro:
| Item | Custo |
|------|-------|
| VPS | $5-10 |
| **Supabase Pro** | $25 |
| Domínio | ~$1 |
| **Total** | **$31-36/mês** |

## 📚 Recursos Úteis

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Docker Swarm Guide](https://docs.docker.com/engine/swarm/)
- [Let's Encrypt](https://letsencrypt.org/)

## 🆘 Suporte

### Logs para Debug
```bash
# Serviços locais
docker service logs app_frontend
docker service logs app_rabbitmq

# Supabase (via Dashboard)
Dashboard > Logs > API, Database, Realtime
```

### Comandos Úteis
```bash
# Reiniciar stack completa
docker stack rm app
sleep 10
./docker-cloud/scripts/deploy.sh

# Ver recursos utilizados
docker stats

# Limpar recursos não usados
docker system prune -f
```

---

**Versão**: 1.0 (Supabase Cloud)  
**Última atualização**: Janeiro 2025
