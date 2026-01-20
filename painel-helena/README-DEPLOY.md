# 🚀 Guia Rápido de Deploy - Docker Swarm

## Quick Start (5 minutos)

### 1. Preparar Servidor

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. Configurar Aplicação

```bash
# Clonar repositório
git clone https://seu-repositorio.git app
cd app

# Copiar e editar configurações
cp docker/.env.example .env
nano .env  # Configure SITE_URL, POSTGRES_PASSWORD, etc.

# Gerar chaves
./docker/scripts/generate-keys.sh
```

### 3. Deploy

```bash
# Tornar scripts executáveis
chmod +x docker/scripts/*.sh

# Inicializar Swarm e fazer deploy
./docker/scripts/init-swarm.sh
./docker/scripts/deploy.sh
```

### 4. Verificar

```bash
# Verificar serviços
./docker/scripts/health-check.sh

# Acessar aplicação
# http://seu-ip/
```

## Arquitetura

```
┌─────────────────────────────────────────────┐
│              NGINX (Reverse Proxy)          │
│           SSL/TLS - Load Balancer           │
└─────────────┬───────────────────────────────┘
              │
      ┌───────┴────────┐
      │                │
┌─────▼─────┐    ┌────▼─────────────────┐
│  Frontend │    │   Supabase Stack     │
│  (React)  │    │  ┌──────────────┐    │
│  3 nodes  │    │  │  Kong API    │    │
└───────────┘    │  │  Gateway     │    │
                 │  └──────┬───────┘    │
                 │         │            │
                 │  ┌──────▼───────┐    │
                 │  │  Auth        │    │
                 │  │  (GoTrue)    │    │
                 │  └──────────────┘    │
                 │  ┌──────────────┐    │
                 │  │  Realtime    │    │
                 │  └──────────────┘    │
                 │  ┌──────────────┐    │
                 │  │  Storage     │    │
                 │  └──────────────┘    │
                 │  ┌──────────────┐    │
                 │  │  PostgREST   │    │
                 │  └──────┬───────┘    │
                 │         │            │
                 │  ┌──────▼───────┐    │
                 │  │  PostgreSQL  │    │
                 │  │  (Database)  │    │
                 │  └──────────────┘    │
                 └────────────────────────┘
┌──────────────────────────────────────┐
│          RabbitMQ Message Queue      │
└──────────────────────────────────────┘
```

## Serviços e Portas

| Serviço | Porta Externa | Porta Interna | Replicas |
|---------|---------------|---------------|----------|
| Nginx | 80, 443 | 80, 443 | 1 |
| Frontend | - | 80 | 3 |
| Kong API Gateway | 8000, 8443 | 8000, 8443 | 2 |
| PostgreSQL | - | 5432 | 1 |
| Supabase Auth | - | 9999 | 2 |
| Supabase Realtime | - | 4000 | 2 |
| Supabase Storage | - | 5000 | 2 |
| PostgREST | - | 3000 | 3 |
| Edge Functions | - | 9000 | 2 |
| RabbitMQ | 5672, 15672 | 5672, 15672 | 1 |

## Variáveis de Ambiente Principais

```bash
# Essenciais
SITE_URL=https://seudominio.com
POSTGRES_PASSWORD=senha_forte_aqui
JWT_SECRET=chave_jwt_gerada
ANON_KEY=chave_anon_gerada
SERVICE_ROLE_KEY=chave_service_role_gerada

# RabbitMQ
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=senha_rabbitmq

# SMTP (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASS=senha_app
```

## Comandos Essenciais

### Deploy e Gestão

```bash
# Deploy inicial
./docker/scripts/deploy.sh

# Verificar saúde
./docker/scripts/health-check.sh

# Ver logs
docker service logs -f app_frontend
docker service logs -f app_postgres

# Escalar serviço
docker service scale app_frontend=5

# Atualizar serviço
docker service update --force app_frontend
```

### Backup e Restore

```bash
# Criar backup
./docker/scripts/backup.sh

# Restaurar backup
./docker/scripts/restore.sh ./backups/backup_YYYYMMDD_HHMMSS.sql.gz
```

### Monitoramento

```bash
# Status dos serviços
docker service ls

# Tarefas da stack
docker stack ps app

# Recursos utilizados
docker stats

# Espaço em disco
docker system df
```

## SSL/HTTPS (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install -y certbot

# Parar nginx
docker service scale app_nginx=0

# Gerar certificado
sudo certbot certonly --standalone -d seudominio.com

# Copiar certificados
sudo mkdir -p docker/nginx/ssl
sudo cp /etc/letsencrypt/live/seudominio.com/fullchain.pem docker/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/seudominio.com/privkey.pem docker/nginx/ssl/key.pem

# Ajustar permissões
sudo chown -R $USER:$USER docker/nginx/ssl

# Reiniciar nginx
docker service scale app_nginx=1
```

## Scaling Horizontal

```bash
# Escalar frontend (mais usuários simultâneos)
docker service scale app_frontend=5

# Escalar API (mais requisições)
docker service scale app_rest=5

# Escalar Auth (mais logins simultâneos)
docker service scale app_auth=3
```

## Adicionar Node ao Cluster

```bash
# No manager, obter token
docker swarm join-token worker

# No worker, executar comando retornado
docker swarm join --token SWMTKN-... IP_MANAGER:2377

# Verificar nodes
docker node ls
```

## Troubleshooting Rápido

### Serviço não inicia
```bash
docker service logs app_SERVICO
docker service ps app_SERVICO --no-trunc
```

### Reset completo
```bash
docker stack rm app
sleep 30
docker volume prune -f
./docker/scripts/deploy.sh
```

### Atualizar apenas frontend
```bash
docker build -t app-frontend:latest -f docker/frontend/Dockerfile .
docker service update --image app-frontend:latest app_frontend
```

## Recursos do Sistema

### Desenvolvimento
- 2 CPU cores
- 4GB RAM
- 50GB SSD

### Produção (até 100 usuários)
- 4 CPU cores
- 8GB RAM
- 100GB SSD

### Produção (100-500 usuários)
- 8 CPU cores
- 16GB RAM
- 200GB SSD

## Checklist de Produção

- [ ] Firewall configurado
- [ ] SSH hardened (chave pública)
- [ ] Senhas fortes no .env
- [ ] SSL/TLS configurado
- [ ] Backup automático (cron)
- [ ] Monitoramento ativo
- [ ] DNS configurado
- [ ] Email SMTP configurado
- [ ] RabbitMQ acessível
- [ ] Health checks passando

## Links Úteis

- [Documentação Completa](./INSTALL.md)
- [Docker Swarm Docs](https://docs.docker.com/engine/swarm/)
- [Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting)
- [Let's Encrypt](https://letsencrypt.org/)

## Manutenção

### Diária
```bash
./docker/scripts/health-check.sh
```

### Semanal
```bash
./docker/scripts/backup.sh
docker system prune -f
```

### Mensal
```bash
sudo apt update && sudo apt upgrade -y
docker image prune -a -f
```

---

**Dúvidas?** Consulte [INSTALL.md](./INSTALL.md) para guia detalhado.
