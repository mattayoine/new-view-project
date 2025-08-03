
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { Send, MessageSquare, AlertTriangle } from 'lucide-react';
import { useMessages, useSendMessage, useMarkMessageAsRead, useEscalateIssue } from '@/hooks/useMessaging';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface MessagingCenterProps {
  assignmentId?: string;
  threadId?: string;
}

const MessagingCenter: React.FC<MessagingCenterProps> = ({ assignmentId, threadId }) => {
  const { userProfile } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [escalationText, setEscalationText] = useState('');
  const [showEscalation, setShowEscalation] = useState(false);
  
  const { data: messages, isLoading, error } = useMessages(threadId, assignmentId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkMessageAsRead();
  const escalateIssue = useEscalateIssue();

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userProfile) return;

    try {
      await sendMessage.mutateAsync({
        from_user_id: userProfile.id,
        to_user_id: '', // This would need to be determined based on assignment
        assignment_id: assignmentId || '',
        content: newMessage.trim(),
        message_type: 'text'
      });
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleEscalation = async () => {
    if (!escalationText.trim() || !userProfile || !assignmentId) return;

    try {
      await escalateIssue.mutateAsync({
        assignmentId,
        toUserId: '', // This would be determined by assignment logic
        fromUserId: userProfile.id,
        issue: escalationText.trim(),
        severity: 'high'
      });
      setEscalationText('');
      setShowEscalation(false);
      toast.success('Issue escalated successfully');
    } catch (error) {
      toast.error('Failed to escalate issue');
    }
  };

  const handleMessageRead = async (messageId: string) => {
    try {
      await markAsRead.mutateAsync(messageId);
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading messages..." />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load messages. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages List */}
          <div className="max-h-96 overflow-y-auto space-y-3">
            {messages?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No messages yet</p>
            ) : (
              messages?.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.from_user_id === userProfile?.id
                      ? 'bg-blue-50 ml-8'
                      : 'bg-gray-50 mr-8'
                  }`}
                  onClick={() => !message.is_read && handleMessageRead(message.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {message.from_user_id === userProfile?.id ? 'You' : 'Them'}
                    </span>
                    {message.message_type === 'escalation' && (
                      <Badge variant="destructive" className="text-xs">
                        URGENT
                      </Badge>
                    )}
                    {!message.is_read && message.from_user_id !== userProfile?.id && (
                      <Badge variant="secondary" className="text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{message.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* New Message Form */}
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                className="resize-none"
              />
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessage.isPending}
                  size="sm"
                >
                  {sendMessage.isPending ? (
                    <LoadingState size="sm" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      Send
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEscalation(!showEscalation)}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Escalate
                </Button>
              </div>
            </div>

            {/* Escalation Form */}
            {showEscalation && (
              <div className="mt-4 p-4 border rounded-lg bg-red-50">
                <h4 className="font-medium text-red-800 mb-2">Escalate Issue</h4>
                <Textarea
                  value={escalationText}
                  onChange={(e) => setEscalationText(e.target.value)}
                  placeholder="Describe the urgent issue that needs immediate attention..."
                  rows={3}
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleEscalation}
                    disabled={!escalationText.trim() || escalateIssue.isPending}
                  >
                    {escalateIssue.isPending ? (
                      <LoadingState size="sm" />
                    ) : (
                      'Send Escalation'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEscalation(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessagingCenter;
