-- Add session_id column to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS session_id TEXT;