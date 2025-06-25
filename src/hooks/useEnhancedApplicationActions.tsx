
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useEnhancedApplicationActions = () => {
  const queryClient = useQueryClient();

  const approveApplication = useMutation({
    mutationFn: async ({ applicationId, reviewerId }: { applicationId: string, reviewerId: string }) => {
      console.log('Starting application approval process for:', applicationId);
      
      try {
        // Call the edge function for approval
        const { data, error } = await supabase.functions.invoke('approve-application', {
          body: {
            applicationId,
            reviewerId
          }
        });

        if (error) {
          console.error('Edge function error:', error);
          throw new Error(`Approval process failed: ${error.message}`);
        }

        if (!data || !data.success) {
          console.error('Approval failed:', data);
          throw new Error(data?.error || 'Approval process failed');
        }

        console.log('Application approved successfully:', data);
        return data;
        
      } catch (error: any) {
        console.error('Approval error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      queryClient.invalidateQueries({ queryKey: ['pending-applications-count'] });
      toast.success(`Application approved! User account created. Temporary password: ${data.tempPassword}`);
    },
    onError: (error: any) => {
      console.error('Error approving application:', error);
      toast.error(`Failed to approve application: ${error.message}`);
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
      console.log('Rejecting application:', applicationId, 'Reason:', reason);
      
      try {
        const { error } = await supabase
          .from('base_applications')
          .update({
            status: 'rejected',
            reviewed_by: reviewerId,
            reviewed_at: new Date().toISOString(),
            rejection_reason: reason
          })
          .eq('id', applicationId);

        if (error) {
          console.error('Rejection error:', error);
          throw new Error(`Failed to reject application: ${error.message}`);
        }

        console.log('Application rejected successfully');
        return { success: true };
        
      } catch (error: any) {
        console.error('Rejection error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      queryClient.invalidateQueries({ queryKey: ['pending-applications-count'] });
      toast.success('Application rejected successfully.');
    },
    onError: (error: any) => {
      console.error('Error rejecting application:', error);
      toast.error(`Failed to reject application: ${error.message}`);
    }
  });

  return { approveApplication, rejectApplication };
};
