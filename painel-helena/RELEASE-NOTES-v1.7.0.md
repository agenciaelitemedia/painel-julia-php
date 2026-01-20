# Release Notes v1.7.0

## 📋 Resumo Executivo

Esta versão traz melhorias significativas no controle de conversas com agentes IA, incluindo comando de reinício, filtros de início de conversa e aprimoramento na composição de prompts para agentes customizados.

---

## ✨ Novas Funcionalidades

### 1. Comando #recomeçar para Reiniciar Conversas

**Descrição:**
- Implementação de comando especial `#recomecar` (sem acento) que permite usuários reiniciarem conversas com agentes via WhatsApp
- O comando é processado antes do processamento pelo agente IA
- Limpa todo histórico de mensagens e contexto da conversa

**Funcionamento:**
- Usuário envia `#recomecar` no chat do WhatsApp
- Sistema detecta o comando antes de enviar para o agente
- Limpa tabela `agent_conversation_messages` para aquela conversa
- Reseta campos `messages` e `metadata` na tabela `agent_conversations`
- Envia mensagem de confirmação: "Conversa reiniciada com sucesso! 🔄"
- Funciona para todos os agentes (Julia e Custom) associados ao contato

**Benefícios:**
- Permite recomeçar conversas sem precisar criar novo contato
- Útil quando usuário quer mudar completamente de assunto
- Mantém o mesmo contato mas com histórico limpo
- Experiência mais fluida para o usuário final

**Arquivo Modificado:**
- `supabase/functions/whatsapp-webhook/index.ts`

---

### 2. Controle de Início de Conversa por Frases Específicas

**Descrição:**
- Nova funcionalidade que permite configurar agentes para iniciar conversas apenas quando a primeira mensagem do usuário corresponde a frases específicas
- Configurável por agente individual
- Suporta dois tipos de correspondência: "exata" (equals) ou "contém" (contains)

**Configuração:**
O campo `start_conversation_phrases` no `julia_agents` já existia e agora está funcional:

```json
{
  "enabled": true,
  "phrases": ["olá", "oi", "bom dia", "quero falar"],
  "match_type": "contains"  // ou "equals"
}
```

**Funcionamento:**
- Sistema verifica se é a primeira mensagem do usuário na conversa
- Se `enabled: true` e frases definidas, valida se a mensagem corresponde
- **match_type: "contains"**: Verifica se alguma frase está contida na mensagem (case-insensitive)
- **match_type: "equals"**: Verifica se a mensagem é exatamente igual a alguma frase (case-insensitive)
- Se não corresponder, agente NÃO processa a mensagem
- Se corresponder ou se configuração desabilitada, agente processa normalmente

**Casos de Uso:**
- Agentes especializados que só devem responder a gatilhos específicos
- Segmentação de atendimento por palavras-chave
- Evitar ativação acidental de agentes
- Múltiplos agentes na mesma instância com gatilhos diferentes

**Exemplo Prático:**
```json
// Agente de Vendas
{
  "enabled": true,
  "phrases": ["quero comprar", "preço", "orçamento"],
  "match_type": "contains"
}

// Agente de Suporte
{
  "enabled": true,
  "phrases": ["ajuda", "suporte", "problema"],
  "match_type": "contains"
}
```

**Arquivo Modificado:**
- `supabase/functions/whatsapp-webhook/index.ts`

---

## 🔧 Melhorias

### 3. Composição Aprimorada de Prompts para Agentes Custom

**Descrição:**
- Agentes customizados agora combinam automaticamente os campos `agent_bio` e `custom_prompt` para criar o prompt completo do sistema
- Anteriormente apenas um campo era utilizado

**Funcionamento:**
```typescript
// Lógica implementada:
if (agent_bio && custom_prompt) {
  systemContent = `${agent_bio}\n\n${custom_prompt}`;
} else if (agent_bio) {
  systemContent = agent_bio;
} else if (custom_prompt) {
  systemContent = custom_prompt;
} else {
  systemContent = 'Você é um assistente virtual inteligente...';
}

// Adiciona data de hoje no início
systemContent = `Hoje é: ${data}\n\n${systemContent}`;
```

**Campos:**
- **agent_bio**: Biografia/contexto do agente (quem ele é, sua personalidade)
- **custom_prompt**: Instruções principais e comportamentos específicos

