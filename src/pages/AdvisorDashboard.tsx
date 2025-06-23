
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Star, MessageSquare, User, Clock } from 'lucide-react';
import { useAdvisorData } from '@/hooks/useAdvisorData';
import ProfileSection from '@/components/dashboard/ProfileSection';

const AdvisorDashboard = () => {
  const { data, isLoading, error } = useAdvisorData();

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

  const { advisor, assignments } = data || {};
  const allSessions = assignments?.flatMap(a => a.sessions || []) || [];
  const upcomingSessions = allSessions.filter(
    session => session.status === 'scheduled' && new Date(session.scheduled_at) > new Date()
  );
  const completedSessions = allSessions.filter(session => session.status === 'completed');
  
  const avgRating = completedSessions.length > 0 
    ? completedSessions.reduce((sum, session) => sum + (session.founder_rating || 0), 0) / completedSessions.length 
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Advisor Dashboard</h1>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {avgRating > 0 && `${avgRating.toFixed(1)}⭐ Rating`}
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
                <CardTitle className="text-sm font-medium">Active Founders</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assignments?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Currently mentoring
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
        {/* Current Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Your Founders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignments && assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map((assignment: any) => (
                  <div key={assignment.id} className="space-y-2 border-b pb-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{assignment.founder?.email}</h4>
                      <Badge variant="outline">
                        {assignment.match_score}% match
                      </Badge>
                    </div>
                    
                    {assignment.sessions && assignment.sessions.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <p>Sessions: {assignment.sessions.length}</p>
                        <p>Last session: {
                          new Date(assignment.sessions[0]?.scheduled_at).toLocaleDateString()
                        }</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No active assignments yet. New founders will be matched to you soon!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allSessions.length > 0 ? (
              <div className="space-y-4">
                {allSessions.slice(0, 5).map((session: any) => (
                  <div key={session.id} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="font-medium text-sm">{session.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(session.scheduled_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.founder_rating && (
                        <span className="text-sm">
                          {session.founder_rating}⭐
                        </span>
                      )}
                      <Badge variant={session.status === 'completed' ? 'default' : 'outline'}>
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No sessions yet. Start scheduling with your assigned founders!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {assignments?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Assignments</h3>
            <p className="text-gray-600">
              You haven't been assigned any founders yet. Our team will match you with founders soon!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvisorDashboard;
