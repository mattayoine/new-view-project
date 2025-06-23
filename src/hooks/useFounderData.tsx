
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useFounderData = (founderId?: string) => {
  const { user } = useAuth();
  const actualFounderId = founderId || user?.id;

  return useQuery({
    queryKey: ['founder-data', actualFounderId],
    queryFn: async () => {
      if (!actualFounderId) throw new Error('Founder ID required');
      
      // Get founder profile
      const { data: founder, error: founderError } = await supabase
        .from('users')
        .select('*')
        .eq('id', actualFounderId)
        .eq('role', 'founder')
        .single();
      
      if (founderError) throw founderError;
      
      // Get assignments with advisor details
      const { data: assignments, error: assignmentsError } = await supabase
        .from('advisor_founder_assignments')
        .select(`
          *,
          advisor:users!advisor_id(id, email),
          sessions(id, status, scheduled_at, title, description)
        `)
        .eq('founder_id', actualFounderId)
        .eq('status', 'active');
      
      if (assignmentsError) throw assignmentsError;
      
      // Get goals
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('founder_id', actualFounderId);
      
      if (goalsError) throw goalsError;
      
      return {
        founder,
        assignments: assignments || [],
        goals: goals || []
      };
    },
    enabled: !!actualFounderId
  });
};

export const useFounderSessions = (founderId?: string) => {
  const { user } = useAuth();
  const actualFounderId = founderId || user?.id;

  return useQuery({
    queryKey: ['founder-sessions', actualFounderId],
    queryFn: async () => {
      if (!actualFounderId) throw new Error('Founder ID required');
      
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          *,
          assignment:assignment_id(
            advisor:users!advisor_id(email)
          )
        `)
        .eq('assignment.founder_id', actualFounderId)
        .order('scheduled_at', { ascending: false });
      
      if (error) throw error;
      return sessions || [];
    },
    enabled: !!actualFounderId
  });
};
