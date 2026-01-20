-- Add notification fields to whatsapp_instances
ALTER TABLE whatsapp_instances 
ADD COLUMN IF NOT EXISTS is_notifications BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_default_notification BOOLEAN DEFAULT false;

-- Create unique constraint to ensure only one default notification connection
CREATE UNIQUE INDEX IF NOT EXISTS unique_default_notification 
ON whatsapp_instances (is_default_notification) 
WHERE is_default_notification = true;

-- Remove old system instance constraint and column (migrating to new system)
DROP INDEX IF EXISTS unique_system_instance;
ALTER TABLE whatsapp_instances DROP COLUMN IF EXISTS is_system_instance;

-- Function to prevent deletion of default notification connection
CREATE OR REPLACE FUNCTION prevent_default_notification_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_default_notification = true THEN
    RAISE EXCEPTION 'Cannot delete default notification connection. Set another connection as default first.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent deletion
DROP TRIGGER IF EXISTS check_default_notification_deletion ON whatsapp_instances;
CREATE TRIGGER check_default_notification_deletion
  BEFORE DELETE ON whatsapp_instances
  FOR EACH ROW
  EXECUTE FUNCTION prevent_default_notification_deletion();

-- Function to prevent disabling notifications on default connection
CREATE OR REPLACE FUNCTION prevent_default_notification_disable()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_default_notification = true AND NEW.is_notifications = false THEN
    RAISE EXCEPTION 'Cannot disable notifications on default connection. Set another connection as default first.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent disabling
DROP TRIGGER IF EXISTS check_default_notification_disable ON whatsapp_instances;
CREATE TRIGGER check_default_notification_disable
  BEFORE UPDATE ON whatsapp_instances
  FOR EACH ROW
  EXECUTE FUNCTION prevent_default_notification_disable();

-- Add comment for clarity
COMMENT ON COLUMN whatsapp_instances.is_notifications IS 'Indicates if this connection can be used for system notifications';
COMMENT ON COLUMN whatsapp_instances.is_default_notification IS 'Indicates if this is the default connection for notifications (only one allowed)';