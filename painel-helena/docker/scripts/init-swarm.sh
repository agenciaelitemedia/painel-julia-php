#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🚀 Inicializando Docker Swarm${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não está instalado!${NC}"
    echo -e "${YELLOW}Instale o Docker primeiro: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

# Check if already in swarm mode
if docker info 2>/dev/null | grep -q "Swarm: active"; then
    echo -e "${GREEN}✅ Docker Swarm já está ativo${NC}"
    
    # Show current swarm info
    echo -e "\n${YELLOW}Informações do Swarm:${NC}"
    docker node ls
else
    echo -e "${YELLOW}📦 Inicializando novo cluster Swarm...${NC}"
    
    # Get the main IP address
    IP_ADDRESS=$(hostname -I | awk '{print $1}')
    echo -e "${YELLOW}IP do manager: ${IP_ADDRESS}${NC}"
    
    # Initialize swarm
    docker swarm init --advertise-addr ${IP_ADDRESS}
    
    echo -e "${GREEN}✅ Docker Swarm inicializado com sucesso!${NC}"
    echo -e "\n${YELLOW}Para adicionar workers ao cluster, execute o comando acima em outros nós${NC}"
fi

# Create networks if they don't exist
echo -e "\n${YELLOW}🌐 Verificando redes...${NC}"

if ! docker network ls | grep -q "app-network"; then
    echo -e "${YELLOW}Criando rede app-network...${NC}"
    docker network create --driver overlay --attachable app-network
    echo -e "${GREEN}✅ Rede criada${NC}"
else
    echo -e "${GREEN}✅ Rede app-network já existe${NC}"
fi

# Show swarm status
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Swarm Inicializado${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}Próximos passos:${NC}"
echo -e "1. Configure o arquivo .env (copie de .env.example)"
echo -e "2. Execute ./deploy.sh para fazer o deploy da aplicação"
echo -e "\n${YELLOW}Comandos úteis:${NC}"
echo -e "- Ver nós: docker node ls"
echo -e "- Ver stacks: docker stack ls"
echo -e "- Ver serviços: docker service ls"
