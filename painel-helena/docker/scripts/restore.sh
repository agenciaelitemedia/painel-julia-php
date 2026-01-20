#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}♻️  Restore do Banco de Dados${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if backup file was provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Nenhum arquivo de backup especificado!${NC}"
    echo -e "${YELLOW}Uso: ./restore.sh <arquivo_backup.sql.gz>${NC}"
    echo -e "\n${YELLOW}Backups disponíveis:${NC}"
    ls -lh ./backups/backup_*.sql.gz 2>/dev/null || echo "Nenhum backup encontrado"
    exit 1
fi

BACKUP_FILE=$1

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}❌ Arquivo de backup não encontrado: ${BACKUP_FILE}${NC}"
    exit 1
fi

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
echo -e "${YELLOW}📁 Arquivo de backup: ${BACKUP_FILE}${NC}"

# Confirm restore
echo -e "\n${RED}⚠️  ATENÇÃO: Esta operação irá SUBSTITUIR todos os dados atuais!${NC}"
read -p "Tem certeza que deseja continuar? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}❌ Restore cancelado${NC}"
    exit 0
fi

# Decompress if needed
TEMP_FILE="/tmp/restore_temp.sql"
if [[ ${BACKUP_FILE} == *.gz ]]; then
    echo -e "${YELLOW}🗜️  Descomprimindo backup...${NC}"
    gunzip -c ${BACKUP_FILE} > ${TEMP_FILE}
else
    cp ${BACKUP_FILE} ${TEMP_FILE}
fi

# Copy backup to container
echo -e "${YELLOW}📤 Copiando backup para container...${NC}"
docker cp ${TEMP_FILE} ${POSTGRES_CONTAINER}:/tmp/restore.sql

# Restore backup
echo -e "${YELLOW}♻️  Restaurando banco de dados...${NC}"
docker exec ${POSTGRES_CONTAINER} \
    pg_restore -U postgres -d postgres \
    --clean --if-exists \
    --format=custom \
    /tmp/restore.sql

# Cleanup
echo -e "${YELLOW}🧹 Limpando arquivos temporários...${NC}"
rm -f ${TEMP_FILE}
docker exec ${POSTGRES_CONTAINER} rm /tmp/restore.sql

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Restore Concluído!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}⚠️  Reinicie os serviços para aplicar as mudanças:${NC}"
echo -e "${YELLOW}  docker service update --force app_postgres${NC}"
