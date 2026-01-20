-- ============================================
-- CRITICAL SECURITY FIXES
-- ============================================

-- 1. CREATE USER ROLES TABLE (Fix Privilege Escalation)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Migrate existing role data from users table
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.users
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. CREATE SECURITY DEFINER FUNCTION FOR ROLE CHECKS
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 3. UPDATE EXISTING FUNCTIONS WITH SECURE search_path
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = $1 LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_client_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id FROM public.users WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.user_has_module_permission(_user_id uuid, _module system_module)
RETURNS boolean
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_client_id UUID;
  is_admin BOOLEAN;
BEGIN
  -- Check if user is admin using new has_role function
  is_admin := public.has_role(_user_id, 'admin');
  IF is_admin THEN
    RETURN true;
  END IF;

  -- Get user's client_id
  SELECT client_id INTO user_client_id FROM users WHERE id = _user_id;
  
  IF user_client_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if user has client role and client has permission
  IF public.has_role(_user_id, 'client') THEN
    RETURN EXISTS (
      SELECT 1 FROM client_permissions 
      WHERE client_id = user_client_id 
      AND module = _module
    );
  END IF;

  -- Check team member permissions
  RETURN EXISTS (
    SELECT 1 
    FROM team_member_permissions tmp
    JOIN team_members tm ON tm.id = tmp.team_member_id
    WHERE tm.user_id = _user_id 
    AND tm.client_id = user_client_id
    AND tmp.module = _module
    AND tm.is_active = true
  );
END;
$$;

-- 4. UPDATE ALL RLS POLICIES TO USE has_role()
-- ============================================

-- USER ROLES TABLE POLICIES
CREATE POLICY "Admins can view all user roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all user roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- CLIENTS TABLE POLICIES (with explicit DENY for unauthorized users)
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Clients can view their own data" ON public.clients;
DROP POLICY IF EXISTS "Admins can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can update clients" ON public.clients;

CREATE POLICY "Admins can view all clients"
ON public.clients FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view their own data"
ON public.clients FOR SELECT
TO authenticated
USING (id = get_user_client_id(auth.uid()) AND public.has_role(auth.uid(), 'client'));

CREATE POLICY "Admins can insert clients"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update clients"
ON public.clients FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- CLIENT PERMISSIONS POLICIES
DROP POLICY IF EXISTS "Admins can manage all client permissions" ON public.client_permissions;
DROP POLICY IF EXISTS "Clients can view their own permissions" ON public.client_permissions;

CREATE POLICY "Admins can manage all client permissions"
ON public.client_permissions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view their own permissions"
ON public.client_permissions FOR SELECT
TO authenticated
USING (client_id = get_user_client_id(auth.uid()));

-- CONTACTS TABLE POLICIES (ADD MISSING DELETE POLICY)
DROP POLICY IF EXISTS "Users can view their client contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert their client contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update their client contacts" ON public.contacts;

CREATE POLICY "Users can view their client contacts"
ON public.contacts FOR SELECT
TO authenticated
USING ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their client contacts"
ON public.contacts FOR INSERT
TO authenticated
WITH CHECK ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their client contacts"
ON public.contacts FOR UPDATE
TO authenticated
USING ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their client contacts"
ON public.contacts FOR DELETE
TO authenticated
USING ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

-- USERS TABLE POLICIES (PREVENT ROLE UPDATES)
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own profile"
ON public.users FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can insert users"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update users"
ON public.users FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can update their own profile but NOT the role column
CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.users WHERE id = auth.uid()));

-- TEAM MEMBERS POLICIES
DROP POLICY IF EXISTS "Admins can view all team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can manage all team members" ON public.team_members;
DROP POLICY IF EXISTS "Clients can manage their team members" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view their own record" ON public.team_members;

CREATE POLICY "Admins can view all team members"
ON public.team_members FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all team members"
ON public.team_members FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can manage their team members"
ON public.team_members FOR ALL
TO authenticated
USING (client_id = get_user_client_id(auth.uid()) AND public.has_role(auth.uid(), 'client'));

