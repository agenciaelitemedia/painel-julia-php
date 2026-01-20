-- Habilitar realtime para agent_conversations
ALTER PUBLICATION supabase_realtime ADD TABLE agent_conversations;

-- Habilitar realtime para julia_agents  
ALTER PUBLICATION supabase_realtime ADD TABLE julia_agents;