**Ordem de Composição:**
1. Data de hoje (sempre no início para agentes custom)
2. Bio do agente
3. Prompt customizado principal

**Benefícios:**
- Separação clara entre identidade (bio) e instruções (prompt)
- Mais flexibilidade na configuração de agentes
- Prompts mais organizados e reutilizáveis
- Bio pode ser reaproveitada em diferentes configurações

**Exemplo:**
```
Bio: "Você é Maria, assistente virtual da Loja XYZ. Você é atenciosa, profissional e sempre busca ajudar os clientes da melhor forma."

Custom Prompt: "Suas principais funções são: informar preços, horários de funcionamento e tirar dúvidas sobre produtos. Sempre pergunte o nome do cliente no início da conversa."

Prompt Final Enviado à IA:
"Hoje é: 14 de outubro de 2025

Você é Maria, assistente virtual da Loja XYZ. Você é atenciosa, profissional e sempre busca ajudar os clientes da melhor forma.

Suas principais funções são: informar preços, horários de funcionamento e tirar dúvidas sobre produtos. Sempre pergunte o nome do cliente no início da conversa."
```

**Arquivo Modificado:**
- `supabase/functions/ai-agent-handler/index.ts`

---

## 📝 Arquivos Modificados

### Backend (Edge Functions)
- `supabase/functions/whatsapp-webhook/index.ts`
  - Adicionado processamento de comando `#recomecar`
  - Implementada validação de frases de início de conversa
  
- `supabase/functions/ai-agent-handler/index.ts`
  - Melhorada composição de prompts para agentes custom
  - Combinação de `agent_bio` + `custom_prompt`

---

## 🎯 Impacto das Mudanças

### Funcionalidade
- ✅ Maior controle sobre início e reinício de conversas
- ✅ Segmentação mais precisa de agentes por gatilhos
- ✅ Prompts mais organizados e profissionais

### Experiência do Usuário
- ✅ Comando simples para reiniciar conversas
- ✅ Respostas apenas quando apropriado (gatilhos)
- ✅ Agentes com personalidade mais definida

### Técnico
- ✅ Código mais organizado e manutenível
- ✅ Separação clara de responsabilidades (bio vs prompt)
- ✅ Validações robustas antes de processar mensagens

---

## 📊 Estatísticas da Release

- **Arquivos Modificados**: 2
- **Novas Funcionalidades**: 2
- **Melhorias**: 1
- **Linhas Adicionadas**: ~120
- **Complexidade**: Média

---

## 🚀 Próximos Passos Sugeridos

Para v1.7.1 ou v1.8.0:
- Interface UI para configurar frases de início de conversa
- Histórico de conversas reiniciadas
- Analytics de uso do comando `#recomecar`
- Suporte a múltiplos comandos especiais
- Exportação de conversas antes de reiniciar
- Confirmação antes de reiniciar (opcional)

---

## ⚠️ Avisos Importantes

### Para Administradores
- ✅ O comando `#recomecar` é **case-insensitive** (funciona com maiúsculas/minúsculas)
- ✅ Frases de início de conversa também são **case-insensitive**
- ⚠️ Ao habilitar filtros de início, certifique-se de incluir variações comuns das frases
- ⚠️ Agentes sem configuração de início continuam respondendo a todas mensagens

### Para Desenvolvedores
- 📌 Campo `start_conversation_phrases` já existe no schema, apenas ativado funcionalmente
- 📌 Comando de reinício processa antes de qualquer lógica de agente
- 📌 Bio e custom_prompt são opcionais, sistema usa fallback se não definidos
- 📌 Data é sempre adicionada para agentes custom, não para Julia

---

## ✅ Conclusão

A versão 1.7.0 traz melhorias significativas no controle e personalização de agentes IA, com foco em:
- **Controle**: Comando para reiniciar conversas
- **Precisão**: Filtros de início por frases específicas  
- **Qualidade**: Prompts mais bem estruturados e profissionais

Atualização **recomendada** para todos os clientes que desejam maior controle sobre suas conversas automatizadas.

---

**Data de Release**: 14 de outubro de 2025  
**Versão**: 1.7.0  
**Tipo**: Feature Release  
**Criticidade**: Média
