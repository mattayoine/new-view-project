
-- Step 1: Fix RLS policies for application submission
-- Ensure RLS is enabled but allow public inserts
ALTER TABLE public.base_applications ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow application submissions" ON public.base_applications;
DROP POLICY IF EXISTS "Authenticated users can read applications" ON public.base_applications;
DROP POLICY IF EXISTS "Only admins can update applications" ON public.base_applications;
DROP POLICY IF EXISTS "Allow anyone to submit applications" ON public.base_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.base_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.base_applications;

-- Create new policies that explicitly allow public access for inserts
CREATE POLICY "Allow public application submissions" ON public.base_applications
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow authenticated users (admins) to read all applications
CREATE POLICY "Authenticated users can read applications" ON public.base_applications
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users with admin role to update applications
CREATE POLICY "Admins can update applications" ON public.base_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() 
      AND role = 'admin' 
      AND status = 'active'
      AND deleted_at IS NULL
    )
  );

-- Fix RLS for application details tables
ALTER TABLE public.founder_application_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_application_details ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow founder details insertion" ON public.founder_application_details;
DROP POLICY IF EXISTS "Allow advisor details insertion" ON public.advisor_application_details;
DROP POLICY IF EXISTS "Authenticated users can read founder details" ON public.founder_application_details;
DROP POLICY IF EXISTS "Authenticated users can read advisor details" ON public.advisor_application_details;

-- Create public insert policies for application details
CREATE POLICY "Allow public founder details insertion" ON public.founder_application_details
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public advisor details insertion" ON public.advisor_application_details
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow authenticated users to read application details
CREATE POLICY "Authenticated users can read founder details" ON public.founder_application_details
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read advisor details" ON public.advisor_application_details
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure users table policies allow the edge function to create users
-- Drop and recreate user table policies to be more explicit
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Only system can insert users" ON public.users;

-- Allow service role to insert users (for edge function)
CREATE POLICY "Service role can insert users" ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT 
  USING (auth_id = auth.uid());

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() 
      AND role = 'admin' 
      AND status = 'active'
      AND deleted_at IS NULL
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  USING (auth_id = auth.uid());

-- Admins can update any user
CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() 
      AND role = 'admin' 
      AND status = 'active'
      AND deleted_at IS NULL
    )
  );

-- Fix user_profiles RLS policies to allow service role inserts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

-- Allow service role to insert profiles (for edge function)
CREATE POLICY "Service role can insert profiles" ON public.user_profiles
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() 
      AND role = 'admin' 
      AND status = 'active'
      AND deleted_at IS NULL
    )
  );
