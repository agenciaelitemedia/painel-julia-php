# 🚀 Deploy Rápido - Docker Swarm + Supabase Cloud

## Quick Start (10 minutos)

### 1. Preparar Servidor

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Criar Projeto no Supabase

1. Acesse: https://supabase.com/dashboard
2. Clique em "New Project"
3. Anote: URL, Project ID, Anon Key, Service Role Key

### 3. Configurar Aplicação

```bash
# Clonar
git clone https://seu-repositorio.git app
cd app

# Configurar
cp docker-cloud/.env.example .env
nano .env  # Adicione suas credenciais do Supabase
```

### 4. Aplicar Migrações

**SQL Editor (Mais fácil)**:
1. Acesse: https://supabase.com/dashboard/project/SEU_ID/editor
2. Copie e execute cada arquivo SQL de `docker-cloud/migrations/`

### 5. Deploy

```bash
chmod +x docker-cloud/scripts/*.sh
./docker-cloud/scripts/init-swarm.sh
./docker-cloud/scripts/deploy.sh
```

## 🏗️ Arquitetura

```
┌─────────────────────────────────┐
│      VPS (Docker Swarm)         │
│  ┌──────────┐   ┌───────────┐  │
│  │  Nginx   │   │  Frontend │  │
│  │ (Proxy)  │   │  (React)  │  │
│  └────┬─────┘   └───────────┘  │
│       │                         │
│  ┌────┴─────┐                   │
│  │ RabbitMQ │                   │
│  └──────────┘                   │
└─────────────────────────────────┘
              │
              │ Internet
              │
┌─────────────▼───────────────────┐
│     Supabase Cloud              │
│  ┌──────────────────────────┐   │
│  │  PostgreSQL Database     │   │
│  ├──────────────────────────┤   │
│  │  Authentication (Auth)   │   │
│  ├──────────────────────────┤   │
│  │  Realtime                │   │
│  ├──────────────────────────┤   │
│  │  Storage                 │   │
│  ├──────────────────────────┤   │
│  │  Edge Functions          │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

## 📋 Checklist Essencial

### Antes do Deploy
- [ ] Projeto criado no Supabase Cloud
- [ ] Credenciais anotadas (URL, Keys)
- [ ] VPS com Docker instalado
- [ ] Domínio apontando para VPS
- [ ] Arquivo .env configurado

### Após Deploy
- [ ] Migrações aplicadas no Supabase
- [ ] RLS habilitado nas tabelas
- [ ] SSL configurado (Let's Encrypt)
- [ ] Health check passando
- [ ] Edge Functions deployed (se aplicável)

## 🔑 Variáveis Obrigatórias (.env)

```bash
# Aplicação
SITE_URL=https://seudominio.com

# Supabase Cloud
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PROJECT_ID=seu-projeto-id
VITE_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# RabbitMQ
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=senha_forte
```

## 🎛️ Comandos Essenciais

```bash
# Deploy/Redeploy
./docker-cloud/scripts/deploy.sh

# Health Check
./docker-cloud/scripts/health-check.sh

# Ver Logs
docker service logs -f app_frontend
docker service logs -f app_nginx

# Escalar
docker service scale app_frontend=5

# Atualizar
docker service update --force app_frontend

# Remover tudo
docker stack rm app
```

## 🌐 SSL (Let's Encrypt)

```bash
sudo apt install -y certbot
docker service scale app_nginx=0

sudo certbot certonly --standalone -d seudominio.com

sudo mkdir -p docker-cloud/nginx/ssl
sudo cp /etc/letsencrypt/live/seudominio.com/fullchain.pem docker-cloud/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/seudominio.com/privkey.pem docker-cloud/nginx/ssl/key.pem
sudo chown -R $USER:$USER docker-cloud/nginx/ssl

docker service scale app_nginx=1
```

## 💰 Custos Estimados

| Recurso | Custo Mensal |
|---------|--------------|
| VPS (2GB RAM) | $5-10 |
| Supabase Free | $0 |
| **Total Mínimo** | **$5-10** |

Com Supabase Pro: $30-35/mês

## 🔧 Troubleshooting Rápido

### Não conecta ao Supabase
```bash
# Testar
curl -H "apikey: SUA_ANON_KEY" https://seu-projeto.supabase.co/rest/v1/

# Verificar .env
cat .env | grep SUPABASE
```

### Frontend não carrega
```bash
docker service logs app_frontend
docker service update --force app_frontend
```

### Reset completo
```bash
docker stack rm app
sleep 10
./docker-cloud/scripts/deploy.sh
```

## 📊 Recursos do VPS

| Cenário | CPU | RAM | Disco |
|---------|-----|-----|-------|
| Mínimo | 1 core | 2GB | 20GB |
| Recomendado | 2 cores | 4GB | 40GB |
| Alto tráfego | 4 cores | 8GB | 80GB |

## 🔗 Links Rápidos

- [Documentação Completa](./INSTALL.md)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase Docs](https://supabase.com/docs)
- [Docker Swarm Docs](https://docs.docker.com/engine/swarm/)

## ⚡ Dicas Pro

1. **Comece com Supabase Free**: Upgrade só quando necessário
2. **Use CDN**: CloudFlare para static assets
3. **Monitore**: Configure alerts no Supabase Dashboard
4. **Backup**: Supabase Cloud faz backup automático
5. **Escale horizontal**: Adicione nodes ao Swarm quando crescer

---

**Dúvidas?** Consulte [INSTALL.md](./INSTALL.md) para guia detalhado.
