
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Star, MessageSquare, User, Clock, ArrowLeft, Target, Award, Trophy, LogOut } from 'lucide-react';
import { useAdvisorData } from '@/hooks/useAdvisorData';
import { useAdvisorSessionHub } from '@/hooks/useAdvisorSessionHub';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const AdvisorDashboard = () => {
  const { data, isLoading, error } = useAdvisorData();
  const { data: sessionHubData } = useAdvisorSessionHub();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-red-600 text-sm">Error loading dashboard data</p>
        </div>
      </div>
    );
  }

  const { advisor, assignments } = data || {};
  const { sessionPortfolio, performanceMetrics } = sessionHubData || {};
  
  const allSessions = assignments?.flatMap(a => a.sessions || []) || [];
  const upcomingSessions = allSessions.filter(
    session => session.status === 'scheduled' && new Date(session.scheduled_at) > new Date()
  );
  const completedSessions = allSessions.filter(session => session.status === 'completed');
  
  // Calculate real metrics
  const totalFoundersCount = assignments?.length || 0;
  const completedSessionCount = completedSessions.length;
  const avgRating = completedSessions.length > 0 
    ? completedSessions.reduce((sum, session) => sum + (session.founder_rating || 0), 0) / completedSessions.length 
    : 0;
  const satisfactionScore = Math.round(avgRating * 20); // Convert to percentage

  // Calculate current quarter (simplified)
  const currentMonth = new Date().getMonth() + 1;
  const quarter = Math.ceil(currentMonth / 3);
  const monthInQuarter = ((currentMonth - 1) % 3) + 1;

  // Sample testimonials/quotes from recent sessions
  const testimonials = completedSessions
    .filter(s => s.founder_feedback_text)
    .slice(0, 2)
    .map(s => ({
      text: s.founder_feedback_text,
      founder: assignments?.find(a => a.sessions?.some(session => session.id === s.id))?.founder?.email?.split('@')[0] || 'Founder',
      company: 'Startup' // This would come from founder profile in real implementation
    }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <Link to="/">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Advisor Dashboard</h1>
              <p className="text-sm text-gray-600">Month {monthInQuarter} of {quarter} • Making Impact</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1 text-xs px-2 py-1">
              <Trophy className="w-3 h-3" />
              Top Advisor
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-3 h-3 mr-1" />
              Logout
            </Button>
          </div>
        </div>

        {/* Impact Metrics */}
        <Card className="bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-4 h-4 text-green-600" />
              Your Impact This Quarter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {completedSessionCount}
                </div>
                <div className="text-sm text-gray-600">Sessions Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {totalFoundersCount}
                </div>
                <div className="text-sm text-gray-600">Founders Mentored</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {satisfactionScore}%
                </div>
                <div className="text-sm text-gray-600">Satisfaction Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-white border h-9">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-100 text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="founders" className="data-[state=active]:bg-gray-100 text-sm">
              My Founders
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-gray-100 text-sm">
              Sessions
            </TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-gray-100 text-sm">
              Feedback
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Welcome Section */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">🚀</span>
                      <div className="space-y-3 flex-1">
                        <h2 className="text-lg font-semibold">Welcome Back!</h2>
                        <p className="text-sm text-gray-600">
                          Your expertise is making a real difference. Here's what's on your agenda:
                        </p>
                        
                        <div className="space-y-2">
                          {upcomingSessions.slice(0, 3).map((session, index) => {
                            const assignment = assignments?.find(a => a.sessions?.some(s => s.id === session.id));
                            return (
                              <div key={session.id} className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-blue-600" />
                                <span className="text-xs">
                                  Next session with {assignment?.founder?.email?.split('@')[0] || 'Founder'} - {format(new Date(session.scheduled_at), 'MMM dd, h:mm a')}
                                </span>
                              </div>
                            );
                          })}
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-3 h-3 text-green-600" />
                            <span className="text-xs">Masterclass prep: "Scaling in Emerging Markets"</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="w-3 h-3 text-purple-600" />
                            <span className="text-xs">Submit monthly impact summary</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Masterclass */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">🎯</span>
                      <div className="space-y-3 flex-1">
                        <h2 className="text-lg font-semibold">Upcoming Masterclass</h2>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h3 className="font-semibold mb-1 text-sm">Scaling in Emerging Markets</h3>
                          <p className="text-gray-600 text-xs mb-2">Share your expertise with 15+ African founders</p>
                          <p className="text-gray-500 text-xs">{format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'MMM dd, yyyy • h:mm a')} GMT</p>
                        </div>
                        <Button className="bg-gray-900 hover:bg-gray-800 text-white text-sm px-3 py-1 h-8">
                          Prepare Session
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recognition Section */}
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Award className="w-6 h-6 text-yellow-600" />
                    </div>
                    <h3 className="font-semibold mb-1 text-sm">Recognition</h3>
                    <div className="text-base font-bold text-yellow-600 mb-1">Advisor of Impact</div>
                    <div className="text-xs text-gray-500">March 2025</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quote Wall */}
            {testimonials.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="w-4 h-4" />
                    Quote Wall
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {testimonials.map((testimonial, index) => (
                    <div key={index} className={`border-l-4 pl-3 ${index === 0 ? 'border-yellow-400' : 'border-green-400'}`}>
                      <p className="text-gray-700 italic mb-1 text-sm">"{testimonial.text}"</p>
                      <p className="text-xs text-gray-500">- {testimonial.founder}, {testimonial.company}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Impact Metrics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Impact Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {avgRating.toFixed(1)}/5
                    </div>
                    <div className="text-sm text-gray-600">Average Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      100%
                    </div>
                    <div className="text-sm text-gray-600">Would Recommend</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Founders Tab */}
          <TabsContent value="founders" className="space-y-4">
            <div className="space-y-3">
              {assignments?.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-base">
                              {assignment.founder?.email?.split('@')[0] || 'Founder'} - Startup Name
                            </h3>
                            <Badge className="bg-green-100 text-green-800 mt-1 text-xs px-2 py-0.5">
                              Active
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1 text-sm">Startup Focus:</h4>
                            <p className="text-gray-600 text-xs">
                              Technology startup focused on emerging markets. Seeking international expansion.
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1 text-sm">Key Challenge:</h4>
                            <p className="text-gray-600 text-xs">
                              Scaling operations while maintaining quality control across multiple countries.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-7">
                            View Full Brief
                          </Button>
                          <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white text-xs px-2 py-1 h-7">
                            Schedule Session
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {(!assignments || assignments.length === 0) && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-gray-500 text-sm">No active assignments yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            {/* Upcoming Sessions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm">{session.title}</h4>
                        <p className="text-xs text-gray-600">
                          {format(new Date(session.scheduled_at), 'MMM dd, yyyy • h:mm a')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button className="bg-gray-900 hover:bg-gray-800 text-white text-xs px-2 py-1 h-7">
                          Join Call
                        </Button>
                        <Button variant="outline" className="text-xs px-2 py-1 h-7">
                          Reschedule
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-3 text-sm">No upcoming sessions scheduled</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {completedSessions.length > 0 ? (
                  completedSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm">{session.title}</h4>
                        <p className="text-xs text-gray-600">
                          {format(new Date(session.scheduled_at), 'MMM dd')} • {session.duration_minutes || 60} min • 
                          {session.founder_rating ? ` ${session.founder_rating}⭐ feedback` : ' No rating yet'}
                        </p>
                      </div>
                      <Button variant="outline" className="text-xs px-2 py-1 h-7">
                        View Summary
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-3 text-sm">No completed sessions yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Session Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedSessions
                    .filter(s => s.founder_feedback_text || s.founder_rating)
                    .slice(0, 5)
                    .map((session) => (
                    <div key={session.id} className="border-b pb-3">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-sm">{session.title}</h4>
                        {session.founder_rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs">{session.founder_rating}/5</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        {format(new Date(session.scheduled_at), 'MMM dd, yyyy')}
                      </p>
                      {session.founder_feedback_text && (
                        <p className="text-gray-700 text-xs">"{session.founder_feedback_text}"</p>
                      )}
                    </div>
                  ))}
                  
                  {completedSessions.filter(s => s.founder_feedback_text || s.founder_rating).length === 0 && (
                    <p className="text-gray-500 text-center py-3 text-sm">No feedback received yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdvisorDashboard;
