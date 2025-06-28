
-- Create the core foundation tables first (they were missing)

-- Create the essential trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Core users table with soft deletion and role constraints
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('founder', 'advisor', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending_activation' CHECK (status IN ('pending_activation', 'active', 'inactive', 'suspended')),
  profile_completed BOOLEAN NOT NULL DEFAULT false,
  last_active_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft deletion support
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Separate application tables for clean validation
CREATE TABLE public.base_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('founder', 'advisor')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  
  -- Admin tracking
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft deletion
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Founder-specific application details
CREATE TABLE public.founder_application_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES public.base_applications(id) ON DELETE CASCADE UNIQUE,
  startup_name TEXT NOT NULL,
  website TEXT,
  stage TEXT NOT NULL,
  sector TEXT NOT NULL,
  challenge TEXT NOT NULL,
  win_definition TEXT NOT NULL,
  case_study_consent BOOLEAN DEFAULT false,
  availability_schedule JSONB, -- Structured availability data
  video_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Advisor-specific application details  
CREATE TABLE public.advisor_application_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES public.base_applications(id) ON DELETE CASCADE UNIQUE,
  linkedin TEXT NOT NULL,
  expertise TEXT[] NOT NULL,
  experience_level TEXT NOT NULL,
  timezone TEXT NOT NULL,
  challenge_preference TEXT NOT NULL,
  availability_schedule JSONB, -- Structured availability data
  public_profile_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Polymorphic profiles with role enforcement
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  profile_type TEXT NOT NULL, -- Will match user.role
  profile_data JSONB NOT NULL, -- Flexible structure for different profile types
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Structured availability table
CREATE TABLE public.user_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT NOT NULL,
  is_recurring BOOLEAN DEFAULT true,
  effective_date DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Assignment table with computed metrics
CREATE TABLE public.advisor_founder_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advisor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  founder_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'terminated')),
  match_score INTEGER DEFAULT 0 CHECK (match_score BETWEEN 0 AND 100),
  assigned_by UUID REFERENCES public.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  
  -- Auto-computed metrics (updated by triggers)
  total_sessions INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0.00,
  
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(advisor_id, founder_id)
);

-- 6. Enhanced sessions with structured data
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.advisor_founder_assignments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60 CHECK (duration_minutes > 0),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'missed')),
  meeting_link TEXT,
  notes TEXT,
  ai_summary TEXT,
  founder_rating INTEGER CHECK (founder_rating BETWEEN 1 AND 5),
  advisor_rating INTEGER CHECK (advisor_rating BETWEEN 1 AND 5),
  rescheduled_from UUID REFERENCES public.sessions(id),
  
  -- Recording and AI metadata
  recording_url TEXT,
  transcript_url TEXT,
  ai_processing_status TEXT DEFAULT 'pending' CHECK (ai_processing_status IN ('pending', 'processing', 'completed', 'failed')),
  recording_consent JSONB, -- {advisor: true, founder: false}
  
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Enhanced goals with auto-tracking
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  founder_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.advisor_founder_assignments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT,
  
  -- Auto-tracked fields (updated by triggers)
  milestone_count INTEGER DEFAULT 0,
  milestones_completed INTEGER DEFAULT 0,
  
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.users(id),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Enhanced resources with proper categorization
CREATE TABLE public.resource_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  parent_id UUID REFERENCES public.resource_categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('document', 'template', 'video', 'link', 'tool')),
  category_id UUID REFERENCES public.resource_categories(id),
  
  -- Only one of these should be populated
  file_path TEXT,
  file_url TEXT,
  
  shared_by UUID REFERENCES public.users(id),
  access_level TEXT NOT NULL DEFAULT 'private' CHECK (access_level IN ('public', 'private', 'assigned')),
  
  -- Auto-tracked metrics
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  is_featured BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure only one file reference
  CONSTRAINT only_one_file_reference CHECK (
    (file_path IS NOT NULL AND file_url IS NULL) OR
    (file_path IS NULL AND file_url IS NOT NULL)
  )
);

