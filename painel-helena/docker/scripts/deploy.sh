#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🚀 Deploy da Aplicação${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    echo -e "${YELLOW}📝 Copie .env.example para .env e configure as variáveis${NC}"
    echo -e "${YELLOW}   cp docker/.env.example .env${NC}"
    exit 1
fi

# Load environment variables
echo -e "${YELLOW}📋 Carregando variáveis de ambiente...${NC}"
export $(cat .env | grep -v '^#' | xargs)

# Validate required variables
REQUIRED_VARS=(
    "POSTGRES_PASSWORD"
    "JWT_SECRET"
    "SECRET_KEY_BASE"
    "ANON_KEY"
    "SERVICE_ROLE_KEY"
    "SITE_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Variável ${var} não está definida no .env${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Variáveis validadas${NC}"

# Check if swarm is initialized
if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
    echo -e "${YELLOW}⚠️  Docker Swarm não está ativo${NC}"
    echo -e "${YELLOW}Executando init-swarm.sh...${NC}"
    ./docker/scripts/init-swarm.sh
fi

# Build frontend image
echo -e "\n${YELLOW}🏗️  Building frontend image...${NC}"
docker build \
    -t app-frontend:${VERSION:-latest} \
    -f docker/frontend/Dockerfile \
    --build-arg VITE_SUPABASE_URL=${SITE_URL} \
    --build-arg VITE_SUPABASE_ANON_KEY=${ANON_KEY} \
    .

echo -e "${GREEN}✅ Frontend image criada${NC}"

# Create secrets if they don't exist
echo -e "\n${YELLOW}🔐 Gerenciando secrets...${NC}"

create_secret_if_not_exists() {
    local secret_name=$1
    local secret_value=$2
    
    if ! docker secret ls | grep -q ${secret_name}; then
        echo -e "${YELLOW}Criando secret: ${secret_name}${NC}"
        echo -n "${secret_value}" | docker secret create ${secret_name} -
    else
        echo -e "${GREEN}Secret ${secret_name} já existe${NC}"
    fi
}

create_secret_if_not_exists "postgres_password" "${POSTGRES_PASSWORD}"
create_secret_if_not_exists "jwt_secret" "${JWT_SECRET}"
create_secret_if_not_exists "service_role_key" "${SERVICE_ROLE_KEY}"

# Deploy stack
echo -e "\n${BLUE}📦 Deploying stack...${NC}"
docker stack deploy -c docker/docker-compose.yml app

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
