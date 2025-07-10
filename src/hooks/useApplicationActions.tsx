
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useApplicationActions = () => {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();

  const approveApplication = useMutation({
    mutationFn: async ({ applicationId }: { applicationId: string }) => {
      if (!userProfile?.id) {
        throw new Error('User not authenticated or profile not loaded');
      }

      console.log('Starting approval process for application:', applicationId);
      
      try {
        // Call the edge function to handle the complete approval process
        const { data, error } = await supabase.functions.invoke('approve-application', {
          body: {
            applicationId,
            reviewerId: userProfile.id
          }
        });

        if (error) {
          console.error('Edge function error:', error);
          throw new Error(error.message || 'Approval process failed');
        }

        if (!data?.success) {
          console.error('Approval failed:', data?.error);
          throw new Error(data?.error || 'Approval process failed');
        }

        console.log('Application approved successfully:', data);
        return data;
      } catch (error: any) {
        console.error('Error in approval process:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      
      toast.success(
        `Application approved successfully! ${data.tempPassword ? `Temporary password: ${data.tempPassword}` : ''}`
      );
    },
    onError: (error: any) => {
      console.error('Application approval failed:', error);
      toast.error(error.message || 'Failed to approve application');
    }
  });

  const rejectApplication = useMutation({
    mutationFn: async ({ applicationId, reason }: { applicationId: string, reason: string }) => {
      if (!userProfile?.id) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('base_applications')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_by: userProfile.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Application rejected');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject application');
    }
  });

  return {
    approveApplication,
    rejectApplication
  };
};
