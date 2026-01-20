-- Add new fields to julia_agents table for custom agent enhancements
ALTER TABLE julia_agents 
ADD COLUMN IF NOT EXISTS release_customization boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS agent_bio text,
ADD COLUMN IF NOT EXISTS start_conversation_phrases jsonb DEFAULT '{"enabled": false, "match_type": "contains", "phrases": []}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN julia_agents.release_customization IS 'If true, allows custom prompt editing. If false, uses default prompt from database without client editing.';
COMMENT ON COLUMN julia_agents.agent_bio IS 'Agent bio/personality description (max 200 chars) - like Instagram bio with name, address, social media';
COMMENT ON COLUMN julia_agents.start_conversation_phrases IS 'Configuration for starting conversations only if first message matches defined phrases. Format: {"enabled": boolean, "match_type": "contains" | "equals", "phrases": [string]}';

-- Update existing custom_prompt column comment
COMMENT ON COLUMN julia_agents.custom_prompt IS 'Custom prompt for agent (max 1000 chars) - only editable if release_customization is true';