-- Resource access control
CREATE TABLE public.resource_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES public.users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(resource_id, user_id)
);

-- 9. Enhanced notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('application_status', 'session_reminder', 'assignment', 'goal_update', 'resource_shared', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  metadata JSONB,
  expires_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CRITICAL PERFORMANCE INDEXES
-- Users table indexes
CREATE INDEX idx_users_email ON public.users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON public.users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON public.users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_auth_id ON public.users(auth_id);

-- Applications indexes
CREATE INDEX idx_base_applications_status ON public.base_applications(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_base_applications_type ON public.base_applications(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_base_applications_email ON public.base_applications(email);
CREATE INDEX idx_base_applications_created_at ON public.base_applications(created_at);

-- Assignments indexes
CREATE INDEX idx_assignments_advisor_id ON public.advisor_founder_assignments(advisor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assignments_founder_id ON public.advisor_founder_assignments(founder_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assignments_status ON public.advisor_founder_assignments(status) WHERE deleted_at IS NULL;

-- Sessions indexes
CREATE INDEX idx_sessions_assignment_id ON public.sessions(assignment_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sessions_scheduled_at ON public.sessions(scheduled_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_sessions_status ON public.sessions(status) WHERE deleted_at IS NULL;

-- Goals indexes
CREATE INDEX idx_goals_founder_id ON public.goals(founder_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_goals_assignment_id ON public.goals(assignment_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_goals_status ON public.goals(status) WHERE deleted_at IS NULL;

-- Resources indexes
CREATE INDEX idx_resources_category_id ON public.resources(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_resources_type ON public.resources(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_resources_access_level ON public.resources(access_level) WHERE deleted_at IS NULL;

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_type ON public.notifications(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read) WHERE deleted_at IS NULL;

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.base_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_application_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_application_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_founder_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create loose RLS policies (authenticated users can do everything for now)
CREATE POLICY "Allow all operations for authenticated users" ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.base_applications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.founder_application_details FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.advisor_application_details FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.user_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.user_availability FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.advisor_founder_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.goals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.resource_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.resources FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.resource_access FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_base_applications_updated_at BEFORE UPDATE ON public.base_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_availability_updated_at BEFORE UPDATE ON public.user_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.advisor_founder_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AUTO-TRACKING TRIGGERS for computed metrics
-- Update assignment metrics when sessions change
CREATE OR REPLACE FUNCTION public.update_assignment_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update assignment metrics based on sessions
  UPDATE public.advisor_founder_assignments 
  SET 
    total_sessions = (
      SELECT COUNT(*) FROM public.sessions 
      WHERE assignment_id = COALESCE(NEW.assignment_id, OLD.assignment_id)
      AND deleted_at IS NULL
    ),
    completed_sessions = (
      SELECT COUNT(*) FROM public.sessions 
      WHERE assignment_id = COALESCE(NEW.assignment_id, OLD.assignment_id)
      AND status = 'completed'
      AND deleted_at IS NULL
    ),
    avg_rating = (
      SELECT AVG((COALESCE(founder_rating, 0) + COALESCE(advisor_rating, 0)) / 2.0)
      FROM public.sessions 
      WHERE assignment_id = COALESCE(NEW.assignment_id, OLD.assignment_id)
      AND status = 'completed'
      AND (founder_rating IS NOT NULL OR advisor_rating IS NOT NULL)
      AND deleted_at IS NULL
    )
  WHERE id = COALESCE(NEW.assignment_id, OLD.assignment_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assignment_metrics_on_session_change
  AFTER INSERT OR UPDATE OR DELETE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_assignment_metrics();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'founder')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default resource categories
INSERT INTO public.resource_categories (name, description, icon, color) VALUES
('Templates', 'Business templates and frameworks', 'FileText', '#3B82F6'),
('Tools', 'Software tools and platforms', 'Wrench', '#10B981'),
('Videos', 'Educational and training videos', 'Play', '#F59E0B'),
('Documents', 'Guides and documentation', 'BookOpen', '#8B5CF6'),
('Links', 'External resources and websites', 'ExternalLink', '#EF4444');
