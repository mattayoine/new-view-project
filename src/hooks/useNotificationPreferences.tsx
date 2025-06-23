
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  session_reminders: boolean;
  session_proposals: boolean;
  assignment_updates: boolean;
  goal_updates: boolean;
  message_notifications: boolean;
  reminder_hours: number;
}

export const useNotificationPreferences = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as NotificationPreferences;
    },
    enabled: !!user?.id
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notification_preferences')
        .update(preferences)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', user?.id] });
      toast.success('Notification preferences updated');
    }
  });
};
