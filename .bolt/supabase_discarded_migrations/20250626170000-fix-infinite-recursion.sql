
-- Fix infinite recursion in RLS policies by creating security definer functions
-- and updating policies to use them instead of direct table queries

-- Drop existing problematic policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND role = 'admin' 
    AND status = 'active'
    AND deleted_at IS NULL
  );
$$;

-- Create new, safer RLS policies for users table
CREATE POLICY "Users can view own record" ON public.users
  FOR SELECT 
  USING (auth_id = auth.uid());

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT
  USING (public.is_current_user_admin());

CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE
  USING (auth_id = auth.uid());

CREATE POLICY "Admins can update any user" ON public.users
  FOR UPDATE
  USING (public.is_current_user_admin());

CREATE POLICY "Service role can insert users" ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Also fix user_profiles policies to prevent similar issues
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.user_profiles;

CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT
  USING (public.is_current_user_admin());

CREATE POLICY "Service role can insert profiles" ON public.user_profiles
  FOR INSERT
  WITH CHECK (true);

-- Update existing security functions to use the new approach
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_advisor();
DROP FUNCTION IF EXISTS public.is_founder();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_current_user_admin();
$$;

CREATE OR REPLACE FUNCTION public.is_advisor()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND role = 'advisor' 
    AND deleted_at IS NULL
    AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_founder()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND role = 'founder' 
    AND deleted_at IS NULL
    AND status = 'active'
  );
$$;
