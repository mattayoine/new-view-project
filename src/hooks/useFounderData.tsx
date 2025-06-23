
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useFounderData = (founderId?: string) => {
  return useQuery({
    queryKey: ['founder-data', founderId],
    queryFn: async () => {
      if (!founderId) throw new Error('Founder ID required');
      
      // Get founder profile
      const { data: founder, error: founderError } = await supabase
        .from('users')
        .select('*')
        .eq('id', founderId)
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
        .eq('founder_id', founderId)
        .eq('status', 'active');
      
      if (assignmentsError) throw assignmentsError;
      
      // Get goals
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('founder_id', founderId);
      
      if (goalsError) throw goalsError;
      
      return {
        founder,
        assignments: assignments || [],
        goals: goals || []
      };
    },
    enabled: !!founderId
  });
};

export const useFounderSessions = (founderId?: string) => {
  return useQuery({
    queryKey: ['founder-sessions', founderId],
    queryFn: async () => {
      if (!founderId) throw new Error('Founder ID required');
      
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          *,
          assignment:assignment_id(
            advisor:users!advisor_id(email)
          )
        `)
        .eq('assignment.founder_id', founderId)
        .order('scheduled_at', { ascending: false });
      
      if (error) throw error;
      return sessions || [];
    },
    enabled: !!founderId
  });
};
