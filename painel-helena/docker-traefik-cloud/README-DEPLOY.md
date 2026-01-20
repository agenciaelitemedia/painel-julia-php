# 🚀 Quick Start - Portainer + Traefik + Supabase Cloud

Deploy rápido da aplicação em VPS com Portainer e Traefik já configurados.

---

## ⚡ Resumo da Arquitetura

```
┌─────────────────────────────────────────────┐
│          Internet / Usuários                │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │    Traefik      │ ◄── SSL automático (Let's Encrypt)
         │  Reverse Proxy  │ ◄── Roteamento por domínio
         └────────┬────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
   ┌─────────┐      ┌──────────────┐
   │Frontend │      │   RabbitMQ   │
   │React App│      │  Management  │
   │(3x)     │      │              │
   └────┬────┘      └──────────────┘
        │
        │ API Calls
        ▼
   ┌──────────────────────────┐
   │   Supabase Cloud         │
   │  • PostgreSQL            │
   │  • Auth                  │
   │  • Storage               │
   │  • Edge Functions        │
   │  • Realtime              │
   └──────────────────────────┘
```

**Serviços Locais (Docker Swarm):**
- Frontend (Nginx + React)
- RabbitMQ

**Serviços Cloud:**
- Supabase (Database, Auth, Storage, Functions)

---

## 📋 Checklist Rápido

### Antes de Começar
- [ ] VPS com Docker Swarm ativo
- [ ] Portainer instalado e acessível
- [ ] Traefik configurado com network `traefik-public`
- [ ] Domínio apontando para o servidor
- [ ] Projeto criado no Supabase Cloud
- [ ] Credenciais do Supabase coletadas

