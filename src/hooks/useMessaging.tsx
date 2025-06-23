
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface MessageThread {
  id: string;
  assignment_id: string;
  subject: string;
  created_by: string;
  last_message_at: string;
  is_archived: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  thread_id?: string;
  from_user_id: string;
  to_user_id: string;
  assignment_id: string;
  content: string;
  subject?: string;
  message_type: 'text' | 'file' | 'link';
  attachment_url?: string;
  is_read: boolean;
  read_at?: string;
  reply_to?: string;
  created_at: string;
}

export const useMessageThreads = (assignmentId?: string) => {
  return useQuery({
    queryKey: ['message-threads', assignmentId],
    queryFn: async () => {
      let query = supabase
        .from('message_threads')
        .select('*')
        .eq('is_archived', false)
        .order('last_message_at', { ascending: false });

      if (assignmentId) {
        query = query.eq('assignment_id', assignmentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MessageThread[];
    }
  });
};

export const useMessages = (threadId?: string, assignmentId?: string) => {
  return useQuery({
    queryKey: ['messages', threadId, assignmentId],
    queryFn: async () => {
      let query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (threadId) {
        query = query.eq('thread_id', threadId);
      } else if (assignmentId) {
        query = query.eq('assignment_id', assignmentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!(threadId || assignmentId)
  });
};

export const useCreateMessageThread = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (thread: Omit<MessageThread, 'id' | 'last_message_at' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('message_threads')
        .insert(thread)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-threads'] });
    }
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: Omit<Message, 'id' | 'is_read' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['message-threads'] });
      toast.success('Message sent');
    }
  });
};

export const useMarkMessageAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { data, error } = await supabase
        .from('messages')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  });
};
