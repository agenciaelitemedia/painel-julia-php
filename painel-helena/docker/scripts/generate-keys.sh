#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🔐 Gerador de Chaves de Segurança${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Gerando chaves aleatórias...${NC}\n"

# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
SECRET_KEY_BASE=$(openssl rand -base64 32)
DB_ENC_KEY=$(openssl rand -base64 32)

echo -e "${BLUE}Adicione estas chaves ao seu arquivo .env:${NC}\n"

echo -e "${GREEN}# JWT e Secrets${NC}"
echo "JWT_SECRET=${JWT_SECRET}"
echo "SECRET_KEY_BASE=${SECRET_KEY_BASE}"
echo "DB_ENC_KEY=${DB_ENC_KEY}"

echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}Para gerar ANON_KEY e SERVICE_ROLE_KEY:${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "Acesse: ${BLUE}https://supabase.com/docs/guides/api/api-keys${NC}"
echo -e "Ou use o Supabase CLI: ${BLUE}supabase gen keys${NC}"

echo -e "\n${GREEN}✅ Chaves geradas com sucesso!${NC}"
