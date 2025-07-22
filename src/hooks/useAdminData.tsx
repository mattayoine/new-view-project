
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

// Add the missing exports that components are expecting
export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data: adminData } = useAdminData();
      
      return {
        activeFounders: adminData?.founders?.length || 0,
        activeAdvisors: adminData?.advisors?.length || 0,
        sessionsThisMonth: 45, // Mock data for now
        caseStudiesReady: 8, // Mock data for now
      };
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useFoundersDirectory = () => {
  return useQuery({
    queryKey: ['founders-directory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          role,
          status,
          created_at,
          user_profiles (
            profile_data
          ),
          advisor_founder_assignments!advisor_founder_assignments_founder_id_fkey (
            id,
            status,
            advisor_id,
            total_sessions
          ),
          goals (
            id,
            status
          )
        `)
        .eq('role', 'founder')
        .eq('status', 'active');

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useAdvisorsDirectory = () => {
  return useQuery({
    queryKey: ['advisors-directory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          role,
          status,
          created_at,
          user_profiles (
            profile_data
          ),
          advisor_founder_assignments!advisor_founder_assignments_advisor_id_fkey (
            id,
            status,
            founder_id,
            total_sessions,
            completed_sessions,
            avg_rating
          )
        `)
        .eq('role', 'advisor')
        .eq('status', 'active');

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
};
