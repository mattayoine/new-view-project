
import React, { useEffect, useState } from 'react';
import { Bell, X, AlertTriangle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRealTimeSubscription } from '@/hooks/useRealTimeSubscription';
import { usePaginatedNotifications } from '@/hooks/usePaginatedQuery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const RealTimeNotifications: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    data: notifications,
    totalCount,
    isLoading,
    refetch
  } = usePaginatedNotifications(user?.id || '', false);

  // Subscribe to real-time notification updates
  useRealTimeSubscription({
    table: 'notifications',
    queryKey: ['paginated-notifications', user?.id || '', 'all'],
    filter: `user_id=eq.${user?.id}`,
    event: '*'
  });

  // Subscribe to real-time message updates
  useRealTimeSubscription({
    table: 'messages',
    queryKey: ['messages'],
    filter: `to_user_id=eq.${user?.id}`,
    event: 'INSERT'
  });

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;
  const urgentCount = notifications?.filter(n => !n.is_read && (n.priority === 'urgent' || n.type === 'escalation')).length || 0;

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
      
      refetch();
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user?.id)
        .eq('is_read', false);
      
      refetch();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    if (type === 'escalation' || priority === 'urgent') {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    if (type === 'message') {
      return <MessageCircle className="w-4 h-4 text-blue-500" />;
    }
    return <Bell className="w-4 h-4 text-gray-500" />;
  };

  const getPriorityColor = (priority: string, type: string) => {
    if (type === 'escalation' || priority === 'urgent') {
      return 'bg-red-50 border-l-red-500';
    }
    if (priority === 'high') {
      return 'bg-orange-50 border-l-orange-500';
    }
    return 'bg-blue-50 border-l-blue-500';
  };

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Show toast for urgent notifications
  useEffect(() => {
    if (notifications) {
      const newUrgentNotifications = notifications.filter(
        n => !n.is_read && 
        (n.type === 'escalation' || n.priority === 'urgent') &&
        new Date(n.created_at).getTime() > Date.now() - 5000 // Last 5 seconds
      );

      newUrgentNotifications.forEach(notification => {
        toast.error(`🚨 ${notification.title}`, {
          description: notification.message,
          duration: 10000,
        });
      });
    }
  }, [notifications]);

  if (!user) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant={urgentCount > 0 ? "destructive" : "default"}
            className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs ${
              urgentCount > 0 ? 'animate-pulse' : ''
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-96 max-h-96 z-50 shadow-lg">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-semibold">
                Notifications
                {urgentCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {urgentCount} Urgent
                  </Badge>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading notifications...
                </div>
              ) : notifications?.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                notifications?.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b cursor-pointer hover:bg-muted/50 border-l-4 ${
                      !notification.is_read ? getPriorityColor(notification.priority, notification.type) : 'border-l-gray-200'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getNotificationIcon(notification.type, notification.priority)}
                          <p className="font-medium text-sm truncate">
                            {notification.title}
                          </p>
                          {(notification.type === 'escalation' || notification.priority === 'urgent') && (
                            <Badge variant="destructive" className="text-xs">
                              URGENT
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.created_at).toLocaleDateString()} at{' '}
                          {new Date(notification.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className={`w-2 h-2 rounded-full ml-2 mt-1 flex-shrink-0 ${
                          notification.type === 'escalation' || notification.priority === 'urgent' 
                            ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
