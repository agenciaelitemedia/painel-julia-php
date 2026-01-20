#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🏥 Health Check dos Serviços${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if stack is running
if ! docker stack ls | grep -q "app"; then
    echo -e "${RED}❌ Stack 'app' não está rodando!${NC}"
    exit 1
fi

# Function to check service health
check_service() {
    local service_name=$1
    local replicas=$(docker service ls --filter name=app_${service_name} --format "{{.Replicas}}")
    
    if [ -z "${replicas}" ]; then
        echo -e "${RED}❌ ${service_name}: Serviço não encontrado${NC}"
        return 1
    fi
    
    local running=$(echo ${replicas} | cut -d'/' -f1)
    local desired=$(echo ${replicas} | cut -d'/' -f2)
    
    if [ "${running}" == "${desired}" ]; then
        echo -e "${GREEN}✅ ${service_name}: ${replicas}${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  ${service_name}: ${replicas} (aguardando)${NC}"
        return 1
    fi
}

echo -e "\n${BLUE}Verificando serviços...${NC}\n"

# Check all services
SERVICES=(
    "postgres"
    "auth"
    "realtime"
    "storage"
    "rest"
    "edge-functions"
    "kong"
    "rabbitmq"
    "frontend"
    "nginx"
)

HEALTHY=0
TOTAL=${#SERVICES[@]}

for service in "${SERVICES[@]}"; do
    if check_service ${service}; then
        ((HEALTHY++))
    fi
done

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Status Geral: ${HEALTHY}/${TOTAL} serviços saudáveis${NC}"
echo -e "${GREEN}========================================${NC}"

# Show detailed service info
echo -e "\n${BLUE}Detalhes dos Serviços:${NC}"
docker service ls --filter label=com.docker.stack.namespace=app

# Show any failed tasks
echo -e "\n${BLUE}Tarefas com Problemas:${NC}"
FAILED_TASKS=$(docker stack ps app --filter "desired-state=running" --filter "current-state=failed" --no-trunc)

if [ -z "${FAILED_TASKS}" ]; then
    echo -e "${GREEN}Nenhuma tarefa com falhas${NC}"
else
    echo "${FAILED_TASKS}"
fi

# Overall health status
if [ ${HEALTHY} -eq ${TOTAL} ]; then
    echo -e "\n${GREEN}🎉 Todos os serviços estão saudáveis!${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Alguns serviços precisam de atenção${NC}"
    exit 1
fi
