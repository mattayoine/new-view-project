
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSendApplicationNotification } from './useApplicationNotifications';
import { toast } from 'sonner';

export const useEnhancedApplicationActions = () => {
  const queryClient = useQueryClient();
  const sendNotification = useSendApplicationNotification();

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

      // Send approval notification
      await sendNotification.mutateAsync({
        applicationId,
        status: 'approved'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      toast.success('Application approved and notification sent!');
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

      // Send rejection notification
      await sendNotification.mutateAsync({
        applicationId,
        status: 'rejected',
        rejectionReason: reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      toast.success('Application rejected and notification sent!');
    },
    onError: (error) => {
      console.error('Error rejecting application:', error);
      toast.error('Failed to reject application');
    }
  });

  return { approveApplication, rejectApplication };
};