### Deploy
- [ ] Migrações aplicadas no Supabase
- [ ] Variáveis de ambiente configuradas
- [ ] Stack criada no Portainer
- [ ] Serviços rodando (3/3 frontend, 1/1 rabbitmq)
- [ ] SSL funcionando (https://)
- [ ] Aplicação acessível

---

## 🎯 Comandos Essenciais

### 1. Criar Projeto no Supabase
```
1. Acesse: https://supabase.com
2. New Project → Configure → Aguarde ~2min
3. Settings → API → Copie URL e Keys
```

### 2. Aplicar Migrações
```
Supabase Dashboard → SQL Editor
→ Cole migrations/001_initial_schema.sql
→ Execute (Run)
→ Repita para 002, 003, 004, 005
```

### 3. Deploy no Portainer
```
Portainer → Stacks → Add Stack
→ Nome: masterchat-app
→ Cole docker-compose.yml
→ Configure variáveis de ambiente
→ Deploy the stack
```

### 4. Verificar Deploy
```bash
# Via CLI
docker service ls
docker service logs masterchat-app_frontend

# Ou via Portainer UI
Stacks → masterchat-app → Ver logs
```

### 5. Acessar Aplicação
```
Frontend: https://seudominio.com
RabbitMQ: https://seudominio.com/rabbitmq
```

---

## 🔧 Variáveis de Ambiente Obrigatórias

Configure no Portainer ao criar a stack:

```bash
# Domínio
DOMAIN=seudominio.com

# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PROJECT_ID=xxxxx
VITE_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# RabbitMQ
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=senha-forte-aqui
RABBITMQ_VHOST=/
RABBITMQ_QUEUE_NAME=julia_queue

# APIs Externas (se usar)
VITE_UAZAP_API_URL=https://...
UAZAP_ADMIN_TOKEN=token...
VITE_EVOLUTION_API_URL=https://...
VITE_EVOLUTION_API_TOKEN=token...

# OpenAI (se usar)
OPENAI_API_KEY=sk-...
```

---

## 🏷️ Labels do Traefik

A stack usa estas labels para integração automática:

### Frontend
```yaml
- "traefik.enable=true"
- "traefik.http.routers.frontend.rule=Host(`${DOMAIN}`)"
- "traefik.http.routers.frontend.entrypoints=websecure"
- "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
- "traefik.docker.network=traefik-public"
```

### RabbitMQ Management
```yaml
- "traefik.http.routers.rabbitmq.rule=Host(`${DOMAIN}`) && PathPrefix(`/rabbitmq`)"
- "traefik.http.middlewares.rabbitmq-stripprefix.stripprefix.prefixes=/rabbitmq"
```

---

## 📊 Recursos Necessários

### Mínimo (Desenvolvimento/Teste)
- **RAM:** 2GB
- **CPU:** 1 core
- **Disco:** 20GB

### Recomendado (Produção 10-50 usuários)
- **RAM:** 4GB
- **CPU:** 2 cores
- **Disco:** 50GB SSD

### Alta Performance (100+ usuários)
- **RAM:** 8GB
- **CPU:** 4 cores
- **Disco:** 100GB SSD
- **Considere:** Cluster multi-node

---

## 🔄 Escalabilidade

### Escalar Frontend
```bash
# Via CLI
docker service scale masterchat-app_frontend=5

# Ou via Portainer UI
Services → frontend → Scale → 5 replicas
```

### Auto-scaling com Portainer Business
Configure regras baseadas em:
- CPU > 70%
- RAM > 80%
- Request count

---

## 🆘 Troubleshooting Rápido

### Serviço não inicia
```bash
docker service ps masterchat-app_frontend --no-trunc
docker service logs masterchat-app_frontend --tail 50
```

### SSL não funciona
1. Verificar DNS: `dig seudominio.com`
2. Verificar Traefik: `docker service logs traefik`
3. Verificar labels da stack

### Erro 502 Bad Gateway
1. Serviço está rodando? `docker service ls`
2. Health check OK? Ver logs do serviço
3. Network conectada? Verificar `traefik-public`

### Supabase não conecta
1. Testar URL: `curl https://seu-projeto.supabase.co`
2. Verificar keys no .env
3. Verificar CORS no Supabase Dashboard

---

## 💰 Custos Estimados

### VPS (DigitalOcean, Vultr, Hetzner)
- **Básico:** $5-10/mês (2GB RAM, 1 CPU)
- **Recomendado:** $12-20/mês (4GB RAM, 2 CPU)
- **Alta Performance:** $40-60/mês (8GB RAM, 4 CPU)

### Supabase Cloud
- **Free:** $0/mês
  - 500MB database
  - 1GB storage
  - 50k Edge Function invocations
  
- **Pro:** $25/mês
  - 8GB database
  - 100GB storage
  - 2M Edge Function invocations
  - Backups diários

### APIs Externas
- **UAZap:** Variável (por instância)
- **Evolution API:** Variável (por instância)
- **OpenAI:** Pay-as-you-go

**Total Estimado:** $30-100/mês (dependendo do tráfego)

---

## 🔐 Segurança

### Checklist de Segurança
- [x] SSL/TLS habilitado (Traefik + Let's Encrypt)
- [x] Variáveis sensíveis em .env (não no código)
- [x] RabbitMQ com senha forte
- [x] Supabase RLS policies ativas
- [x] Firewall configurado (portas 80, 443)
- [x] Service Role Key nunca exposta no frontend
- [ ] Rate limiting no Traefik (opcional)
- [ ] Fail2ban instalado (opcional)
- [ ] Backups automáticos configurados

---

## 📈 Monitoramento

### Portainer
```
https://seu-servidor:9443
→ Dashboards
→ Ver CPU, RAM, Network
→ Logs em tempo real
```

### Supabase Dashboard
```
https://supabase.com/dashboard
→ Database: Queries, Performance
→ Auth: Logs de autenticação
→ Storage: Uso de arquivos
→ Edge Functions: Execuções
```

### RabbitMQ Management
```
https://seudominio.com/rabbitmq
→ Queues: Mensagens pendentes
→ Connections: Clientes conectados
→ Throughput: Taxa de processamento
```

---

## 🚀 Próximos Passos

Após deploy bem-sucedido:

1. **Configurar Backups**
   - Supabase: Automático no plano Pro
   - Volumes: Script de backup diário

2. **Monitoramento Avançado**
   - Integrar Grafana + Prometheus
   - Alertas via email/Slack

3. **CI/CD**
   - GitHub Actions para deploy automático
   - Webhook do Portainer

4. **Performance**
   - CDN para assets estáticos
   - Cache Redis (se necessário)

5. **Disaster Recovery**
   - Backup offsite
   - Plano de recuperação documentado

---

## 📚 Documentação Completa

Para instruções detalhadas, consulte:
- [INSTALL.md](./INSTALL.md) - Guia completo passo a passo
- [Supabase Docs](https://supabase.com/docs)
- [Traefik Docs](https://doc.traefik.io/traefik/)
- [Portainer Docs](https://docs.portainer.io/)

---

## 🎉 Sucesso!

Stack criada e rodando com:
- ✅ Frontend escalável (3 réplicas)
- ✅ RabbitMQ gerenciado
- ✅ Supabase Cloud integrado
- ✅ SSL automático
- ✅ Gestão visual (Portainer)
- ✅ Alta disponibilidade (Docker Swarm)

**Aplicação disponível em:** https://seudominio.com 🚀
