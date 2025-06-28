
-- ENHANCEMENT 1: Fix role-based integrity with triggers (replace problematic CHECK constraints)
-- Remove the existing CHECK constraints that use subqueries
ALTER TABLE public.advisor_founder_assignments DROP CONSTRAINT IF EXISTS advisor_has_advisor_role;
ALTER TABLE public.advisor_founder_assignments DROP CONSTRAINT IF EXISTS founder_has_founder_role;
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goal_founder_has_founder_role;

-- Create trigger functions for role validation
CREATE OR REPLACE FUNCTION public.validate_assignment_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate advisor role
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = NEW.advisor_id AND role = 'advisor' AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Advisor must have advisor role';
  END IF;
  
  -- Validate founder role
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = NEW.founder_id AND role = 'founder' AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Founder must have founder role';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.validate_goal_founder_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = NEW.founder_id AND role = 'founder' AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Goal owner must have founder role';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add role validation triggers
CREATE TRIGGER validate_assignment_roles_trigger
  BEFORE INSERT OR UPDATE ON public.advisor_founder_assignments
  FOR EACH ROW EXECUTE FUNCTION public.validate_assignment_roles();

CREATE TRIGGER validate_goal_founder_role_trigger
  BEFORE INSERT OR UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.validate_goal_founder_role();

-- ENHANCEMENT 2: Notification channels and delivery tracking
ALTER TABLE public.notifications ADD COLUMN channel TEXT DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'sms', 'push'));

CREATE TABLE public.notification_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'sms', 'push')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  provider TEXT, -- e.g., 'resend', 'twilio', 'firebase'
  provider_message_id TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TRIGGER update_notification_deliveries_updated_at BEFORE UPDATE ON public.notification_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_notification_deliveries_notification_id ON public.notification_deliveries(notification_id);
CREATE INDEX idx_notification_deliveries_status ON public.notification_deliveries(status);

-- ENHANCEMENT 3: Audit logs for sensitive operations
CREATE TABLE public.assignment_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.advisor_founder_assignments(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'status_changed', 'reassigned', 'notes_updated')),
  actor_id UUID REFERENCES public.users(id),
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.goal_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'progress_changed', 'status_changed', 'completed')),
  actor_id UUID REFERENCES public.users(id),
  old_values JSONB,
  new_values JSONB,
  progress_change INTEGER, -- difference in progress percentage
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.application_review_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES public.base_applications(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('submitted', 'reviewed', 'approved', 'rejected', 'resubmitted')),
  reviewer_id UUID REFERENCES public.users(id),
  previous_status TEXT,
  new_status TEXT,
  comments TEXT,
  review_criteria JSONB, -- structured review data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_assignment_logs_assignment_id ON public.assignment_logs(assignment_id);
CREATE INDEX idx_goal_logs_goal_id ON public.goal_logs(goal_id);
CREATE INDEX idx_application_review_logs_application_id ON public.application_review_logs(application_id);

-- ENHANCEMENT 4: Multi-tenancy with organizations
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'accelerator' CHECK (type IN ('accelerator', 'incubator', 'corporate', 'university', 'venture_studio')),
  website TEXT,
  description TEXT,
  logo_url TEXT,
  settings JSONB, -- org-specific configuration
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add organization reference to users
ALTER TABLE public.users ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_users_organization_id ON public.users(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_type ON public.organizations(type) WHERE deleted_at IS NULL;

-- ENHANCEMENT 5: Session AI analysis and intelligence
CREATE TABLE public.session_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE UNIQUE,
  ai_model TEXT NOT NULL, -- e.g., 'gpt-4', 'claude-3'
  sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
  topics TEXT[], -- extracted topics/themes
  action_items TEXT[], -- AI-extracted action items
  recommendations TEXT[], -- AI suggestions
  key_insights TEXT,
  discussion_themes JSONB, -- structured theme analysis
  next_session_suggestions TEXT,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  confidence_score DECIMAL(3,2), -- AI confidence in analysis
  processing_duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TRIGGER update_session_analysis_updated_at BEFORE UPDATE ON public.session_analysis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_session_analysis_session_id ON public.session_analysis(session_id);
CREATE INDEX idx_session_analysis_processing_status ON public.session_analysis(processing_status);

-- ENHANCEMENT 6: Global activity tracking
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- e.g., 'login', 'goal_created', 'session_scheduled'
  object_type TEXT, -- e.g., 'goal', 'session', 'assignment'
  object_id UUID, -- ID of the affected object
  metadata JSONB, -- additional context
  ip_address INET,
  user_agent TEXT,
  session_id TEXT, -- browser/app session
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at);
CREATE INDEX idx_activity_logs_object_type ON public.activity_logs(object_type);

