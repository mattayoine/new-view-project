
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Users, BookOpen, Target, FileText, CheckCircle } from "lucide-react";
import { useFounderData, useFounderSessions } from "@/hooks/useFounderData";

const FounderDashboard = () => {
  const [currentMonth] = useState(2); // Simulating Month 2
  const founderId = "temp-founder-id"; // TODO: Get from auth context
  
  const { data: founderData, isLoading: founderLoading } = useFounderData(founderId);
  const { data: sessions, isLoading: sessionsLoading } = useFounderSessions(founderId);

  if (founderLoading || sessionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
  const upcomingSessions = sessions?.filter(s => s.status === 'scheduled').slice(0, 2) || [];
  const recentSessions = sessions?.filter(s => s.status === 'completed').slice(0, 2) || [];
  const activeGoals = founderData?.goals?.filter(g => g.status === 'active').length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="mr-4">
              <ArrowLeft className="h-5 w-5 text-gray-500 hover:text-blue-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Founder Dashboard</h1>
              <p className="text-sm text-gray-600">Month {currentMonth} of 6 • Welcome to CoPilot</p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800">Active Pilot</Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-600" />
              Your 6-Month Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={(currentMonth / 6) * 100} className="w-full" />
              <div className="flex justify-between text-xs text-gray-600">
                <span>Month 1: Setup</span>
                <span>Month 3: Masterclass</span>
                <span>Month 6: Case Study</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="advisors">My Advisors</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="resources">Toolkit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Welcome & Quick Actions */}
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Welcome Back! 👋</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    You're making great progress in your CoPilot journey. Here's what's coming up this month:
                  </p>
                  <div className="space-y-3">
                    {upcomingSessions.length > 0 ? (
                      upcomingSessions.map((session, index) => (
                        <div key={session.id} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                          <span className="text-sm">{session.title || 'Advisory Session'} - {new Date(session.scheduled_at).toLocaleDateString()}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-start">
                        <Calendar className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                        <span className="text-sm">Schedule your next advisory session</span>
                      </div>
                    )}
                    <div className="flex items-start">
                      <BookOpen className="h-5 w-5 text-purple-500 mr-3 mt-0.5" />
                      <span className="text-sm">Prepare for Masterclass #1 next month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{completedSessions}</div>
                    <div className="text-sm text-gray-600">Sessions Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{founderData?.assignments?.length || 0}</div>
                    <div className="text-sm text-gray-600">Active Advisors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{activeGoals > 0 ? Math.min(85, activeGoals * 25) : 0}%</div>
                    <div className="text-sm text-gray-600">Goal Progress</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Reflection */}
            <Card>
              <CardHeader>
                <CardTitle>This Week's Reflection 💭</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-blue-800 font-medium">"What's 1 small win this week?"</p>
                </div>
                <Button className="w-full sm:w-auto">Share Your Win</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advisors" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {founderData?.assignments?.map((assignment, index) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      {assignment.advisor?.email?.split('@')[0] || 'Advisor'}
                    </CardTitle>
                    <Badge className="w-fit bg-blue-100 text-blue-800">Expert Advisor</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Experienced advisor helping you navigate challenges and accelerate growth.
                    </p>
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500">Total Sessions:</div>
                      <div className="text-sm font-medium">{assignment.total_sessions || 0} completed</div>
                    </div>
                    <Button size="sm" className="w-full">Schedule Next Session</Button>
                  </CardContent>
                </Card>
              )) || (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-600">No advisors assigned yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingSessions.length > 0 ? upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <div className="font-medium">{session.title || 'Advisory Session'}</div>
                        <div className="text-sm text-gray-600">{new Date(session.scheduled_at).toLocaleString()}</div>
                      </div>
                      <Button size="sm">Join Call</Button>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-600">
                      No upcoming sessions scheduled
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Session History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentSessions.length > 0 ? recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{session.title || 'Advisory Session'}</div>
                        <div className="text-xs text-gray-600">{new Date(session.scheduled_at).toLocaleDateString()} • {session.duration_minutes || 60} min</div>
                      </div>
                      <Button size="sm" variant="ghost">View Notes</Button>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-600">
                      No completed sessions yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Founder Toolkit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="font-medium text-sm mb-2">Pricing Strategy Framework</div>
                    <div className="text-xs text-gray-600">Essential framework for pricing decisions</div>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="font-medium text-sm mb-2">Export Readiness Checklist</div>
                    <div className="text-xs text-gray-600">Essential steps for international expansion</div>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="font-medium text-sm mb-2">Pitch Deck Template</div>
                    <div className="text-xs text-gray-600">Proven template for African startups</div>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="font-medium text-sm mb-2">Financial Model Template</div>
                    <div className="text-xs text-gray-600">Excel template for revenue projections</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FounderDashboard;
