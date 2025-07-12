
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useFounderData = (founderId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['founder-data', founderId || user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const targetFounderId = founderId || user.id;
      
      // Get founder profile using auth_id
      const { data: founder, error: founderError } = await supabase
        .from('users')
        .select(`
          *,
          user_profiles!inner(
            id,
            profile_data,
            profile_type
          )
        `)
        .eq('auth_id', targetFounderId)
        .eq('role', 'founder')
        .eq('user_profiles.profile_type', 'founder')
        .single();
      
      if (founderError) throw founderError;
      
      // Get assignments with advisor details using the users table ID
      const { data: assignments, error: assignmentsError } = await supabase
        .from('advisor_founder_assignments')
        .select(`
          *,
          advisor:users!advisor_id(id, email),
          sessions(id, status, scheduled_at, title, description)
        `)
        .eq('founder_id', founder.id)
        .eq('status', 'active');
      
      if (assignmentsError) throw assignmentsError;
      
      // Get goals using the users table ID
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('founder_id', founder.id);
      
      if (goalsError) throw goalsError;
      
      return {
        founder,
        assignments: assignments || [],
        goals: goals || []
      };
    },
    enabled: !!user
  });
};

export const useFounderSessions = (founderId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['founder-sessions', founderId || user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const targetFounderId = founderId || user.id;
      
      // First get the founder's users table ID
      const { data: founder, error: founderError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', targetFounderId)
        .single();
      
      if (founderError) throw founderError;
      
      // Then get sessions through assignments
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          *,
          assignment:advisor_founder_assignments!assignment_id(
            advisor:users!advisor_id(email)
          )
        `)
        .eq('assignment.founder_id', founder.id)
        .order('scheduled_at', { ascending: false });
      
      if (error) throw error;
      return sessions || [];
    },
    enabled: !!user
  });
};