-- ENHANCEMENT 7: Session recurrence support
ALTER TABLE public.sessions ADD COLUMN is_recurring BOOLEAN DEFAULT false;
ALTER TABLE public.sessions ADD COLUMN recurrence_pattern JSONB; -- {frequency: 'weekly', interval: 1, end_date: '2024-12-31'}
ALTER TABLE public.sessions ADD COLUMN parent_series_id UUID REFERENCES public.sessions(id);

CREATE INDEX idx_sessions_parent_series_id ON public.sessions(parent_series_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sessions_is_recurring ON public.sessions(is_recurring) WHERE deleted_at IS NULL;

-- ENHANCEMENT 8: User events for analytics
CREATE TABLE public.user_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- e.g., 'goal_completed', 'profile_completed', 'session_booked'
  event_category TEXT NOT NULL, -- e.g., 'engagement', 'progress', 'onboarding'
  properties JSONB, -- event-specific data
  value DECIMAL(10,2), -- numeric value for aggregation
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_events_user_id ON public.user_events(user_id);
CREATE INDEX idx_user_events_event_type ON public.user_events(event_type);
CREATE INDEX idx_user_events_timestamp ON public.user_events(timestamp);

-- ENHANCEMENT 9: Enhanced feedback collection
ALTER TABLE public.sessions ADD COLUMN founder_feedback_text TEXT;
ALTER TABLE public.sessions ADD COLUMN advisor_feedback_text TEXT;
ALTER TABLE public.sessions ADD COLUMN what_went_well TEXT;
ALTER TABLE public.sessions ADD COLUMN what_could_improve TEXT;
ALTER TABLE public.sessions ADD COLUMN founder_private_notes TEXT;
ALTER TABLE public.sessions ADD COLUMN advisor_private_notes TEXT;
ALTER TABLE public.sessions ADD COLUMN feedback_tags TEXT[]; -- structured tags

-- ENHANCEMENT 10: Filtered views for soft-deleted data
CREATE VIEW public.active_users AS
  SELECT * FROM public.users WHERE deleted_at IS NULL;

CREATE VIEW public.active_applications AS
  SELECT * FROM public.base_applications WHERE deleted_at IS NULL;

CREATE VIEW public.active_assignments AS
  SELECT * FROM public.advisor_founder_assignments WHERE deleted_at IS NULL;

CREATE VIEW public.active_sessions AS
  SELECT * FROM public.sessions WHERE deleted_at IS NULL;

CREATE VIEW public.active_goals AS
  SELECT * FROM public.goals WHERE deleted_at IS NULL;

CREATE VIEW public.active_resources AS
  SELECT * FROM public.resources WHERE deleted_at IS NULL;

CREATE VIEW public.active_notifications AS
  SELECT * FROM public.notifications WHERE deleted_at IS NULL;

-- ENHANCEMENT 11: Dynamic badge system
CREATE TABLE public.badge_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_level TEXT NOT NULL CHECK (badge_level IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  rule_type TEXT NOT NULL CHECK (rule_type IN ('sessions_completed', 'avg_rating', 'founders_mentored', 'tenure_months')),
  threshold_value DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default badge rules
INSERT INTO public.badge_rules (badge_level, rule_type, threshold_value, description) VALUES
('bronze', 'sessions_completed', 1, 'Complete your first mentoring session'),
('silver', 'sessions_completed', 10, 'Complete 10 mentoring sessions'),
('silver', 'avg_rating', 4.0, 'Maintain an average rating of 4.0 or higher'),
('gold', 'sessions_completed', 25, 'Complete 25 mentoring sessions'),
('gold', 'avg_rating', 4.5, 'Maintain an average rating of 4.5 or higher'),
('gold', 'founders_mentored', 5, 'Mentor at least 5 different founders'),
('platinum', 'sessions_completed', 50, 'Complete 50 mentoring sessions'),
('platinum', 'avg_rating', 4.7, 'Maintain an average rating of 4.7 or higher'),
('platinum', 'founders_mentored', 10, 'Mentor at least 10 different founders'),
('diamond', 'sessions_completed', 100, 'Complete 100 mentoring sessions'),
('diamond', 'avg_rating', 4.8, 'Maintain an average rating of 4.8 or higher'),
('diamond', 'founders_mentored', 20, 'Mentor at least 20 different founders');

CREATE INDEX idx_badge_rules_badge_level ON public.badge_rules(badge_level);
CREATE INDEX idx_badge_rules_rule_type ON public.badge_rules(rule_type);

-- Function to calculate badge level based on rules
CREATE OR REPLACE FUNCTION public.calculate_user_badge_level(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_stats RECORD;
  highest_badge TEXT := 'bronze';
  rule_record RECORD;
BEGIN
  -- Get user statistics
  SELECT 
    COUNT(DISTINCT af.founder_id) as founders_mentored,
    COUNT(s.id) as sessions_completed,
    AVG((COALESCE(s.founder_rating, 0) + COALESCE(s.advisor_rating, 0)) / 2.0) as avg_rating,
    EXTRACT(EPOCH FROM (now() - u.created_at)) / (30 * 24 * 3600) as tenure_months
  INTO user_stats
  FROM public.users u
  LEFT JOIN public.advisor_founder_assignments af ON af.advisor_id = u.id AND af.deleted_at IS NULL
  LEFT JOIN public.sessions s ON s.assignment_id = af.id AND s.status = 'completed' AND s.deleted_at IS NULL
  WHERE u.id = p_user_id AND u.deleted_at IS NULL
  GROUP BY u.id, u.created_at;

  -- Check badge rules in order (bronze to diamond)
  FOR rule_record IN 
    SELECT DISTINCT badge_level 
    FROM public.badge_rules 
    WHERE is_active = true
    ORDER BY 
      CASE badge_level 
        WHEN 'bronze' THEN 1 
        WHEN 'silver' THEN 2 
        WHEN 'gold' THEN 3 
        WHEN 'platinum' THEN 4 
        WHEN 'diamond' THEN 5 
      END
  LOOP
    -- Check if all rules for this badge level are met
    IF NOT EXISTS (
      SELECT 1 FROM public.badge_rules br
      WHERE br.badge_level = rule_record.badge_level 
        AND br.is_active = true
        AND (
          (br.rule_type = 'sessions_completed' AND COALESCE(user_stats.sessions_completed, 0) < br.threshold_value)
          OR (br.rule_type = 'avg_rating' AND COALESCE(user_stats.avg_rating, 0) < br.threshold_value)
          OR (br.rule_type = 'founders_mentored' AND COALESCE(user_stats.founders_mentored, 0) < br.threshold_value)
          OR (br.rule_type = 'tenure_months' AND COALESCE(user_stats.tenure_months, 0) < br.threshold_value)
        )
    ) THEN
      highest_badge := rule_record.badge_level;
    END IF;
  END LOOP;

  RETURN highest_badge;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on new tables
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_rules ENABLE ROW LEVEL SECURITY;

-- Create loose RLS policies for new tables
CREATE POLICY "Allow all operations for authenticated users" ON public.notification_deliveries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.assignment_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.goal_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.application_review_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.organizations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.session_analysis FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.activity_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.user_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.badge_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);
