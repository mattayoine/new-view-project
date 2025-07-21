
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdminData = () => {
  return useQuery({
    queryKey: ['admin-data'],
    queryFn: async () => {
      const [foundersResult, advisorsResult, applicationsResult] = await Promise.all([
        supabase
          .from('users')
          .select(`
            id,
            email,
            role,
            status,
            created_at,
            user_profiles (
              profile_data
            )
          `)
          .eq('role', 'founder')
          .eq('status', 'active'),
        
        supabase
          .from('users')
          .select(`
            id,
            email,
            role,
            status,
            created_at,
            user_profiles (
              profile_data
            )
          `)
          .eq('role', 'advisor')
          .eq('status', 'active'),
        
        supabase
          .from('base_applications')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (foundersResult.error) throw foundersResult.error;
      if (advisorsResult.error) throw advisorsResult.error;
      if (applicationsResult.error) throw applicationsResult.error;

      return {
        founders: foundersResult.data || [],
        advisors: advisorsResult.data || [],
        applications: applicationsResult.data || []
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2
  });
};
