
-- Phase 1: Critical Authentication & Database Fixes
-- Fix the user management system and consolidate user profiles

-- First, let's clean up the broken application tables and consolidate them
DROP TABLE IF EXISTS public.base_applications_broken CASCADE;
DROP TABLE IF EXISTS public.founder_application_details_broken CASCADE;
DROP TABLE IF EXISTS public.advisor_application_details_broken CASCADE;

-- Fix the user_profiles table to have proper auth_id reference
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create unique index on auth_id if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_auth_id ON public.user_profiles(auth_id);

-- Update existing user_profiles to link with auth_id where possible
UPDATE public.user_profiles 
SET auth_id = u.auth_id 
FROM public.users u 
WHERE public.user_profiles.user_id = u.id 
AND public.user_profiles.auth_id IS NULL;

-- Fix the foreign key relationships in advisor_profiles and founder_profiles
-- These should reference user_profiles.id, not users.id directly
ALTER TABLE public.advisor_profiles 
DROP CONSTRAINT IF EXISTS advisor_profiles_user_id_fkey;

ALTER TABLE public.founder_profiles 
DROP CONSTRAINT IF EXISTS founder_profiles_user_id_fkey;

-- Add proper foreign key constraints
ALTER TABLE public.advisor_profiles 
ADD CONSTRAINT advisor_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.founder_profiles 
ADD CONSTRAINT founder_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Fix RLS policies for user_profiles to use auth_id properly
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth_id = auth.uid() OR is_admin());

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth_id = auth.uid()) WITH CHECK (auth_id = auth.uid());

-- Fix application approval process - make it atomic
-- Create a proper function for application approval that handles everything
CREATE OR REPLACE FUNCTION public.approve_application_atomic(
  p_application_id UUID,
  p_reviewer_id UUID
) RETURNS JSON AS $$
DECLARE
  v_application RECORD;
  v_user_id UUID;
  v_auth_user_id UUID;
  v_profile_id UUID;
  v_result JSON;
