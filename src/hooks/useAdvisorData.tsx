
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useAdvisorData = (advisorId?: string) => {
  const { user } = useAuth();
  const actualAdvisorId = advisorId || user?.id;

  return useQuery({
    queryKey: ['advisor-data', actualAdvisorId],
    queryFn: async () => {
      if (!actualAdvisorId) throw new Error('Advisor ID required');
      
      // Get advisor profile
      const { data: advisor, error: advisorError } = await supabase
        .from('users')
        .select('*')
        .eq('id', actualAdvisorId)
        .eq('role', 'advisor')
        .single();
      
      if (advisorError) throw advisorError;
      
      // Get assignments with founder details
      const { data: assignments, error: assignmentsError } = await supabase
        .from('advisor_founder_assignments')
        .select(`
          *,
          founder:users!founder_id(id, email),
          sessions(id, status, scheduled_at, title, description, founder_rating, advisor_rating)
        `)
        .eq('advisor_id', actualAdvisorId)
        .eq('status', 'active');
      
      if (assignmentsError) throw assignmentsError;
      
      return {
        advisor,
        assignments: assignments || []
      };
    },
    enabled: !!actualAdvisorId
  });
};

export const useAdvisorSessions = (advisorId?: string) => {
  const { user } = useAuth();
  const actualAdvisorId = advisorId || user?.id;

  return useQuery({
    queryKey: ['advisor-sessions', actualAdvisorId],
    queryFn: async () => {
      if (!actualAdvisorId) throw new Error('Advisor ID required');
      
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          *,
          assignment:assignment_id(
            founder:users!founder_id(email)
          )
        `)
        .eq('assignment.advisor_id', actualAdvisorId)
        .order('scheduled_at', { ascending: false });
      
      if (error) throw error;
      return sessions || [];
    },
    enabled: !!actualAdvisorId
  });
};

export const useAdvisorTestimonials = (advisorId?: string) => {
  const { user } = useAuth();
  const actualAdvisorId = advisorId || user?.id;

  return useQuery({
    queryKey: ['advisor-testimonials', actualAdvisorId],
    queryFn: async () => {
      if (!actualAdvisorId) throw new Error('Advisor ID required');
      
      const { data: testimonials, error } = await supabase
        .from('testimonials')
        .select(`
          *,
          from_user:users!from_user_id(email)
        `)
        .eq('to_user_id', actualAdvisorId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return testimonials || [];
    },
    enabled: !!actualAdvisorId
  });
};
