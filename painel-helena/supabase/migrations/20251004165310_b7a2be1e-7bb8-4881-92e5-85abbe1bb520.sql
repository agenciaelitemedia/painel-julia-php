-- Step 1: Add 'team_member' to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'team_member';