BEGIN
  -- Start transaction (implicit in function)
  
  -- Get application details
  SELECT * INTO v_application 
  FROM public.base_applications 
  WHERE id = p_application_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Application not found or already processed');
  END IF;
  
  -- Check if user already exists in auth
  SELECT id INTO v_auth_user_id 
  FROM auth.users 
  WHERE email = v_application.email;
  
  -- If user doesn't exist in auth, we need the edge function to handle this
  IF v_auth_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Auth user must be created first');
  END IF;
  
  -- Create or update user record
  INSERT INTO public.users (auth_id, email, role, status, profile_completed)
  VALUES (v_auth_user_id, v_application.email, v_application.type, 'active', true)
  ON CONFLICT (auth_id) DO UPDATE SET
    role = v_application.type,
    status = 'active',
    profile_completed = true,
    updated_at = now()
  RETURNING id INTO v_user_id;
  
  -- Create user profile
  INSERT INTO public.user_profiles (user_id, auth_id, profile_type, profile_data, is_profile_complete)
  VALUES (
    v_user_id, 
    v_auth_user_id,
    v_application.type,
    json_build_object(
      'name', v_application.name,
      'location', v_application.location,
      'email', v_application.email
    ),
    true
  )
  ON CONFLICT (auth_id) DO UPDATE SET
    profile_type = v_application.type,
    profile_data = json_build_object(
      'name', v_application.name,
      'location', v_application.location,
      'email', v_application.email
    ),
    is_profile_complete = true,
    updated_at = now()
  RETURNING id INTO v_profile_id;
  
  -- Create type-specific profile
  IF v_application.type = 'founder' THEN
    -- Get founder details
    INSERT INTO public.founder_profiles (user_id, startup_name, website, sector, stage, current_challenge)
    SELECT 
      v_profile_id,
      COALESCE(fad.startup_name, 'TBD'),
      fad.website,
      fad.sector,
      fad.stage,
      fad.current_challenge
    FROM public.founder_application_details fad
    WHERE fad.base_application_id = p_application_id
    ON CONFLICT (user_id) DO UPDATE SET
      startup_name = EXCLUDED.startup_name,
      website = EXCLUDED.website,
      sector = EXCLUDED.sector,
      stage = EXCLUDED.stage,
      current_challenge = EXCLUDED.current_challenge,
      updated_at = now();
      
  ELSIF v_application.type = 'advisor' THEN
    -- Get advisor details
    INSERT INTO public.advisor_profiles (user_id, linkedin_url, areas_of_expertise, experience_level, timezone_availability)
    SELECT 
      v_profile_id,
      aad.linkedin_url,
      aad.areas_of_expertise,
      aad.experience_level,
      aad.timezone_availability
    FROM public.advisor_application_details aad
    WHERE aad.base_application_id = p_application_id
    ON CONFLICT (user_id) DO UPDATE SET
      linkedin_url = EXCLUDED.linkedin_url,
      areas_of_expertise = EXCLUDED.areas_of_expertise,
      experience_level = EXCLUDED.experience_level,
      timezone_availability = EXCLUDED.timezone_availability,
      updated_at = now();
  END IF;
  
  -- Update application status
  UPDATE public.base_applications 
  SET 
    status = 'approved',
    reviewed_by = p_reviewer_id,
    reviewed_at = now(),
    updated_at = now()
  WHERE id = p_application_id;
  
  -- Create welcome notification
  INSERT INTO public.notifications (user_id, type, title, message, priority)
  VALUES (
    v_user_id,
    'application_approved',
    'Welcome to Tseer!',
    'Your application has been approved. You can now access the platform.',
    'high'
  );
  
  RETURN json_build_object(
    'success', true, 
    'user_id', v_user_id,
    'profile_id', v_profile_id,
    'auth_user_id', v_auth_user_id
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix RLS policies on base_applications to allow public inserts but secure reads
ALTER TABLE public.base_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public application submissions" ON public.base_applications;
DROP POLICY IF EXISTS "Authenticated users can read applications" ON public.base_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.base_applications;

CREATE POLICY "Allow public application submissions" ON public.base_applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage applications" ON public.base_applications
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Fix RLS policies for application details tables
ALTER TABLE public.founder_application_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_application_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public founder details insertion" ON public.founder_application_details;
DROP POLICY IF EXISTS "Allow public advisor details insertion" ON public.advisor_application_details;

CREATE POLICY "Allow public founder details insertion" ON public.founder_application_details
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public advisor details insertion" ON public.advisor_application_details
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read founder details" ON public.founder_application_details
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can read advisor details" ON public.advisor_application_details
  FOR SELECT USING (is_admin());

-- Update the security functions to be more robust
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users 
  WHERE auth_id = auth.uid() 
  AND deleted_at IS NULL
  AND status = 'active'
  LIMIT 1;
$$;

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id_active ON public.users(auth_id) WHERE deleted_at IS NULL AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_id_active ON public.user_profiles(auth_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_assignment_active ON public.sessions(assignment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assignments_active ON public.advisor_founder_assignments(advisor_id, founder_id) WHERE deleted_at IS NULL AND status = 'active';

-- Clean up materialized view dependencies
DROP MATERIALIZED VIEW IF EXISTS public.dashboard_metrics CASCADE;

-- Create a more robust dashboard metrics view
CREATE MATERIALIZED VIEW public.dashboard_metrics AS
SELECT 
  'total_users'::text as metric_name,
  COUNT(*)::bigint as metric_value,
  now() as last_updated
FROM public.users 
WHERE deleted_at IS NULL

UNION ALL

SELECT 
  'active_users'::text as metric_name,
  COUNT(*)::bigint as metric_value,
  now() as last_updated
FROM public.users 
WHERE deleted_at IS NULL AND status = 'active'

UNION ALL

SELECT 
  'pending_applications'::text as metric_name,
  COUNT(*)::bigint as metric_value,
  now() as last_updated
FROM public.base_applications 
WHERE status = 'pending'

UNION ALL

SELECT 
  'active_sessions'::text as metric_name,
  COUNT(*)::bigint as metric_value,
  now() as last_updated
FROM public.sessions 
WHERE deleted_at IS NULL AND status IN ('scheduled', 'in_progress')

UNION ALL

SELECT 
  'completed_sessions'::text as metric_name,
  COUNT(*)::bigint as metric_value,
  now() as last_updated
FROM public.sessions 
WHERE deleted_at IS NULL AND status = 'completed';

-- Create index on materialized view
CREATE UNIQUE INDEX idx_dashboard_metrics_name ON public.dashboard_metrics(metric_name);

-- Update the refresh function
CREATE OR REPLACE FUNCTION public.refresh_dashboard_metrics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.dashboard_metrics;
EXCEPTION WHEN OTHERS THEN
  -- If concurrent refresh fails, do regular refresh
  REFRESH MATERIALIZED VIEW public.dashboard_metrics;
END;
$$;
