
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  MessageCircle,
  Star,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useSessionFlow } from '@/hooks/useSessionFlow';

export const AssignmentFlowTracker: React.FC = () => {
  const { data: sessionFlow, isLoading } = useSessionFlow();

  if (isLoading || !sessionFlow) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { sessionMetrics, activeAssignments, upcomingSessions, sessionProposals } = sessionFlow;

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Assignments</p>
                <p className="text-2xl font-bold">{activeAssignments.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Sessions</p>
                <p className="text-2xl font-bold">{sessionMetrics.upcomingCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Sessions</p>
                <p className="text-2xl font-bold">{sessionMetrics.completedSessions}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold">
                  {sessionMetrics.averageRating > 0 ? sessionMetrics.averageRating.toFixed(1) : 'N/A'}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Active Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeAssignments.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No active assignments yet</p>
              <p className="text-sm text-gray-500">
                Assignments will appear here once you're matched with a mentor/mentee
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {assignment.advisor?.email} ↔ {assignment.founder?.email}
                      </p>
                      <p className="text-sm text-gray-600">
                        Match Score: {assignment.match_score}% • 
                        Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {assignment.status}
                    </Badge>
                    <div className="text-right text-sm">
                      <p>{assignment.completed_sessions || 0} sessions</p>
                      <p className="text-gray-500">
                        {assignment.avg_rating ? `${assignment.avg_rating.toFixed(1)}★` : 'No rating'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No upcoming sessions scheduled</p>
              <Button className="mt-4" size="sm">
                Schedule a Session
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-blue-50"
                >
                  <div>
                    <p className="font-medium">{session.title}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(session.scheduled_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-700">
                      {session.status}
                    </Badge>
                    {session.meeting_link && (
                      <Button size="sm" variant="outline">
                        Join
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Proposals */}
      {sessionProposals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Pending Session Proposals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessionProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50"
                >
                  <div>
                    <p className="font-medium">{proposal.title}</p>
                    <p className="text-sm text-gray-600">
                      Proposed {new Date(proposal.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                      {proposal.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
