
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useAdvisorData = (advisorId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['advisor-data', advisorId || user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const targetAdvisorId = advisorId || user.id;
      
      // Get advisor profile using auth_id
      const { data: advisor, error: advisorError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', targetAdvisorId)
        .eq('role', 'advisor')
        .single();
      
      if (advisorError) throw advisorError;
      
      // Get assignments with founder details using the users table ID
      const { data: assignments, error: assignmentsError } = await supabase
        .from('advisor_founder_assignments')
        .select(`
          *,
          founder:users!founder_id(id, email),
          sessions(id, status, scheduled_at, title, description, founder_rating, advisor_rating)
        `)
        .eq('advisor_id', advisor.id)
        .eq('status', 'active');
      
      if (assignmentsError) throw assignmentsError;
      
      return {
        advisor,
        assignments: assignments || []
      };
    },
    enabled: !!user
  });
};

export const useAdvisorSessions = (advisorId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['advisor-sessions', advisorId || user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const targetAdvisorId = advisorId || user.id;
      
      // First get the advisor's users table ID
      const { data: advisor, error: advisorError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', targetAdvisorId)
        .single();
      
      if (advisorError) throw advisorError;
      
      // Then get sessions through assignments
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          *,
          assignment:advisor_founder_assignments!assignment_id(
            founder:users!founder_id(email)
          )
        `)
        .eq('assignment.advisor_id', advisor.id)
        .order('scheduled_at', { ascending: false });
      
      if (error) throw error;
      return sessions || [];
    },
    enabled: !!user
  });
};

export const useAdvisorTestimonials = (advisorId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['advisor-testimonials', advisorId || user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const targetAdvisorId = advisorId || user.id;
      
      // First get the advisor's users table ID
      const { data: advisor, error: advisorError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', targetAdvisorId)
        .single();
      
      if (advisorError) throw advisorError;
      
      const { data: testimonials, error } = await supabase
        .from('testimonials')
        .select(`
          *,
          from_user:users!from_user_id(email)
        `)
        .eq('to_user_id', advisor.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return testimonials || [];
    },
    enabled: !!user
  });
};
