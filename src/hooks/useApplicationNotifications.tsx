
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SendNotificationRequest {
  applicationId: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

export const useSendApplicationNotification = () => {
  return useMutation({
    mutationFn: async ({ applicationId, status, rejectionReason }: SendNotificationRequest) => {
      const { data, error } = await supabase.functions.invoke('send-application-notification', {
        body: {
          applicationId,
          status,
          rejectionReason
        }
      });

      if (error) throw error;
      return data;
    }
  });
};
