
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdvisorData = (advisorId?: string) => {
  return useQuery({
    queryKey: ['advisor-data', advisorId],
    queryFn: async () => {
      if (!advisorId) throw new Error('Advisor ID required');
      
      // Get advisor profile
      const { data: advisor, error: advisorError } = await supabase
        .from('users')
        .select('*')
        .eq('id', advisorId)
        .eq('role', 'advisor')
        .single();
      
      if (advisorError) throw advisorError;
      
      // Get assignments with founder details
      const { data: assignments, error: assignmentsError } = await supabase
        .from('advisor_founder_assignments')
        .select(`
          *,
          founder:founder_id(id, email),
          sessions(id, status, scheduled_at, title, description, founder_rating, advisor_rating)
        `)
        .eq('advisor_id', advisorId)
        .eq('status', 'active');
      
      if (assignmentsError) throw assignmentsError;
      
      return {
        advisor,
        assignments: assignments || []
      };
    },
    enabled: !!advisorId
  });
};

export const useAdvisorSessions = (advisorId?: string) => {
  return useQuery({
    queryKey: ['advisor-sessions', advisorId],
    queryFn: async () => {
      if (!advisorId) throw new Error('Advisor ID required');
      
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          *,
          assignment:assignment_id(
            founder:founder_id(email)
          )
        `)
        .eq('assignment.advisor_id', advisorId)
        .order('scheduled_at', { ascending: false });
      
      if (error) throw error;
      return sessions || [];
    },
    enabled: !!advisorId
  });
};

export const useAdvisorTestimonials = (advisorId?: string) => {
  return useQuery({
    queryKey: ['advisor-testimonials', advisorId],
    queryFn: async () => {
      if (!advisorId) throw new Error('Advisor ID required');
      
      const { data: testimonials, error } = await supabase
        .from('testimonials')
        .select(`
          *,
          from_user:from_user_id(email)
        `)
        .eq('to_user_id', advisorId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return testimonials || [];
    },
    enabled: !!advisorId
  });
};
