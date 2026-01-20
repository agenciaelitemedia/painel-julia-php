-- Adicionar coluna metadata para armazenar informações extras (botões, mensagens citadas, etc)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT NULL;

-- Criar índice GIN para buscas eficientes em metadata
CREATE INDEX IF NOT EXISTS idx_messages_metadata ON messages USING GIN (metadata);

-- Comentário explicativo
COMMENT ON COLUMN messages.metadata IS 'Metadados da mensagem: botões, mensagens citadas, etc (formato JSON)';