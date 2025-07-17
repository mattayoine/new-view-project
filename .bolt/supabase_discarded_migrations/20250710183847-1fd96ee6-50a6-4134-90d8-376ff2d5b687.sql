-- Create missing tables for complete Phase 2 infrastructure

-- Create advisor_profiles table
CREATE TABLE public.advisor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  linkedin_url TEXT,
  areas_of_expertise TEXT[],
  experience_level TEXT CHECK (experience_level IN ('junior', 'mid', 'senior', 'expert')),
  timezone_availability TEXT,
  challenge_preference TEXT,
  consent_public_deck BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create founder_profiles table
CREATE TABLE public.founder_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  startup_name TEXT NOT NULL,
  website TEXT,
  sector TEXT,
  stage TEXT CHECK (stage IN ('idea', 'prototype', 'mvp', 'early_revenue', 'growth', 'scale')),
  current_challenge TEXT,
  win_definition TEXT,
  video_pitch_url TEXT,
  case_study_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create session_reminders table
CREATE TABLE public.session_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '1h', '15m', 'follow_up')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.advisor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for advisor_profiles
CREATE POLICY "Users can view their own advisor profile"
  ON public.advisor_profiles FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own advisor profile"
  ON public.advisor_profiles FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own advisor profile"
  ON public.advisor_profiles FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all advisor profiles"
  ON public.advisor_profiles FOR ALL
  USING (is_admin());

-- RLS policies for founder_profiles
CREATE POLICY "Users can view their own founder profile"
  ON public.founder_profiles FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own founder profile"
  ON public.founder_profiles FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own founder profile"
  ON public.founder_profiles FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all founder profiles"
  ON public.founder_profiles FOR ALL
  USING (is_admin());

-- RLS policies for session_reminders
CREATE POLICY "Users can view their own session reminders"
  ON public.session_reminders FOR SELECT
  USING (user_id = get_current_user_id() OR is_admin());

CREATE POLICY "System can manage session reminders"
  ON public.session_reminders FOR ALL
  USING (true);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_advisor_profiles_updated_at
  BEFORE UPDATE ON public.advisor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_founder_profiles_updated_at
  BEFORE UPDATE ON public.founder_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_session_reminders_updated_at
  BEFORE UPDATE ON public.session_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_advisor_profiles_user_id ON public.advisor_profiles(user_id);
CREATE INDEX idx_advisor_profiles_expertise ON public.advisor_profiles USING GIN(areas_of_expertise);
CREATE INDEX idx_founder_profiles_user_id ON public.founder_profiles(user_id);
CREATE INDEX idx_founder_profiles_sector ON public.founder_profiles(sector);
CREATE INDEX idx_session_reminders_session_id ON public.session_reminders(session_id);
CREATE INDEX idx_session_reminders_user_id ON public.session_reminders(user_id);
CREATE INDEX idx_session_reminders_scheduled_at ON public.session_reminders(scheduled_at);
CREATE INDEX idx_session_reminders_status ON public.session_reminders(status);