CREATE POLICY "Team members can view their own record"
ON public.team_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- TEAM MEMBER PERMISSIONS POLICIES
DROP POLICY IF EXISTS "Admins can view all team permissions" ON public.team_member_permissions;
DROP POLICY IF EXISTS "Admins can manage all team permissions" ON public.team_member_permissions;
DROP POLICY IF EXISTS "Clients can manage their team permissions" ON public.team_member_permissions;
DROP POLICY IF EXISTS "Team members can view their own permissions" ON public.team_member_permissions;

CREATE POLICY "Admins can view all team permissions"
ON public.team_member_permissions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all team permissions"
ON public.team_member_permissions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can manage their team permissions"
ON public.team_member_permissions FOR ALL
TO authenticated
USING (team_member_id IN (
  SELECT id FROM team_members 
  WHERE client_id = get_user_client_id(auth.uid())
));

CREATE POLICY "Team members can view their own permissions"
ON public.team_member_permissions FOR SELECT
TO authenticated
USING (team_member_id IN (
  SELECT id FROM team_members WHERE user_id = auth.uid()
));

-- CRM TABLES POLICIES
DROP POLICY IF EXISTS "Users can view their client activities" ON public.crm_activities;
DROP POLICY IF EXISTS "Users can insert their client activities" ON public.crm_activities;

CREATE POLICY "Users can view their client activities"
ON public.crm_activities FOR SELECT
TO authenticated
USING ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their client activities"
ON public.crm_activities FOR INSERT
TO authenticated
WITH CHECK ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view their client deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can insert their client deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can update their client deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can delete their client deals" ON public.crm_deals;

CREATE POLICY "Users can view their client deals"
ON public.crm_deals FOR SELECT
TO authenticated
USING ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their client deals"
ON public.crm_deals FOR INSERT
TO authenticated
WITH CHECK ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their client deals"
ON public.crm_deals FOR UPDATE
TO authenticated
USING ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their client deals"
ON public.crm_deals FOR DELETE
TO authenticated
USING ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view their client pipelines" ON public.crm_pipelines;
DROP POLICY IF EXISTS "Users can insert their client pipelines" ON public.crm_pipelines;
DROP POLICY IF EXISTS "Users can update their client pipelines" ON public.crm_pipelines;
DROP POLICY IF EXISTS "Users can delete their client pipelines" ON public.crm_pipelines;

CREATE POLICY "Users can view their client pipelines"
ON public.crm_pipelines FOR SELECT
TO authenticated
USING ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their client pipelines"
ON public.crm_pipelines FOR INSERT
TO authenticated
WITH CHECK ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their client pipelines"
ON public.crm_pipelines FOR UPDATE
TO authenticated
USING ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their client pipelines"
ON public.crm_pipelines FOR DELETE
TO authenticated
USING ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

-- MESSAGES POLICIES
DROP POLICY IF EXISTS "Users can view their client messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their client messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their client messages" ON public.messages;

CREATE POLICY "Users can view their client messages"
ON public.messages FOR SELECT
TO authenticated
USING ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their client messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their client messages"
ON public.messages FOR UPDATE
TO authenticated
USING ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

-- SETTINGS POLICIES
DROP POLICY IF EXISTS "Users can view their client settings" ON public.settings;
DROP POLICY IF EXISTS "Users can insert their client settings" ON public.settings;
DROP POLICY IF EXISTS "Users can update their client settings" ON public.settings;

CREATE POLICY "Users can view their client settings"
ON public.settings FOR SELECT
TO authenticated
USING ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their client settings"
ON public.settings FOR INSERT
TO authenticated
WITH CHECK ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their client settings"
ON public.settings FOR UPDATE
TO authenticated
USING ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

-- WHATSAPP INSTANCES POLICIES
DROP POLICY IF EXISTS "Users can view their client instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can insert their client instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can update their client instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can delete their client instances" ON public.whatsapp_instances;

CREATE POLICY "Users can view their client instances"
ON public.whatsapp_instances FOR SELECT
TO authenticated
USING ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their client instances"
ON public.whatsapp_instances FOR INSERT
TO authenticated
WITH CHECK ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their client instances"
ON public.whatsapp_instances FOR UPDATE
TO authenticated
USING ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their client instances"
ON public.whatsapp_instances FOR DELETE
TO authenticated
USING ((client_id = get_user_client_id(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

-- 5. UPDATE TRIGGER TO USE user_roles TABLE
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  
  -- Insert role into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  
  RETURN NEW;
END;
$$;