import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useApplicationActions = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const approveApplication = useMutation({
    mutationFn: async ({ applicationId, reviewerId }: { applicationId: string, reviewerId: string }) => {
      // First, update the application status
      const { error: updateError } = await supabase
        .from('base_applications')
        .update({
          status: 'approved',
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // The database trigger will handle creating the user and profile
      // Just return success
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      toast.success('Application approved successfully! User account has been created.');
    },
    onError: (error) => {
      console.error('Error approving application:', error);
      toast.error('Failed to approve application');
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
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      toast.success('Application rejected successfully.');
    },
    onError: (error) => {
      console.error('Error rejecting application:', error);
      toast.error('Failed to reject application');
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
