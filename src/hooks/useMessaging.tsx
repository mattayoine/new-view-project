
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
  message_type: 'text' | 'file' | 'link' | 'escalation';
  attachment_url?: string;
  is_read: boolean;
  read_at?: string;
  reply_to?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
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
        .select(`
          *,
          from_user:users!from_user_id(id, email),
          to_user:users!to_user_id(id, email)
        `)
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

      // Create notification for recipient
      await supabase
        .from('notifications')
        .insert({
          user_id: message.to_user_id,
          type: message.message_type === 'escalation' ? 'escalation' : 'message',
          title: message.message_type === 'escalation' ? 'Urgent: Issue Escalation' : 'New Message',
          message: message.message_type === 'escalation' 
            ? `Urgent issue reported: ${message.content.substring(0, 100)}...`
            : `New message: ${message.content.substring(0, 100)}...`,
          priority: message.priority || 'normal',
          metadata: {
            message_id: data.id,
            assignment_id: message.assignment_id,
            from_user_id: message.from_user_id
          }
        });

      // Send email notification if it's an escalation or high priority
      if (message.message_type === 'escalation' || message.priority === 'urgent') {
        await supabase.functions.invoke('send-escalation-notification', {
          body: {
            messageId: data.id,
            recipientId: message.to_user_id,
            senderId: message.from_user_id,
            content: message.content,
            priority: message.priority || 'high'
          }
        });
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['message-threads'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
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

export const useEscalateIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      assignmentId, 
      toUserId, 
      fromUserId, 
      issue, 
      severity 
    }: {
      assignmentId: string;
      toUserId: string;
      fromUserId: string;
      issue: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }) => {
      // Create escalation message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          assignment_id: assignmentId,
          from_user_id: fromUserId,
          to_user_id: toUserId,
          content: `ESCALATION: ${issue}`,
          message_type: 'escalation',
          priority: severity === 'critical' ? 'urgent' : 'high'
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Create high-priority notification
      await supabase
        .from('notifications')
        .insert({
          user_id: toUserId,
          type: 'escalation',
          title: `${severity.toUpperCase()} Issue Escalation`,
          message: `Urgent issue reported: ${issue.substring(0, 100)}...`,
          priority: severity === 'critical' ? 'urgent' : 'high',
          metadata: {
            message_id: message.id,
            assignment_id: assignmentId,
            from_user_id: fromUserId,
            severity
          }
        });

      // Send email notification for escalations
      await supabase.functions.invoke('send-escalation-notification', {
        body: {
          messageId: message.id,
          recipientId: toUserId,
          senderId: fromUserId,
          content: issue,
          severity,
          assignmentId
        }
      });

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Issue escalated successfully');
    }
  });
};

// Real-time messaging hook
export const useRealTimeMessages = (threadId?: string, assignmentId?: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['realtime-messages', threadId, assignmentId],
    queryFn: async () => {
      // Set up real-time subscription for messages
      const channel = supabase
        .channel(`messages-${threadId || assignmentId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: threadId ? `thread_id=eq.${threadId}` : `assignment_id=eq.${assignmentId}`
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['messages', threadId, assignmentId] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: threadId ? `thread_id=eq.${threadId}` : `assignment_id=eq.${assignmentId}`
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['messages', threadId, assignmentId] });
          }
        )
        .subscribe();

      return channel;
    },
    enabled: !!(threadId || assignmentId)
  });
};
