
-- Fix RLS policies to allow public application submissions
-- Drop existing policies that might be blocking public access
DROP POLICY IF EXISTS "Allow public application submissions" ON public.base_applications;
DROP POLICY IF EXISTS "Allow public founder details insertion" ON public.founder_application_details;
DROP POLICY IF EXISTS "Allow public advisor details insertion" ON public.advisor_application_details;

-- Create new policies that explicitly allow public inserts for applications
CREATE POLICY "Enable public application submissions" ON public.base_applications
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public inserts for founder application details
CREATE POLICY "Enable public founder details insertion" ON public.founder_application_details
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public inserts for advisor application details
CREATE POLICY "Enable public advisor details insertion" ON public.advisor_application_details
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Ensure authenticated users (admins) can read applications
CREATE POLICY "Authenticated users can read applications" ON public.base_applications
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to read application details
CREATE POLICY "Authenticated users can read founder details" ON public.founder_application_details
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read advisor details" ON public.advisor_application_details
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to update applications (for approval/rejection)
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
