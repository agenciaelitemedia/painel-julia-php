#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🚀 Deploy da Aplicação (Supabase Cloud)${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    echo -e "${YELLOW}📝 Copie .env.example para .env e configure as variáveis${NC}"
    echo -e "${YELLOW}   cp docker-cloud/.env.example .env${NC}"
    exit 1
fi

# Load environment variables
echo -e "${YELLOW}📋 Carregando variáveis de ambiente...${NC}"
export $(cat .env | grep -v '^#' | xargs)

# Validate required variables
REQUIRED_VARS=(
    "VITE_SUPABASE_URL"
    "VITE_SUPABASE_ANON_KEY"
    "VITE_SUPABASE_PROJECT_ID"
    "SUPABASE_SERVICE_ROLE_KEY"
    "SITE_URL"
    "RABBITMQ_USER"
    "RABBITMQ_PASSWORD"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Variável ${var} não está definida no .env${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Variáveis validadas${NC}"

# Validate Supabase URL format
if [[ ! $VITE_SUPABASE_URL =~ ^https://.*\.supabase\.co$ ]]; then
    echo -e "${YELLOW}⚠️  ATENÇÃO: VITE_SUPABASE_URL não parece ser uma URL válida do Supabase Cloud${NC}"
    echo -e "${YELLOW}   Formato esperado: https://seu-projeto.supabase.co${NC}"
    read -p "Continuar mesmo assim? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        exit 1
    fi
fi

# Check if swarm is initialized
if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
    echo -e "${YELLOW}⚠️  Docker Swarm não está ativo${NC}"
    echo -e "${YELLOW}Executando init-swarm.sh...${NC}"
    ./docker-cloud/scripts/init-swarm.sh
fi

# Build frontend image
echo -e "\n${YELLOW}🏗️  Building frontend image...${NC}"
docker build \
    -t app-frontend:${VERSION:-latest} \
    -f docker-cloud/frontend/Dockerfile \
    --build-arg VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    --build-arg VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} \
    --build-arg VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID} \
    --build-arg VITE_UAZAP_API_URL=${VITE_UAZAP_API_URL} \
    --build-arg VITE_EVOLUTION_API_URL=${VITE_EVOLUTION_API_URL} \
    --build-arg VITE_LOGO_URL=${VITE_LOGO_URL} \
    .

echo -e "${GREEN}✅ Frontend image criada${NC}"

# Deploy stack
echo -e "\n${BLUE}📦 Deploying stack...${NC}"
docker stack deploy -c docker-cloud/docker-compose.yml app

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deploy Concluído!${NC}"
echo -e "${GREEN}========================================${NC}"

# Wait a bit for services to start
echo -e "\n${YELLOW}⏳ Aguardando serviços iniciarem...${NC}"
sleep 5

# Show service status
echo -e "\n${BLUE}📊 Status dos Serviços:${NC}"
docker stack ps app --no-trunc

echo -e "\n${YELLOW}🔍 Comandos úteis:${NC}"
echo -e "- Ver logs: docker service logs app_<servico>"
echo -e "- Ver serviços: docker service ls"
echo -e "- Escalar serviço: docker service scale app_<servico>=N"
echo -e "- Remover stack: docker stack rm app"

echo -e "\n${GREEN}🌐 Aplicação disponível em: ${SITE_URL}${NC}"
echo -e "\n${BLUE}📊 Supabase Dashboard: ${VITE_SUPABASE_URL/https:\/\//https://supabase.com/dashboard/project/}${NC}"
