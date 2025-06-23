
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Target, MessageSquare, TrendingUp, User, Clock } from 'lucide-react';
import { useFounderData } from '@/hooks/useFounderData';
import ProfileSection from '@/components/dashboard/ProfileSection';

const FounderDashboard = () => {
  const { data, isLoading, error } = useFounderData();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-red-600">Error loading dashboard data</p>
        </div>
      </div>
    );
  }

  const { founder, assignments, goals } = data || {};
  const activeAssignment = assignments?.[0];
  const upcomingSessions = activeAssignment?.sessions?.filter(
    session => session.status === 'scheduled' && new Date(session.scheduled_at) > new Date()
  ) || [];
  const completedSessions = activeAssignment?.sessions?.filter(
    session => session.status === 'completed'
  ) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Founder Dashboard</h1>
        <Badge variant="outline" className="text-lg px-3 py-1">
          Welcome back!
        </Badge>
      </div>

      {/* Profile Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ProfileSection />
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{goals?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Keep pushing forward
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sessions Complete</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedSessions.length}</div>
                <p className="text-xs text-muted-foreground">
                  Total mentoring sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingSessions.length}</div>
                <p className="text-xs text-muted-foreground">
                  Sessions scheduled
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Assignment */}
        {activeAssignment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Your Advisor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">{activeAssignment.advisor?.email}</h3>
                <p className="text-sm text-gray-600">
                  Match Score: {activeAssignment.match_score}%
                </p>
              </div>
              
              {activeAssignment.sessions && activeAssignment.sessions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Recent Sessions</h4>
                  <div className="space-y-2">
                    {activeAssignment.sessions.slice(0, 3).map((session: any) => (
                      <div key={session.id} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <p className="font-medium text-sm">{session.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(session.scheduled_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={session.status === 'completed' ? 'default' : 'outline'}>
                          {session.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Active Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goals && goals.length > 0 ? (
              <div className="space-y-4">
                {goals.slice(0, 3).map((goal: any) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{goal.title}</h4>
                      <Badge variant="outline" className="capitalize">
                        {goal.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{goal.description}</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Progress: {goal.progress_percentage}%</span>
                      {goal.target_date && (
                        <span>Due: {new Date(goal.target_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No active goals yet. Work with your advisor to set some!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {!activeAssignment && (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Assignment</h3>
            <p className="text-gray-600">
              You haven't been matched with an advisor yet. Our team is working on finding the perfect match for you!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FounderDashboard;
