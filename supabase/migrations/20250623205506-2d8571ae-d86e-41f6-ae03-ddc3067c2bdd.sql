
-- Batch 4: Performance & Real-time Experience Database Optimizations

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_sessions_assignment_scheduled ON public.sessions(assignment_id, scheduled_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_status_scheduled ON public.sessions(status, scheduled_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read, created_at DESC) WHERE deleted_at IS NULL AND is_read = false;
CREATE INDEX IF NOT EXISTS idx_goals_founder_status ON public.goals(founder_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assignments_advisor_status ON public.advisor_founder_assignments(advisor_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assignments_founder_status ON public.advisor_founder_assignments(founder_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_assignment_created ON public.messages(assignment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_type ON public.user_profiles(profile_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_base_applications_status_created ON public.base_applications(status, created_at DESC);

-- Add composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_sessions_assignment_status_scheduled ON public.sessions(assignment_id, status, scheduled_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_priority ON public.notifications(user_id, is_read, priority, created_at DESC) WHERE deleted_at IS NULL;

-- Enable realtime for key tables
ALTER TABLE public.sessions REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.advisor_founder_assignments REPLICA IDENTITY FULL;
ALTER TABLE public.goals REPLICA IDENTITY FULL;
ALTER TABLE public.session_proposals REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.advisor_founder_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_proposals;

-- Create materialized view for dashboard metrics (for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.dashboard_metrics AS
SELECT 
  'active_sessions' as metric_type,
  COUNT(*) as count,
  NULL::uuid as user_id
FROM public.sessions 
WHERE status IN ('scheduled', 'in_progress') 
  AND deleted_at IS NULL

UNION ALL

SELECT 
  'pending_applications' as metric_type,
  COUNT(*) as count,
  NULL::uuid as user_id
FROM public.base_applications 
WHERE status = 'pending'

UNION ALL

SELECT 
  'total_assignments' as metric_type,
  COUNT(*) as count,
  NULL::uuid as user_id
FROM public.advisor_founder_assignments 
WHERE status = 'active' 
  AND deleted_at IS NULL

UNION ALL

SELECT 
  'unread_notifications' as metric_type,
  COUNT(*) as count,
  user_id
FROM public.notifications 
WHERE is_read = false 
  AND deleted_at IS NULL
  AND user_id IS NOT NULL
GROUP BY user_id;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_metrics_unique ON public.dashboard_metrics(metric_type, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Function to refresh dashboard metrics
CREATE OR REPLACE FUNCTION public.refresh_dashboard_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.dashboard_metrics;
END;
$$ LANGUAGE plpgsql;

-- Create a function for paginated session queries
CREATE OR REPLACE FUNCTION public.get_paginated_sessions(
  p_assignment_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0,
  p_status text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  scheduled_at timestamp with time zone,
  status text,
  assignment_id uuid,
  total_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.description,
    s.scheduled_at,
    s.status,
    s.assignment_id,
    COUNT(*) OVER() as total_count
  FROM public.sessions s
  WHERE s.deleted_at IS NULL
    AND (p_assignment_id IS NULL OR s.assignment_id = p_assignment_id)
    AND (p_status IS NULL OR s.status = p_status)
  ORDER BY s.scheduled_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for paginated notifications
CREATE OR REPLACE FUNCTION public.get_paginated_notifications(
  p_user_id uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_unread_only boolean DEFAULT false
)
RETURNS TABLE (
  id uuid,
  title text,
  message text,
  type text,
  priority text,
  is_read boolean,
  created_at timestamp with time zone,
  total_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.message,
    n.type,
    n.priority,
    n.is_read,
    n.created_at,
    COUNT(*) OVER() as total_count
  FROM public.notifications n
  WHERE n.user_id = p_user_id
    AND n.deleted_at IS NULL
    AND (NOT p_unread_only OR n.is_read = false)
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
