
-- Enable real-time for journey-related tables
ALTER TABLE public.base_applications REPLICA IDENTITY FULL;
ALTER TABLE public.advisor_founder_assignments REPLICA IDENTITY FULL;
ALTER TABLE public.sessions REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.user_profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.base_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.advisor_founder_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;

-- Create indexes for better performance on real-time queries
CREATE INDEX IF NOT EXISTS idx_base_applications_email ON public.base_applications(email);
CREATE INDEX IF NOT EXISTS idx_base_applications_status ON public.base_applications(status);
CREATE INDEX IF NOT EXISTS idx_assignments_advisor_founder ON public.advisor_founder_assignments(advisor_id, founder_id);
CREATE INDEX IF NOT EXISTS idx_sessions_assignment_status ON public.sessions(assignment_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_id ON public.user_profiles(auth_id);
