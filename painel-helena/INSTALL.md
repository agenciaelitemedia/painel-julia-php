# 🚀 Guia de Instalação - Docker Swarm

## 📋 Índice
- [Pré-requisitos](#pré-requisitos)
- [Preparação do Servidor](#preparação-do-servidor)
- [Configuração](#configuração)
- [Instalação](#instalação)
- [Verificação](#verificação)
- [Configuração SSL](#configuração-ssl)
- [Troubleshooting](#troubleshooting)

## Pré-requisitos

### Hardware Mínimo
- **CPU**: 2 cores
- **RAM**: 4GB
- **Disco**: 50GB SSD
- **Rede**: Conexão estável com IP público

### Hardware Recomendado (Produção)
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Disco**: 100GB+ SSD
- **Rede**: Conexão dedicada com IP estático

### Software
- Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- Docker 20.10+
- Docker Compose 2.0+
- Git
- Domínio apontando para o servidor

## Preparação do Servidor

### 1. Atualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar Docker

```bash
# Remover versões antigas
sudo apt remove docker docker-engine docker.io containerd runc

# Instalar dependências
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Adicionar chave GPG oficial do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verificar instalação
docker --version
docker compose version
```

### 3. Configurar Permissões

```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Aplicar mudanças (relogar ou executar)
newgrp docker

# Verificar que funciona sem sudo
docker ps
```

### 4. Configurar Firewall

```bash
# Permitir portas necessárias
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 2377/tcp  # Docker Swarm management
sudo ufw allow 7946/tcp  # Docker Swarm node communication
sudo ufw allow 7946/udp  # Docker Swarm node communication
sudo ufw allow 4789/udp  # Docker Swarm overlay network

# Habilitar firewall
sudo ufw enable
sudo ufw status
```

## Configuração

### 1. Clonar Repositório

```bash
cd /opt
sudo git clone https://seu-repositorio.git app
cd app
sudo chown -R $USER:$USER .
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar template
cp docker/.env.example .env

# Gerar chaves de segurança
chmod +x docker/scripts/generate-keys.sh
./docker/scripts/generate-keys.sh
```

### 3. Editar .env

```bash
nano .env
```

#### Variáveis Obrigatórias:

```bash
# Domínio da aplicação
SITE_URL=https://seudominio.com

# PostgreSQL (use senha forte!)
POSTGRES_PASSWORD=sua_senha_super_segura_aqui

# JWT Secrets (copie do generate-keys.sh)
JWT_SECRET=chave_gerada_pelo_script
SECRET_KEY_BASE=chave_gerada_pelo_script
DB_ENC_KEY=chave_gerada_pelo_script

# Supabase Keys (gere em https://supabase.com/docs/guides/api)
ANON_KEY=sua_anon_key
SERVICE_ROLE_KEY=sua_service_role_key

# RabbitMQ
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=senha_rabbitmq_segura
```

#### Configuração SMTP (Opcional para emails):

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app
SMTP_ADMIN_EMAIL=admin@seudominio.com
```

### 4. Gerar Chaves Supabase

Você precisa gerar as chaves ANON_KEY e SERVICE_ROLE_KEY. Use uma destas opções:

#### Opção 1: Supabase CLI (Recomendado)
```bash
# Instalar Supabase CLI
npm install -g supabase

# Gerar chaves
supabase gen keys --jwt-secret $(openssl rand -base64 32)
```

#### Opção 2: Online
Acesse: https://supabase.com/docs/guides/api/api-keys

## Instalação

### 1. Tornar Scripts Executáveis

```bash
chmod +x docker/scripts/*.sh
```

### 2. Inicializar Docker Swarm

```bash
./docker/scripts/init-swarm.sh
```

**Saída esperada:**
```
========================================
🚀 Inicializando Docker Swarm
========================================
✅ Docker Swarm inicializado com sucesso!
```

### 3. Deploy da Aplicação

```bash
./docker/scripts/deploy.sh
```

**Saída esperada:**
```
========================================
🚀 Deploy da Aplicação
========================================
📋 Carregando variáveis de ambiente...
✅ Variáveis validadas
🏗️  Building frontend image...
✅ Frontend image criada
📦 Deploying stack...
✅ Deploy Concluído!
```

### 4. Aguardar Serviços Iniciarem

```bash
# Monitorar status dos serviços
watch docker service ls

# Ou verificar health check
./docker/scripts/health-check.sh
```

Aguarde até que todos os serviços mostrem `X/X` replicas (ex: 2/2, 3/3).

## Verificação

### 1. Verificar Serviços

```bash
# Listar serviços
docker service ls

# Ver logs de um serviço específico
docker service logs app_frontend
docker service logs app_postgres
docker service logs app_kong

# Ver tarefas da stack
docker stack ps app
```

### 2. Testar Acesso

```bash
# Testar API Supabase
curl http://localhost:8000/rest/v1/

# Testar frontend (HTTP)
curl http://localhost/
```

### 3. Acessar Aplicação

Abra no navegador:
- **Frontend**: http://seu-ip/
- **RabbitMQ Management**: http://seu-ip:15672 (usuário/senha do .env)

## Configuração SSL

### Opção 1: Let's Encrypt (Recomendado)

```bash
# Instalar Certbot
sudo apt install -y certbot

# Parar nginx temporariamente
docker service scale app_nginx=0

# Gerar certificado
sudo certbot certonly --standalone -d seudominio.com

# Copiar certificados
sudo mkdir -p docker/nginx/ssl
sudo cp /etc/letsencrypt/live/seudominio.com/fullchain.pem docker/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/seudominio.com/privkey.pem docker/nginx/ssl/key.pem
sudo chown -R $USER:$USER docker/nginx/ssl

# Reiniciar nginx
docker service scale app_nginx=1

# Renovação automática
sudo crontab -e
# Adicionar linha:
0 0 1 * * certbot renew --quiet && cp /etc/letsencrypt/live/seudominio.com/*.pem /opt/app/docker/nginx/ssl/
```

### Opção 2: Certificado Próprio

```bash
mkdir -p docker/nginx/ssl
cd docker/nginx/ssl

# Gerar certificado autoassinado (desenvolvimento)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout key.pem \
    -out cert.pem \
    -subj "/CN=seudominio.com"

cd ../../..
```

### Atualizar Nginx

```bash
# Depois de configurar SSL, atualizar serviço
docker service update --force app_nginx
```

## Backup e Restore

### Criar Backup

```bash
# Criar backup do banco de dados
./docker/scripts/backup.sh
```

Backups são salvos em `./backups/` e mantidos por 30 dias.

### Restaurar Backup

```bash
# Listar backups disponíveis
ls -lh ./backups/

# Restaurar backup específico
./docker/scripts/restore.sh ./backups/backup_20250115_120000.sql.gz
```

## Monitoramento

### Logs em Tempo Real

```bash
# Todos os serviços
docker stack ps app

# Serviço específico
docker service logs -f app_frontend
docker service logs -f app_postgres

# Últimas 100 linhas
docker service logs --tail 100 app_kong
```

### Health Check

```bash
# Verificar saúde de todos os serviços
./docker/scripts/health-check.sh
```

### Métricas

```bash
# CPU e Memória dos containers
docker stats

# Espaço em disco dos volumes
docker system df -v
```

## Troubleshooting

### Problema: Serviço não inicia

```bash
# Ver logs do serviço
docker service logs app_SERVICO

# Ver tarefas falhadas
docker stack ps app --no-trunc --filter "desired-state=running"

# Forçar restart
docker service update --force app_SERVICO
```

### Problema: Erro de conexão com banco

```bash
# Verificar se postgres está rodando
docker service ls | grep postgres

# Ver logs do postgres
docker service logs app_postgres

# Testar conexão
docker exec $(docker ps -q -f name=app_postgres) \
    psql -U postgres -c "SELECT 1"
```

### Problema: Frontend não carrega

```bash
# Verificar build
docker service logs app_frontend

# Rebuild e redeploy
docker build -t app-frontend:latest -f docker/frontend/Dockerfile .
docker service update --image app-frontend:latest app_frontend
```

### Problema: Certificado SSL inválido

```bash
# Verificar arquivos
ls -la docker/nginx/ssl/

# Verificar permissões
sudo chmod 644 docker/nginx/ssl/cert.pem
sudo chmod 600 docker/nginx/ssl/key.pem

# Atualizar nginx
docker service update --force app_nginx
```

### Limpar e Recomeçar

```bash
# Remover stack
docker stack rm app

# Aguardar containers pararem
sleep 30

# Remover volumes (⚠️ APAGA DADOS!)
docker volume rm app_postgres-data app_storage-data app_rabbitmq-data

# Reiniciar deploy
./docker/scripts/deploy.sh
```

## Comandos Úteis

```bash
# Escalar serviço
docker service scale app_frontend=5

# Atualizar imagem
docker service update --image nova-imagem:tag app_SERVICO

# Pausar serviço
docker service scale app_SERVICO=0

# Reiniciar serviço
docker service scale app_SERVICO=1

# Ver configuração do serviço
docker service inspect app_SERVICO

# Remover stack
docker stack rm app

# Listar nodes do swarm
docker node ls

# Promover node a manager
docker node promote NODE_ID
```

## Segurança

### Checklist de Segurança

- [ ] Firewall configurado (apenas portas necessárias)
- [ ] SSH com chave pública (desabilitar senha)
- [ ] Senhas fortes no .env
- [ ] Certificado SSL válido
- [ ] Backups automáticos configurados
- [ ] Monitoramento ativo
- [ ] Secrets do Docker utilizados para dados sensíveis
- [ ] RLS (Row Level Security) ativo no banco

### Hardening Adicional

```bash
# Desabilitar login root via SSH
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no

# Usar fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban

# Atualizar sistema regularmente
sudo apt update && sudo apt upgrade -y
```

## Suporte

Para problemas ou dúvidas:
1. Verificar logs: `docker service logs app_SERVICO`
2. Executar health check: `./docker/scripts/health-check.sh`
3. Consultar documentação: [seu-wiki/docs]
4. Abrir issue no repositório

---

**Versão**: 1.0  
**Última atualização**: Janeiro 2025
