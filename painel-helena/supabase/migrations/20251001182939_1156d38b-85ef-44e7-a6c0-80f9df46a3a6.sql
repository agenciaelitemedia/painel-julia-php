-- Criar tabela de contatos
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  status VARCHAR(100),
  tags TEXT[],
  is_archived BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de mensagens
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  message_id VARCHAR(100),
  text TEXT,
  type VARCHAR(50) DEFAULT 'text',
  media_url TEXT,
  file_name TEXT,
  caption TEXT,
  from_me BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'sent',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reply_to VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON public.messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON public.messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);
CREATE INDEX IF NOT EXISTS idx_messages_message_id ON public.messages(message_id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at em contacts
DROP TRIGGER IF EXISTS update_contacts_updated_at ON public.contacts;
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: permitir acesso público para leitura (sistema de atendimento)
-- Em produção, você pode adicionar autenticação para atendentes
CREATE POLICY "Permitir leitura pública de contatos"
  ON public.contacts FOR SELECT
  USING (true);

CREATE POLICY "Permitir leitura pública de mensagens"
  ON public.messages FOR SELECT
  USING (true);

-- Permitir inserção pública (webhook vai inserir dados)
CREATE POLICY "Permitir inserção pública de contatos"
  ON public.contacts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir inserção pública de mensagens"
  ON public.messages FOR INSERT
  WITH CHECK (true);

-- Permitir atualização pública de contatos
CREATE POLICY "Permitir atualização pública de contatos"
  ON public.contacts FOR UPDATE
  USING (true);

-- Permitir atualização pública de mensagens
CREATE POLICY "Permitir atualização pública de mensagens"
  ON public.messages FOR UPDATE
  USING (true);

-- Habilitar Realtime nas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;