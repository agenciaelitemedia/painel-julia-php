-- Adicionar coluna para armazenar configurações de tools dos agentes
ALTER TABLE julia_agents 
ADD COLUMN IF NOT EXISTS tools_config jsonb DEFAULT '{"enabled_tools": []}'::jsonb;

COMMENT ON COLUMN julia_agents.tools_config IS 'Configurações de tools habilitadas para o agente. Formato: {"enabled_tools": [{"tool_id": "booking", "enabled": true, "config": {...}}]}';