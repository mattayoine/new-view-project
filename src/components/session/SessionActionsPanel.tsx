
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, X, MessageSquare } from 'lucide-react';
import { useRescheduleSession, useCancelSession } from '@/hooks/useSessionActions';
import { format } from 'date-fns';

interface SessionActionsPanelProps {
  session: {
    id: string;
    title: string;
    scheduled_at: string;
    status: string;
  };
}

const SessionActionsPanel: React.FC<SessionActionsPanelProps> = ({ session }) => {
  const [rescheduleDateTime, setRescheduleDateTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');

  const rescheduleSession = useRescheduleSession();
  const cancelSession = useCancelSession();

  const handleReschedule = async () => {
    if (!rescheduleDateTime) return;

    await rescheduleSession.mutateAsync({
      sessionId: session.id,
      newScheduledAt: rescheduleDateTime,
      reason: rescheduleReason
    });

    setRescheduleDateTime('');
    setRescheduleReason('');
  };

  const handleCancel = async () => {
    if (!cancellationReason.trim()) return;

    await cancelSession.mutateAsync({
      sessionId: session.id,
      cancellationReason
    });

    setCancellationReason('');
  };

  if (session.status === 'completed' || session.status === 'cancelled') {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">Session Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Calendar className="w-4 h-4 mr-2" />
              Reschedule Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reschedule Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Current Time</Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(session.scheduled_at), 'PPP p')}
                </p>
              </div>
              
              <div>
                <Label htmlFor="new-datetime">New Date & Time</Label>
                <Input
                  id="new-datetime"
                  type="datetime-local"
                  value={rescheduleDateTime}
                  onChange={(e) => setRescheduleDateTime(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="reschedule-reason">Reason (Optional)</Label>
                <Textarea
                  id="reschedule-reason"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Why are you rescheduling this session?"
                  rows={2}
                />
              </div>

              <Button 
                onClick={handleReschedule}
                disabled={!rescheduleDateTime || rescheduleSession.isPending}
                className="w-full"
              >
                {rescheduleSession.isPending ? 'Rescheduling...' : 'Reschedule Session'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full text-red-600 hover:text-red-700">
              <X className="w-4 h-4 mr-2" />
              Cancel Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to cancel "{session.title}"?
              </p>

              <div>
                <Label htmlFor="cancellation-reason">Cancellation Reason *</Label>
                <Textarea
                  id="cancellation-reason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Please provide a reason for cancellation..."
                  rows={3}
                  required
                />
              </div>

              <Button 
                onClick={handleCancel}
                disabled={!cancellationReason.trim() || cancelSession.isPending}
                className="w-full"
                variant="destructive"
              >
                {cancelSession.isPending ? 'Cancelling...' : 'Cancel Session'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SessionActionsPanel;
