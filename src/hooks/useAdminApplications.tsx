
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdminApplications = () => {
  return useQuery({
    queryKey: ['admin-applications'],
    queryFn: async () => {
      const { data: applications, error } = await supabase
        .from('base_applications')
        .select(`
          *,
          reviewed_at,
          rejection_reason,
          founder_details:founder_application_details!founder_application_details_base_application_id_fkey(*),
          advisor_details:advisor_application_details!advisor_application_details_base_application_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return applications || [];
    }
  });
};

export const useApplicationActions = () => {
  const queryClient = useQueryClient();

  const approveApplication = useMutation({
    mutationFn: async ({ applicationId, reviewerId }: { applicationId: string, reviewerId: string }) => {
      const { error } = await supabase
        .from('base_applications')
        .update({
          status: 'approved',
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
    }
  });

  const rejectApplication = useMutation({
    mutationFn: async ({ 
      applicationId, 
      reviewerId, 
      reason 
    }: { 
      applicationId: string, 
      reviewerId: string, 
      reason: string 
    }) => {
      const { error } = await supabase
        .from('base_applications')
        .update({
          status: 'rejected',
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
    }
  });

  return { approveApplication, rejectApplication };
};

export const usePendingApplicationsCount = () => {
  return useQuery({
    queryKey: ['pending-applications-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('base_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });
};
