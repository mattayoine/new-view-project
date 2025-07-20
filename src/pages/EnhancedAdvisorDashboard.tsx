
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, LogOut, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

// Import our focused components  
import { AdvisorImpactMetrics } from '@/components/dashboard/advisor/AdvisorImpactMetrics';
import { AdvisorFounderCards } from '@/components/dashboard/advisor/AdvisorFounderCards';
import { RealTimeDashboard } from '@/components/realtime/RealTimeDashboard';

// Import session management components
import { useAdvisorData } from '@/hooks/useAdvisorData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Star, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

const EnhancedAdvisorDashboard = () => {
  const { signOut } = useAuth();
  const { data } = useAdvisorData();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const { assignments } = data || {};
  const allSessions = assignments?.flatMap(a => a.sessions || []) || [];
  const upcomingSessions = allSessions.filter(
    session => session.status === 'scheduled' && new Date(session.scheduled_at) > new Date()
  );
  const completedSessions = allSessions.filter(session => session.status === 'completed');

  // Calculate current quarter
  const currentMonth = new Date().getMonth() + 1;
  const quarter = Math.ceil(currentMonth / 3);
  const monthInQuarter = ((currentMonth - 1) % 3) + 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="h-10 w-10">
              <Link to="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Advisor Dashboard</h1>
              <p className="text-lg text-gray-600 mt-1">Q{quarter} • Month {monthInQuarter} • Making Impact</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-2 text-sm px-4 py-2">
              <Trophy className="w-4 h-4" />
              Impact Advisor
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 px-4 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Impact Metrics */}
        <AdvisorImpactMetrics />

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border h-12 text-base">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-100 text-base py-3">
              Overview
            </TabsTrigger>
            <TabsTrigger value="founders" className="data-[state=active]:bg-gray-100 text-base py-3">
              My Founders
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-gray-100 text-base py-3">
              Sessions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-100 text-base py-3">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <RealTimeDashboard />
          </TabsContent>

          {/* Founders Tab */}
          <TabsContent value="founders" className="space-y-6">
            <AdvisorFounderCards />
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            {/* Upcoming Sessions */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Upcoming Sessions ({upcomingSessions.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.map((session) => {
                    const assignment = assignments?.find(a => a.sessions?.some(s => s.id === session.id));
                    return (
                      <div key={session.id} className="flex items-center justify-between p-6 border rounded-lg">
                        <div>
                          <h4 className="font-semibold text-lg">{session.title}</h4>
                          <p className="text-base text-gray-600 mt-1">
                            with {assignment?.founder?.email?.split('@')[0] || 'Founder'} • 
                            {format(new Date(session.scheduled_at), 'MMM dd, yyyy • h:mm a')}
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <Button className="bg-gray-900 hover:bg-gray-800 text-white text-base px-4 py-3 h-12">
                            Join Call
                          </Button>
                          <Button variant="outline" className="text-base px-4 py-3 h-12">
                            Reschedule
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center py-8 text-base">No upcoming sessions scheduled</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Recent Sessions ({completedSessions.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {completedSessions.length > 0 ? (
                  completedSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-6 border rounded-lg">
                      <div>
                        <h4 className="font-semibold text-lg">{session.title}</h4>
                        <p className="text-base text-gray-600 mt-1">
                          {format(new Date(session.scheduled_at), 'MMM dd')} • {session.duration_minutes || 60} min • 
                          {session.founder_rating ? ` ${session.founder_rating}⭐ feedback` : ' No rating yet'}
                        </p>
                      </div>
                      <Button variant="outline" className="text-base px-4 py-3 h-12">
                        View Summary
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8 text-base">No completed sessions yet</p>
                )}
              </CardContent>
            </Card>

            {/* Session Feedback */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <MessageSquare className="w-6 h-6" />
                  Recent Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {completedSessions
                    .filter(s => s.founder_feedback_text || s.founder_rating)
                    .slice(0, 3)
                    .map((session) => (
                    <div key={session.id} className="border-b pb-6 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-lg">{session.title}</h4>
                        {session.founder_rating && (
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-base">{session.founder_rating}/5</span>
                          </div>
                        )}
                      </div>
                      <p className="text-base text-gray-600 mb-2">
                        {format(new Date(session.scheduled_at), 'MMM dd, yyyy')}
                      </p>
                      {session.founder_feedback_text && (
                        <p className="text-gray-700 text-base leading-relaxed italic">
                          "{session.founder_feedback_text}"
                        </p>
                      )}
                    </div>
                  ))}
                  
                  {completedSessions.filter(s => s.founder_feedback_text || s.founder_rating).length === 0 && (
                    <p className="text-gray-500 text-center py-8 text-base">No feedback received yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <RealTimeDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedAdvisorDashboard;
