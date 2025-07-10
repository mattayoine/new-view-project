-- Phase 2: Core Infrastructure - Authentication and Profile System

-- 1. Create comprehensive user profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('founder', 'advisor', 'admin')),
  profile_data JSONB NOT NULL DEFAULT '{}',
  avatar_url TEXT,
  is_profile_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (user_id = get_current_user_id());

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (is_admin());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_type ON public.user_profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_complete ON public.user_profiles(is_profile_complete);

-- Add trigger for updated_at
CREATE OR REPLACE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create advisor_profiles table for structured advisor data
CREATE TABLE IF NOT EXISTS public.advisor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  profile_data JSONB NOT NULL DEFAULT '{}',
  experience_level TEXT,
  areas_of_expertise TEXT[],
  linkedin_url TEXT,
  timezone TEXT,
  availability_schedule JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on advisor_profiles
ALTER TABLE public.advisor_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for advisor_profiles
CREATE POLICY "Users can view their own advisor profile" ON public.advisor_profiles
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can manage their own advisor profile" ON public.advisor_profiles
  FOR ALL USING (user_id = get_current_user_id());

CREATE POLICY "Admins can view all advisor profiles" ON public.advisor_profiles
  FOR SELECT USING (is_admin());

-- Add trigger for updated_at
CREATE OR REPLACE TRIGGER update_advisor_profiles_updated_at
  BEFORE UPDATE ON public.advisor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create founder_profiles table for structured founder data
CREATE TABLE IF NOT EXISTS public.founder_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  profile_data JSONB NOT NULL DEFAULT '{}',
  startup_name TEXT,
  website TEXT,
  sector TEXT,
  stage TEXT,
  current_challenge TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on founder_profiles
ALTER TABLE public.founder_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for founder_profiles
CREATE POLICY "Users can view their own founder profile" ON public.founder_profiles
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can manage their own founder profile" ON public.founder_profiles
  FOR ALL USING (user_id = get_current_user_id());

CREATE POLICY "Admins can view all founder profiles" ON public.founder_profiles
  FOR SELECT USING (is_admin());

CREATE POLICY "Advisors can view assigned founder profiles" ON public.founder_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.advisor_founder_assignments afa
      WHERE afa.founder_id = founder_profiles.user_id 
      AND afa.advisor_id = get_current_user_id()
      AND afa.status = 'active'
      AND afa.deleted_at IS NULL
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE TRIGGER update_founder_profiles_updated_at
  BEFORE UPDATE ON public.founder_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create user_settings table for user preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  settings_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user_settings
CREATE POLICY "Users can manage their own settings" ON public.user_settings
  FOR ALL USING (user_id = get_current_user_id());

-- Add trigger for updated_at
CREATE OR REPLACE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Create session_reminders table
CREATE TABLE IF NOT EXISTS public.session_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '2h', '30m', 'custom')),
  reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on session_reminders
ALTER TABLE public.session_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for session_reminders
CREATE POLICY "Users can view their own reminders" ON public.session_reminders
  FOR SELECT USING (user_id = get_current_user_id());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_reminders_user_id ON public.session_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_session_reminders_session_id ON public.session_reminders(session_id);
CREATE INDEX IF NOT EXISTS idx_session_reminders_time ON public.session_reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_session_reminders_status ON public.session_reminders(status);