-- Allow admins to manage all team members and permissions
DROP POLICY IF EXISTS "Admins can manage all team members" ON public.team_members;
CREATE POLICY "Admins can manage all team members"
ON public.team_members
FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can manage all team permissions" ON public.team_member_permissions;
CREATE POLICY "Admins can manage all team permissions"
ON public.team_member_permissions
FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');