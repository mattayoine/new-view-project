
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useScheduleSessionReminder = () => {
  return useMutation({
    mutationFn: async ({ sessionId, reminderTime }: { 
      sessionId: string; 
      reminderTime: '24h' | '1h' | '15m';
    }) => {
      const { data, error } = await supabase.functions.invoke('schedule-session-reminder', {
        body: { sessionId, reminderTime }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Reminder scheduled successfully');
    },
    onError: (error: any) => {
      console.error('Failed to schedule reminder:', error);
      toast.error('Failed to schedule reminder');
    }
  });
};

export const useAutomaticReminders = () => {
  return useQuery({
    queryKey: ['automatic-reminders'],
    queryFn: async () => {
      // Check if automatic reminders are enabled for user
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('session_reminders, reminder_hours')
        .single();

      if (error) throw error;
      return data;
    }
  });
};
