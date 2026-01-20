#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}💾 Backup do Banco de Dados${NC}"
echo -e "${GREEN}========================================${NC}"

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    exit 1
fi

# Find postgres container
POSTGRES_CONTAINER=$(docker ps -q -f name=app_postgres)

if [ -z "${POSTGRES_CONTAINER}" ]; then
    echo -e "${RED}❌ Container PostgreSQL não encontrado!${NC}"
    echo -e "${YELLOW}Verifique se a stack está rodando: docker stack ps app${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Container PostgreSQL: ${POSTGRES_CONTAINER}${NC}"

# Create backup
echo -e "${YELLOW}💾 Criando backup...${NC}"
docker exec ${POSTGRES_CONTAINER} \
    pg_dump -U postgres -d postgres \
    --clean --if-exists \
    --format=custom \
    > ${BACKUP_FILE}

# Compress backup
echo -e "${YELLOW}🗜️  Comprimindo backup...${NC}"
gzip ${BACKUP_FILE}

BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Backup Concluído!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}📁 Arquivo: ${BACKUP_FILE}.gz${NC}"
echo -e "${GREEN}📊 Tamanho: ${BACKUP_SIZE}${NC}"

# Keep only last 30 backups
echo -e "\n${YELLOW}🧹 Limpando backups antigos...${NC}"
cd ${BACKUP_DIR}
ls -t backup_*.sql.gz | tail -n +31 | xargs -r rm
cd - > /dev/null

BACKUP_COUNT=$(ls -1 ${BACKUP_DIR}/backup_*.sql.gz 2>/dev/null | wc -l)
echo -e "${GREEN}📂 Total de backups mantidos: ${BACKUP_COUNT}${NC}"

echo -e "\n${YELLOW}Para restaurar este backup:${NC}"
echo -e "${YELLOW}  ./docker/scripts/restore.sh ${BACKUP_FILE}.gz${NC}"
