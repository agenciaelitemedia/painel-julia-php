-- Step 2: Insert missing roles for existing users
INSERT INTO user_roles (user_id, role)
SELECT u.id, u.role
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role = u.role
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 3: Add 'team_member' role for all users who are team members
INSERT INTO user_roles (user_id, role)
SELECT tm.user_id, 'team_member'::user_role
FROM team_members tm
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = tm.user_id AND ur.role = 'team_member'::user_role
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: Update user_has_module_permission function to handle team members properly
CREATE OR REPLACE FUNCTION public.user_has_module_permission(_user_id uuid, _module system_module)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_client_id UUID;
  is_admin BOOLEAN;
  is_team_member BOOLEAN;
BEGIN
  -- Check if user is admin
  is_admin := public.has_role(_user_id, 'admin');
  IF is_admin THEN
    RETURN true;
  END IF;

  -- Get user's client_id
  SELECT client_id INTO user_client_id FROM users WHERE id = _user_id;
  
  IF user_client_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if user is a team member
  is_team_member := public.has_role(_user_id, 'team_member');

  -- If team member, check team_member_permissions
  IF is_team_member THEN
    RETURN EXISTS (
      SELECT 1 
      FROM team_member_permissions tmp
      JOIN team_members tm ON tm.id = tmp.team_member_id
      WHERE tm.user_id = _user_id 
      AND tm.client_id = user_client_id
      AND tmp.module = _module
      AND tm.is_active = true
    );
  END IF;

  -- Check if user has client role and client has permission
  IF public.has_role(_user_id, 'client') THEN
    RETURN EXISTS (
      SELECT 1 FROM client_permissions 
      WHERE client_id = user_client_id 
      AND module = _module
    );
  END IF;

  RETURN false;
END;
$function$;