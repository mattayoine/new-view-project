import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Video, Phone, Users } from 'lucide-react';
import { useSessions, useUpdateSessionStatus } from '@/hooks/useSessionManagement';
import { useAutomatedSessionWorkflow } from '@/hooks/useSessionIntegrations';
import { format } from 'date-fns';

interface SessionListProps {
  assignmentId?: string;
}

const SessionList: React.FC<SessionListProps> = ({ assignmentId }) => {
  const { data: sessions, isLoading } = useSessions(assignmentId);
  const updateStatus = useUpdateSessionStatus();
  const { executeWorkflow, isLoading: workflowLoading } = useAutomatedSessionWorkflow();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLocationIcon = (locationType: string) => {
    switch (locationType) {
      case 'virtual': return <Video className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'in_person': return <MapPin className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const handleStatusUpdate = async (sessionId: string, newStatus: string, session: any) => {
    try {
      // Update session status
      await updateStatus.mutateAsync({ 
        sessionId, 
        status: newStatus,
        outcomeData: newStatus === 'completed' ? {
          outcome_summary: 'Session completed successfully'
        } : undefined
      });

      // Execute automated workflow
      if (newStatus === 'completed') {
        await executeWorkflow(sessionId, 'complete');
      } else if (newStatus === 'cancelled') {
        await executeWorkflow(sessionId, 'cancel');
      }
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };

  if (isLoading) {
    return <div>Loading sessions...</div>;
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No sessions scheduled yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card key={session.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{session.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(session.scheduled_at), 'MMM dd, yyyy')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {format(new Date(session.scheduled_at), 'h:mm a')}
                  </div>
                  <div className="flex items-center gap-1">
                    {getLocationIcon(session.location_type)}
                    {session.location_type}
                  </div>
                </div>
              </div>
              <Badge className={getStatusColor(session.status)}>
                {session.status.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {session.description && (
              <p className="text-gray-700 mb-4">{session.description}</p>
            )}
            
            {session.preparation_notes && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <h4 className="font-medium text-blue-900 mb-1">Preparation Notes</h4>
                <p className="text-blue-800 text-sm">{session.preparation_notes}</p>
              </div>
            )}

            {session.meeting_link && (
              <div className="mb-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(session.meeting_link, '_blank')}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Join Meeting
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              {session.status === 'scheduled' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate(session.id, 'in_progress', session)}
                    disabled={updateStatus.isPending || workflowLoading}
                  >
                    Start Session
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate(session.id, 'cancelled', session)}
                    disabled={updateStatus.isPending || workflowLoading}
                  >
                    Cancel
                  </Button>
                </>
              )}
              
              {session.status === 'in_progress' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate(session.id, 'completed', session)}
                  disabled={updateStatus.isPending || workflowLoading}
                >
                  Complete Session
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SessionList;
