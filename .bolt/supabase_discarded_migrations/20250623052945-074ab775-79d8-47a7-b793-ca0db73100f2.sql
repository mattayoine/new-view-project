
-- Add Advisor Availability table for time slot management
CREATE TABLE public.advisor_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advisor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Session Proposals for workflow management
CREATE TABLE public.session_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.advisor_founder_assignments(id) ON DELETE CASCADE,
  proposed_by UUID REFERENCES public.users(id),
  title TEXT NOT NULL,
  description TEXT,
  proposed_times JSONB NOT NULL, -- Array of proposed datetime options
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'rescheduled')),
  selected_time TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  session_id UUID REFERENCES public.sessions(id), -- Created session after approval
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Testimonials for structured feedback
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES public.users(id),
  to_user_id UUID REFERENCES public.users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  admin_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Admin Activity Log for accountability
CREATE TABLE public.admin_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.users(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('application_review', 'user_edit', 'assignment_create', 'session_manage', 'resource_manage', 'user_status_change')),
  target_type TEXT NOT NULL, -- 'user', 'application', 'session', etc.
  target_id UUID NOT NULL,
  action_description TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add In-Platform Messaging between assigned users
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.advisor_founder_assignments(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES public.users(id),
  to_user_id UUID REFERENCES public.users(id),
  subject TEXT,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'link', 'system')),
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  reply_to UUID REFERENCES public.messages(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add User Consents Management
CREATE TABLE public.user_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('case_study', 'public_profile', 'email_marketing', 'data_processing', 'testimonials', 'recording')),
  is_granted BOOLEAN NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhance existing Goals table with additional fields
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS milestone_count INTEGER DEFAULT 0;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS milestones_completed INTEGER DEFAULT 0;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical'));
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id);

-- Create Goal Milestones table for granular tracking
CREATE TABLE public.goal_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  sort_order INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Matching Criteria Scores table
CREATE TABLE public.matching_criteria_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.advisor_founder_assignments(id) ON DELETE CASCADE,
  sector_match_score INTEGER DEFAULT 0 CHECK (sector_match_score BETWEEN 0 AND 100),
  timezone_match_score INTEGER DEFAULT 0 CHECK (timezone_match_score BETWEEN 0 AND 100),
  experience_match_score INTEGER DEFAULT 0 CHECK (experience_match_score BETWEEN 0 AND 100),
  availability_match_score INTEGER DEFAULT 0 CHECK (availability_match_score BETWEEN 0 AND 100),
  challenge_match_score INTEGER DEFAULT 0 CHECK (challenge_match_score BETWEEN 0 AND 100),
  overall_score INTEGER DEFAULT 0 CHECK (overall_score BETWEEN 0 AND 100),
  algorithm_version TEXT DEFAULT '1.0',
  manual_adjustment INTEGER DEFAULT 0,
  manual_adjustment_reason TEXT,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance (fixed: removed WHERE deleted_at IS NULL from advisor_availability since it doesn't have that column)
CREATE INDEX idx_advisor_availability_advisor_id ON public.advisor_availability(advisor_id);
CREATE INDEX idx_advisor_availability_day ON public.advisor_availability(day_of_week) WHERE is_active = true;
CREATE INDEX idx_session_proposals_assignment_id ON public.session_proposals(assignment_id);
CREATE INDEX idx_session_proposals_status ON public.session_proposals(status);
CREATE INDEX idx_testimonials_session_id ON public.testimonials(session_id);
CREATE INDEX idx_testimonials_from_user ON public.testimonials(from_user_id);
CREATE INDEX idx_admin_activity_log_admin_id ON public.admin_activity_log(admin_id);
CREATE INDEX idx_admin_activity_log_target ON public.admin_activity_log(target_type, target_id);
CREATE INDEX idx_messages_assignment_id ON public.messages(assignment_id);
CREATE INDEX idx_messages_from_user ON public.messages(from_user_id);
CREATE INDEX idx_messages_to_user ON public.messages(to_user_id);
CREATE INDEX idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX idx_user_consents_type ON public.user_consents(consent_type);
CREATE INDEX idx_goal_milestones_goal_id ON public.goal_milestones(goal_id);
CREATE INDEX idx_matching_criteria_assignment_id ON public.matching_criteria_scores(assignment_id);

-- Enable RLS on all new tables
ALTER TABLE public.advisor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matching_criteria_scores ENABLE ROW LEVEL SECURITY;

-- Create loose RLS policies for all new tables
CREATE POLICY "Allow all operations for authenticated users" ON public.advisor_availability FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.session_proposals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.testimonials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.admin_activity_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.user_consents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.goal_milestones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.matching_criteria_scores FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add updated_at triggers to tables that need them
CREATE TRIGGER update_advisor_availability_updated_at BEFORE UPDATE ON public.advisor_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_session_proposals_updated_at BEFORE UPDATE ON public.session_proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_consents_updated_at BEFORE UPDATE ON public.user_consents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goal_milestones_updated_at BEFORE UPDATE ON public.goal_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create utility function for admin activity logging
CREATE OR REPLACE FUNCTION public.log_admin_activity(
  p_admin_id UUID,
  p_action_type TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_description TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.admin_activity_log (
    admin_id, action_type, target_type, target_id, 
    action_description, old_values, new_values
  ) VALUES (
    p_admin_id, p_action_type, p_target_type, p_target_id,
    p_description, p_old_values, p_new_values
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create utility function for calculating match scores
CREATE OR REPLACE FUNCTION public.calculate_match_score(
  p_advisor_id UUID,
  p_founder_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sector_score INTEGER := 0;
  timezone_score INTEGER := 0;
  experience_score INTEGER := 0;
  availability_score INTEGER := 0;
  challenge_score INTEGER := 0;
  final_score INTEGER := 0;
BEGIN
  -- Calculate sector match (placeholder logic - can be enhanced later)
  sector_score := 80;
  
  -- Calculate timezone compatibility
  timezone_score := 70;
  
  -- Calculate experience level match
  experience_score := 90;
  
  -- Calculate availability overlap
  availability_score := 85;
  
  -- Calculate challenge type match
  challenge_score := 75;
  
  -- Calculate weighted average
  final_score := (sector_score * 25 + timezone_score * 20 + experience_score * 25 + availability_score * 15 + challenge_score * 15) / 100;
  
  RETURN final_score;
END;
$$;
