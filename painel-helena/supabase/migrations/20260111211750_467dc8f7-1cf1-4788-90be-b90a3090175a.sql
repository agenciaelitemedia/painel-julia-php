-- Add Helena sync columns to ticket_sectors
ALTER TABLE ticket_sectors 
ADD COLUMN IF NOT EXISTS helena_department_id UUID,
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Unique index for Helena department sync
CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_sectors_helena_dept 
ON ticket_sectors(helena_count_id, helena_department_id) 
WHERE helena_department_id IS NOT NULL;

-- Add Helena sync columns to ticket_team_members
ALTER TABLE ticket_team_members 
ADD COLUMN IF NOT EXISTS helena_agent_id UUID,
ADD COLUMN IF NOT EXISTS helena_user_id UUID,
ADD COLUMN IF NOT EXISTS is_supervisor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Unique index for Helena agent sync
CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_team_members_helena_agent 
ON ticket_team_members(helena_count_id, helena_agent_id) 
WHERE helena_agent_id IS NOT NULL;