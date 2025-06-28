
-- Add session workflow tables and enhancements for Batch 3
-- Session scheduling and workflow improvements
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'regular' CHECK (session_type IN ('regular', 'onboarding', 'goal_review', 'milestone', 'emergency'));
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'virtual' CHECK (location_type IN ('virtual', 'in_person', 'phone'));
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS location_details TEXT;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS preparation_notes TEXT;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS outcome_summary TEXT;

-- Add notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  session_reminders BOOLEAN DEFAULT true,
  session_proposals BOOLEAN DEFAULT true,
  assignment_updates BOOLEAN DEFAULT true,
  goal_updates BOOLEAN DEFAULT true,
  message_notifications BOOLEAN DEFAULT true,
  reminder_hours INTEGER DEFAULT 24, -- Hours before session to send reminder
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add message threads for better organization
CREATE TABLE IF NOT EXISTS public.message_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.advisor_founder_assignments(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update messages table to link to threads
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES public.message_threads(id) ON DELETE CASCADE;

-- Add user settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  calendar_integration_enabled BOOLEAN DEFAULT false,
  calendar_provider TEXT,
  calendar_settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add session feedback table for structured feedback
CREATE TABLE IF NOT EXISTS public.session_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  feedback_by UUID REFERENCES public.users(id),
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  preparation_rating INTEGER CHECK (preparation_rating BETWEEN 1 AND 5),
  communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),
  what_went_well TEXT,
  what_could_improve TEXT,
  action_items TEXT[],
  would_recommend BOOLEAN,
  additional_comments TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, feedback_by)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_assignment_id ON public.message_threads(assignment_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_last_message ON public.message_threads(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON public.messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_session_id ON public.session_feedback(session_id);

-- Enable RLS on new tables
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own notification preferences" ON public.notification_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view threads for their assignments" ON public.message_threads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage their own settings" ON public.user_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage session feedback" ON public.session_feedback FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add updated_at triggers
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_threads_updated_at BEFORE UPDATE ON public.message_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically update thread's last_message_at when new message is added
CREATE OR REPLACE FUNCTION public.update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.thread_id IS NOT NULL THEN
    UPDATE public.message_threads 
    SET last_message_at = NEW.created_at 
    WHERE id = NEW.thread_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_thread_last_message_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_thread_last_message();

-- Function to create notification preferences for new users
CREATE OR REPLACE FUNCTION public.create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_preferences_trigger
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_user_preferences();
