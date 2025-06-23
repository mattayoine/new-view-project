
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // Get founder count
      const { count: founderCount, error: founderError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'founder')
        .is('deleted_at', null);
      
      if (founderError) throw founderError;
      
      // Get advisor count
      const { count: advisorCount, error: advisorError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'advisor')
        .is('deleted_at', null);
      
      if (advisorError) throw advisorError;
      
      // Get sessions this month
      const currentMonth = new Date();
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const { count: sessionCount, error: sessionError } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDay.toISOString())
        .is('deleted_at', null);
      
      if (sessionError) throw sessionError;
      
      // Get case studies (assuming completed sessions with feedback)
      const { count: caseStudyCount, error: caseStudyError } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .not('ai_summary', 'is', null)
        .is('deleted_at', null);
      
      if (caseStudyError) throw caseStudyError;
      
      return {
        activeFounders: founderCount || 0,
        activeAdvisors: advisorCount || 0,
        sessionsThisMonth: sessionCount || 0,
        caseStudiesReady: caseStudyCount || 0
      };
    }
  });
};

export const useFoundersDirectory = () => {
  return useQuery({
    queryKey: ['founders-directory'],
    queryFn: async () => {
      const { data: founders, error } = await supabase
        .from('users')
        .select(`
          *,
          founder_profiles:user_profiles!inner(profile_data),
          assignments:advisor_founder_assignments(
            advisor:advisor_id(email),
            status
          ),
          goals(status)
        `)
        .eq('role', 'founder')
        .eq('user_profiles.profile_type', 'founder')
        .is('deleted_at', null);
      
      if (error) throw error;
      return founders || [];
    }
  });
};

export const useAdvisorsDirectory = () => {
  return useQuery({
    queryKey: ['advisors-directory'],
    queryFn: async () => {
      const { data: advisors, error } = await supabase
        .from('users')
        .select(`
          *,
          advisor_profiles:user_profiles!inner(profile_data),
          assignments:advisor_founder_assignments(
            founder:founder_id(email),
            total_sessions,
            avg_rating,
            status
          ),
          testimonials_received:testimonials!to_user_id(rating, content)
        `)
        .eq('role', 'advisor')
        .eq('user_profiles.profile_type', 'advisor')
        .is('deleted_at', null);
      
      if (error) throw error;
      return advisors || [];
    }
  });
};

export const useSessionsTracker = () => {
  return useQuery({
    queryKey: ['sessions-tracker'],
    queryFn: async () => {
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          *,
          assignment:assignment_id(
            founder:founder_id(email),
            advisor:advisor_id(email)
          )
        `)
        .order('scheduled_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return sessions || [];
    }
  });
};
