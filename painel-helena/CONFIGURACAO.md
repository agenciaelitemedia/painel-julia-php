# 📱 Sistema de Atendimento WhatsApp

Sistema profissional de atendimento integrado com WhatsApp usando a API uazap.

## 🚀 Configuração

### 1. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com suas credenciais da API uazap:

```env
VITE_UAZAP_API_URL=https://api.uazap.com.br/v1
VITE_UAZAP_API_TOKEN=seu_token_aqui
```

### 2. Obtenha suas credenciais

- Acesse o painel da uazap
- Copie sua URL da API
- Gere um token de acesso
- Cole as informações no arquivo `.env`

## ✨ Funcionalidades

- ✅ Interface estilo WhatsApp Web
- ✅ Envio de mensagens de texto
- ✅ Envio de mídias (imagens, vídeos, documentos)
- ✅ Status de entrega das mensagens
- ✅ Busca de conversas
- ✅ Indicador de online/offline
- ✅ Contagem de mensagens não lidas
- ✅ Suporte para dark mode
- ✅ Design responsivo

## 🎨 Recursos da API Integrados

### Mensagens de Texto
- Envio simples de texto
- Preview de links
- Formatação básica
- Responder mensagens

### Mídias
- Imagens (JPG, PNG)
- Vídeos (MP4)
- Documentos (PDF, DOCX, XLSX)
- Áudio

### Gerenciamento de Chat
- Marcar como lido
- Arquivar conversas
- Silenciar notificações

## 🔧 Próximos Passos

1. **Configurar Webhook**: Para receber mensagens em tempo real
2. **Adicionar mais recursos**: 
   - Mensagens de voz (PTT)
   - Localização
   - Contatos (vCard)
   - Botões interativos
   - Carrosséis
3. **Implementar persistência**: Salvar conversas em banco de dados
4. **Adicionar autenticação**: Sistema de login para atendentes

## 📚 Documentação da API

A documentação completa da API uazap está no arquivo `api-uazapi.txt`.

## 🎯 Endpoints Principais

- `POST /send/text` - Enviar mensagem de texto
- `POST /send/media` - Enviar mídia
- `POST /chat/read` - Marcar como lido
- `POST /chat/archive` - Arquivar chat
- `POST /chat/mute` - Silenciar chat

## 💡 Dicas de Uso

1. Use o campo `delay` para simular digitação natural
2. Ative `readchat: true` para marcar conversas como lidas automaticamente
3. Use `replyid` para criar contexto nas conversas
4. Configure webhooks para receber mensagens em tempo real
