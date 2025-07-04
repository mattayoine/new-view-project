
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useGenerateMeetingLink = () => {
  return useMutation({
    mutationFn: async ({ 
      sessionId, 
      platform = 'google-meet' 
    }: { 
      sessionId: string; 
      platform?: 'google-meet' | 'zoom' | 'teams'; 
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-meeting-link', {
        body: { sessionId, platform }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.meetingLink) {
        toast.success('Meeting link generated successfully');
      }
    },
    onError: (error: any) => {
      console.error('Failed to generate meeting link:', error);
      toast.error('Failed to generate meeting link');
    }
  });
};

export const useCheckMeetingIntegration = () => {
  return useQuery({
    queryKey: ['meeting-integration-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-meeting-integrations');
      
      if (error) throw error;
      return data;
    }
  });
};
