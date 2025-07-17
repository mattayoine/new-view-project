-- Create dashboard_metrics materialized view for real-time dashboard data
CREATE MATERIALIZED VIEW IF NOT EXISTS public.dashboard_metrics AS
SELECT 
  'total_users' as metric_type,
  COUNT(*)::integer as count,
  NULL::uuid as user_id,
  now() as updated_at
FROM public.users 
WHERE deleted_at IS NULL

UNION ALL

SELECT 
  'active_sessions' as metric_type,
  COUNT(*)::integer as count,
  NULL::uuid as user_id,
  now() as updated_at
FROM public.sessions 
WHERE status = 'scheduled' AND deleted_at IS NULL

UNION ALL

SELECT 
  'pending_applications' as metric_type,
  COUNT(*)::integer as count,
  NULL::uuid as user_id,
  now() as updated_at
FROM public.base_applications 
WHERE status = 'pending' AND deleted_at IS NULL

UNION ALL

SELECT 
  'total_assignments' as metric_type,
  COUNT(*)::integer as count,
  NULL::uuid as user_id,
  now() as updated_at
FROM public.advisor_founder_assignments 
WHERE deleted_at IS NULL

UNION ALL

SELECT 
  'completed_sessions' as metric_type,
  COUNT(*)::integer as count,
  NULL::uuid as user_id,
  now() as updated_at
FROM public.sessions 
WHERE status = 'completed' AND deleted_at IS NULL

UNION ALL

SELECT 
  'total_notifications' as metric_type,
  COUNT(*)::integer as count,
  NULL::uuid as user_id,
  now() as updated_at
FROM public.notifications 
WHERE deleted_at IS NULL

UNION ALL

-- User-specific metrics for unread notifications
SELECT 
  'unread_notifications' as metric_type,
  COUNT(*)::integer as count,
  user_id,
  now() as updated_at
FROM public.notifications 
WHERE is_read = false AND deleted_at IS NULL
GROUP BY user_id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS dashboard_metrics_unique_idx 
ON public.dashboard_metrics (metric_type, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Enable RLS on the materialized view
ALTER MATERIALIZED VIEW public.dashboard_metrics OWNER TO postgres;

-- Create a function to refresh the materialized view if it doesn't exist
CREATE OR REPLACE FUNCTION public.refresh_dashboard_metrics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.dashboard_metrics;
END;
$$;