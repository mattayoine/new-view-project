import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  Video, 
  CheckCircle, 
  Star, 
  MessageSquare,
  Target,
  FileText
} from 'lucide-react';
import { useCompleteSessionLifecycle, useSessionFeedbackSubmission } from '@/hooks/useSessionLifecycle';
import { format } from 'date-fns';

interface CompleteSessionWorkflowProps {
  session: {
    id: string;
    title: string;
    description?: string;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
    meeting_link?: string;
    assignment_id: string;
  };
  userRole: 'advisor' | 'founder';
}

const CompleteSessionWorkflow: React.FC<CompleteSessionWorkflowProps> = ({ 
  session, 
  userRole 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sessionNotes, setSessionNotes] = useState('');
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatCouldImprove, setWhatCouldImprove] = useState('');
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  const completeLifecycle = useCompleteSessionLifecycle();
  const submitFeedback = useSessionFeedbackSubmission();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStartSession = () => {
    completeLifecycle.mutate({
      sessionId: session.id,
      action: 'start'
    });
  };

  const handleCompleteSession = () => {
    completeLifecycle.mutate({
      sessionId: session.id,
      action: 'complete',
      data: {
        notes: sessionNotes,
        whatWentWell,
        whatCouldImprove,
        summary: `Session completed with notes and feedback`
      }
    });
  };

  const handleSubmitFeedback = () => {
    if (rating === 0) {
      alert('Please provide a rating');
      return;
    }

    submitFeedback.mutate({
      sessionId: session.id,
      feedback: {
        rating,
        feedbackText,
        whatWentWell,
        whatCouldImprove
      }
    });
  };

  const StarRating = ({ value, onChange }: { value: number; onChange: (rating: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-1"
        >
          <Star
            className={`w-6 h-6 ${
              star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {session.title}
          </CardTitle>
          <Badge className={getStatusColor(session.status)}>
            {session.status.replace('_', ' ')}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {format(new Date(session.scheduled_at), 'MMM dd, yyyy • h:mm a')}
          </span>
          <span>{session.duration_minutes} minutes</span>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="conduct">Conduct Session</TabsTrigger>
            <TabsTrigger value="notes">Session Notes</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-4">
              {session.description && (
                <div>
                  <Label className="text-sm font-medium">Session Description</Label>
                  <p className="text-gray-700 mt-1">{session.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Scheduled Time</Label>
                  <p className="text-gray-700 mt-1">
                    {format(new Date(session.scheduled_at), 'EEEE, MMMM dd, yyyy')}
                    <br />
                    {format(new Date(session.scheduled_at), 'h:mm a')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Duration</Label>
                  <p className="text-gray-700 mt-1">{session.duration_minutes} minutes</p>
                </div>
              </div>

              {session.meeting_link && (
                <div>
                  <Label className="text-sm font-medium">Meeting Link</Label>
                  <div className="mt-1">
                    <Button
                      onClick={() => window.open(session.meeting_link, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <Video className="w-4 h-4" />
                      Join Meeting
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="conduct" className="space-y-4">
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Session Actions</h4>
                <div className="space-y-2">
                  {session.status === 'scheduled' && (
                    <Button
                      onClick={handleStartSession}
                      disabled={completeLifecycle.isPending}
                      className="w-full"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Start Session
                    </Button>
                  )}

                  {session.status === 'in_progress' && (
                    <Button
                      onClick={handleCompleteSession}
                      disabled={completeLifecycle.isPending}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Session
                    </Button>
                  )}

                  {session.meeting_link && (
                    <Button
                      onClick={() => window.open(session.meeting_link, '_blank')}
                      variant="outline"
                      className="w-full"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Join Meeting
                    </Button>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Session Guidelines</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Start with a brief check-in</li>
                  <li>• Review previous action items</li>
                  <li>• Focus on current challenges</li>
                  <li>• Set clear next steps</li>
                  <li>• End with action items and follow-up</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="session-notes">Session Notes</Label>
                <Textarea
                  id="session-notes"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Record key discussion points, decisions, and insights..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="what-went-well">What Went Well</Label>
                <Textarea
                  id="what-went-well"
                  value={whatWentWell}
                  onChange={(e) => setWhatWentWell(e.target.value)}
                  placeholder="Highlight positive aspects of the session..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="what-could-improve">What Could Improve</Label>
                <Textarea
                  id="what-could-improve"
                  value={whatCouldImprove}
                  onChange={(e) => setWhatCouldImprove(e.target.value)}
                  placeholder="Suggest areas for improvement..."
                  rows={3}
                />
              </div>

              {session.status === 'in_progress' && (
                <Button
                  onClick={handleCompleteSession}
                  disabled={completeLifecycle.isPending}
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Save Notes & Complete Session
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            {session.status === 'completed' ? (
              <div className="space-y-4">
                <div>
                  <Label>Overall Session Rating</Label>
                  <div className="mt-2">
                    <StarRating value={rating} onChange={setRating} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="feedback-text">Detailed Feedback</Label>
                  <Textarea
                    id="feedback-text"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Share your thoughts about the session..."
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleSubmitFeedback}
                  disabled={submitFeedback.isPending || rating === 0}
                  className="w-full"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Submit Feedback
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Feedback will be available after the session is completed</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CompleteSessionWorkflow;