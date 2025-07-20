
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

// Import our focused components
import { FounderJourneySection } from '@/components/dashboard/founder/FounderJourneySection';
import { FounderMetricsCards } from '@/components/dashboard/founder/FounderMetricsCards';
import { FounderAdvisorCards } from '@/components/dashboard/founder/FounderAdvisorCards';
import { RealTimeDashboard } from '@/components/realtime/RealTimeDashboard';

// Import existing session components for sessions tab
import { useFounderSessions } from '@/hooks/useFounderData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Video } from 'lucide-react';
import { format } from 'date-fns';

const EnhancedFounderDashboard = () => {
  const { signOut } = useAuth();
  const { data: sessions } = useFounderSessions();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const upcomingSessions = sessions?.filter(
    session => session.status === 'scheduled' && new Date(session.scheduled_at) > new Date()
  ) || [];

  const completedSessions = sessions?.filter(session => session.status === 'completed') || [];

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
              <h1 className="text-3xl font-bold text-gray-900">Founder Dashboard</h1>
              <p className="text-lg text-gray-600 mt-1">Your CoPilot Journey</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-sm px-4 py-2">
              Active Pilot
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

        {/* Journey Progress */}
        <FounderJourneySection />

        {/* Metrics Cards */}
        <FounderMetricsCards />

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border h-12 text-base">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-100 text-base py-3">
              Overview
            </TabsTrigger>
            <TabsTrigger value="advisors" className="data-[state=active]:bg-gray-100 text-base py-3">
              My Advisors
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

          {/* Advisors Tab */}
          <TabsContent value="advisors" className="space-y-6">
            <FounderAdvisorCards />
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
                  upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-6 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{session.title}</h4>
                        <p className="text-base text-gray-600 mt-1">{session.description}</p>
                        <div className="flex items-center gap-6 mt-3 text-base text-gray-500">
                          <span className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            {format(new Date(session.scheduled_at), 'MMM dd, yyyy')}
                          </span>
                          <span className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            {format(new Date(session.scheduled_at), 'h:mm a')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {session.meeting_link && (
                          <Button size="lg" onClick={() => window.open(session.meeting_link, '_blank')}>
                            <Video className="w-5 h-5 mr-2" />
                            Join
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8 text-base">No upcoming sessions scheduled</p>
                )}
              </CardContent>
            </Card>

            {/* Session History */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Session History ({completedSessions.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {completedSessions.length > 0 ? (
                  completedSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-6 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{session.title}</h4>
                        <p className="text-base text-gray-600 mt-1">
                          {format(new Date(session.scheduled_at), 'MMM dd, yyyy')} • 
                          {session.duration_minutes ? ` ${session.duration_minutes} min` : ' Duration N/A'}
                        </p>
                        {session.ai_summary && (
                          <p className="text-base text-gray-500 mt-2">{session.ai_summary.substring(0, 100)}...</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {session.founder_rating && (
                          <div className="text-base text-gray-500">
                            Rating: {session.founder_rating}/5
                          </div>
                        )}
                        <Button variant="outline" size="lg">
                          View Notes
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8 text-base">No completed sessions yet</p>
                )}
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

export default EnhancedFounderDashboard;
