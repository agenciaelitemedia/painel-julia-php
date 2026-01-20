-- Add configuration fields to julia_agents table
ALTER TABLE julia_agents
ADD COLUMN IF NOT EXISTS selected_julia_code text,
ADD COLUMN IF NOT EXISTS custom_prompt text;