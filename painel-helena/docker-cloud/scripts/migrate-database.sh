#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🗄️  Migração do Banco de Dados${NC}"
echo -e "${GREEN}   (Supabase Cloud via SQL Editor)${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    echo -e "${YELLOW}Configure o .env primeiro com as credenciais do Supabase Cloud${NC}"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Validate Supabase variables
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_PROJECT_ID" ]; then
    echo -e "${RED}❌ Variáveis do Supabase não configuradas!${NC}"
    exit 1
fi

# Extract project ID from URL if not set
if [ -z "$VITE_SUPABASE_PROJECT_ID" ]; then
    VITE_SUPABASE_PROJECT_ID=$(echo $VITE_SUPABASE_URL | sed -E 's/https:\/\/([^.]+)\.supabase\.co/\1/')
fi

DASHBOARD_URL="https://supabase.com/dashboard/project/${VITE_SUPABASE_PROJECT_ID}/editor"

echo -e "\n${YELLOW}⚠️  ATENÇÃO: Migrações para Supabase Cloud${NC}"
echo -e "${YELLOW}============================================${NC}"
echo -e "As migrações devem ser aplicadas manualmente no Supabase Cloud."
echo -e "Você tem duas opções:"
echo -e ""
echo -e "${BLUE}Opção 1 - SQL Editor (Recomendado):${NC}"
echo -e "1. Acesse: ${BLUE}${DASHBOARD_URL}${NC}"
echo -e "2. Copie e execute cada arquivo SQL da pasta migrations/"
echo -e "3. Execute na ordem: 001, 002, 003, etc."
echo -e ""
echo -e "${BLUE}Opção 2 - API do Supabase:${NC}"
echo -e "Este script pode aplicar via API (requer psql instalado)"
echo -e ""

read -p "Deseja aplicar via API agora? (yes/no): " APPLY_NOW

if [ "$APPLY_NOW" != "yes" ]; then
    echo -e "\n${YELLOW}📝 Migrações disponíveis em:${NC}"
    echo -e "   docker-cloud/migrations/"
    echo -e ""
    echo -e "${YELLOW}Para aplicar manualmente:${NC}"
    echo -e "1. Acesse o SQL Editor: ${BLUE}${DASHBOARD_URL}${NC}"
    echo -e "2. Copie o conteúdo de cada arquivo .sql"
    echo -e "3. Execute na ordem numérica"
    echo -e ""
    
    # List migration files
    if [ -d "docker-cloud/migrations" ]; then
        echo -e "${BLUE}Arquivos de migração:${NC}"
        ls -1 docker-cloud/migrations/*.sql 2>/dev/null || echo "Nenhum arquivo encontrado"
    fi
    
    exit 0
fi

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ psql não está instalado!${NC}"
    echo -e "${YELLOW}Instale com: sudo apt install postgresql-client${NC}"
    exit 1
fi

# Validate service role key
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ SUPABASE_SERVICE_ROLE_KEY não configurada!${NC}"
    exit 1
fi

# Get database connection string
echo -e "\n${YELLOW}🔗 Obtendo connection string...${NC}"
echo -e "${YELLOW}Você precisa da connection string do Supabase.${NC}"
echo -e "${YELLOW}Encontre em: Dashboard > Project Settings > Database > Connection String${NC}"
echo -e "${YELLOW}Use a opção 'Session pooler' ou 'Direct connection'${NC}"
echo -e ""

read -p "Cole a connection string (postgresql://...): " DB_CONNECTION_STRING

if [ -z "$DB_CONNECTION_STRING" ]; then
    echo -e "${RED}❌ Connection string não fornecida!${NC}"
    exit 1
fi

# Apply migrations
echo -e "\n${BLUE}🚀 Aplicando migrações...${NC}"

MIGRATION_DIR="docker-cloud/migrations"

if [ ! -d "$MIGRATION_DIR" ]; then
    echo -e "${RED}❌ Pasta de migrações não encontrada: $MIGRATION_DIR${NC}"
    exit 1
fi

for migration_file in $(ls -v $MIGRATION_DIR/*.sql 2>/dev/null); do
    echo -e "\n${YELLOW}📝 Aplicando: $(basename $migration_file)${NC}"
    
    if psql "$DB_CONNECTION_STRING" -f "$migration_file" 2>&1 | tee /tmp/migration_output.log; then
        echo -e "${GREEN}✅ $(basename $migration_file) aplicada com sucesso${NC}"
    else
        echo -e "${RED}❌ Erro ao aplicar $(basename $migration_file)${NC}"
        echo -e "${YELLOW}Verifique o log acima para detalhes${NC}"
        exit 1
    fi
done

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Todas as migrações aplicadas!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}Próximos passos:${NC}"
echo -e "1. Verifique as tabelas no SQL Editor"
echo -e "2. Configure os Edge Functions no Supabase Dashboard"
echo -e "3. Execute ./deploy.sh para fazer deploy da aplicação"
