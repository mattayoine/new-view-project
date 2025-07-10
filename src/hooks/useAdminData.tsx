
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
          user_profiles!inner(
            id,
            profile_data,
            profile_type
          ),
          assignments:advisor_founder_assignments(
            id,
            advisor_id,
            status,
            total_sessions,
            match_score,
            assigned_at,
            advisor:users!advisor_id(email)
          ),
          goals(
            id,
            title,
            status,
            created_at
          )
        `)
        .eq('role', 'founder')
        .eq('user_profiles.profile_type', 'founder')
        .is('deleted_at', null);
      
      if (error) {
        console.error('Error fetching founders:', error);
        throw error;
      }
      
      console.log('Founders data:', founders);
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
          user_profiles!inner(
            id,
            profile_data,
            profile_type
          ),
          assignments:advisor_founder_assignments(
            id,
            founder_id,
            status,
            total_sessions,
            avg_rating,
            assigned_at,
            founder:users!founder_id(email)
          )
        `)
        .eq('role', 'advisor')
        .eq('user_profiles.profile_type', 'advisor')
        .is('deleted_at', null);
      
      if (error) {
        console.error('Error fetching advisors:', error);
        throw error;
      }
      
      console.log('Advisors data:', advisors);
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
            founder:users!founder_id(email),
            advisor:users!advisor_id(email)
          )
        `)
        .order('scheduled_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return sessions || [];
    }
  });
};
