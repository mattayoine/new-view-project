
-- COMPLETE RLS POLICY CLEANUP AND RESET
-- Drop ALL existing policies that could be conflicting

-- Drop all policies on base_applications
DROP POLICY IF EXISTS "Allow public application submissions" ON public.base_applications;
DROP POLICY IF EXISTS "Enable public application submissions" ON public.base_applications;
DROP POLICY IF EXISTS "Allow application submissions" ON public.base_applications;
DROP POLICY IF EXISTS "Authenticated users can read applications" ON public.base_applications;
DROP POLICY IF EXISTS "Only admins can update applications" ON public.base_applications;
DROP POLICY IF EXISTS "Allow anyone to submit applications" ON public.base_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.base_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.base_applications;

-- Drop all policies on founder_application_details
DROP POLICY IF EXISTS "Allow public founder details insertion" ON public.founder_application_details;
DROP POLICY IF EXISTS "Enable public founder details insertion" ON public.founder_application_details;
DROP POLICY IF EXISTS "Allow founder details insertion" ON public.founder_application_details;
DROP POLICY IF EXISTS "Authenticated users can read founder details" ON public.founder_application_details;

-- Drop all policies on advisor_application_details
DROP POLICY IF EXISTS "Allow public advisor details insertion" ON public.advisor_application_details;
DROP POLICY IF EXISTS "Enable public advisor details insertion" ON public.advisor_application_details;
DROP POLICY IF EXISTS "Allow advisor details insertion" ON public.advisor_application_details;
DROP POLICY IF EXISTS "Authenticated users can read advisor details" ON public.advisor_application_details;

-- Ensure RLS is enabled on all tables
ALTER TABLE public.base_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_application_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_application_details ENABLE ROW LEVEL SECURITY;

-- Create CLEAN, NON-CONFLICTING policies
-- Policy 1: Allow anyone (public) to INSERT applications
CREATE POLICY "public_can_insert_applications" ON public.base_applications
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy 2: Allow authenticated users to SELECT applications
CREATE POLICY "authenticated_can_select_applications" ON public.base_applications
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 3: Allow admins to UPDATE applications
CREATE POLICY "admins_can_update_applications" ON public.base_applications
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

-- Policy 4: Allow anyone to INSERT founder details
CREATE POLICY "public_can_insert_founder_details" ON public.founder_application_details
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy 5: Allow authenticated users to SELECT founder details
CREATE POLICY "authenticated_can_select_founder_details" ON public.founder_application_details
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 6: Allow anyone to INSERT advisor details
CREATE POLICY "public_can_insert_advisor_details" ON public.advisor_application_details
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy 7: Allow authenticated users to SELECT advisor details
CREATE POLICY "authenticated_can_select_advisor_details" ON public.advisor_application_details
  FOR SELECT
  TO authenticated
  USING (true);
