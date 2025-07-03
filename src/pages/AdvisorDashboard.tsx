
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Star, MessageSquare, User, Clock, ArrowLeft, Target, Award, Trophy } from 'lucide-react';
import { useAdvisorData } from '@/hooks/useAdvisorData';
import { useAdvisorSessionHub } from '@/hooks/useAdvisorSessionHub';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const AdvisorDashboard = () => {
  const { data, isLoading, error } = useAdvisorData();
  const { data: sessionHubData } = useAdvisorSessionHub();
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center">
          <p className="text-red-600">Error loading dashboard data</p>
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
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Advisor Dashboard</h1>
              <p className="text-gray-600">Month {monthInQuarter} of {quarter} • Making Impact</p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            Top Advisor
          </Badge>
        </div>

        {/* Impact Metrics */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Your Impact This Quarter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {completedSessionCount}
                </div>
                <div className="text-gray-600">Sessions Completed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {totalFoundersCount}
                </div>
                <div className="text-gray-600">Founders Mentored</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {satisfactionScore}%
                </div>
                <div className="text-gray-600">Satisfaction Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-100">
              Overview
            </TabsTrigger>
            <TabsTrigger value="founders" className="data-[state=active]:bg-gray-100">
              My Founders
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-gray-100">
              Sessions
            </TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-gray-100">
              Feedback
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Welcome Section */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🚀</span>
                      <div className="space-y-4 flex-1">
                        <h2 className="text-xl font-semibold">Welcome Back!</h2>
                        <p className="text-gray-600">
                          Your expertise is making a real difference. Here's what's on your agenda:
                        </p>
                        
                        <div className="space-y-3">
                          {upcomingSessions.slice(0, 3).map((session, index) => {
                            const assignment = assignments?.find(a => a.sessions?.some(s => s.id === session.id));
                            return (
                              <div key={session.id} className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <span className="text-sm">
                                  Next session with {assignment?.founder?.email?.split('@')[0] || 'Founder'} - {format(new Date(session.scheduled_at), 'MMM dd, h:mm a')}
                                </span>
                              </div>
                            );
                          })}
                          <div className="flex items-center gap-3">
                            <MessageSquare className="w-4 h-4 text-green-600" />
                            <span className="text-sm">Masterclass prep: "Scaling in Emerging Markets"</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Star className="w-4 h-4 text-purple-600" />
                            <span className="text-sm">Submit monthly impact summary</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Masterclass */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🎯</span>
                      <div className="space-y-4 flex-1">
                        <h2 className="text-xl font-semibold">Upcoming Masterclass</h2>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="font-semibold mb-2">Scaling in Emerging Markets</h3>
                          <p className="text-gray-600 text-sm mb-3">Share your expertise with 15+ African founders</p>
                          <p className="text-gray-500 text-sm">{format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'MMM dd, yyyy • h:mm a')} GMT</p>
                        </div>
                        <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                          Prepare Session
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recognition Section */}
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Recognition</h3>
                    <div className="text-lg font-bold text-yellow-600 mb-1">Advisor of Impact</div>
                    <div className="text-sm text-gray-500">March 2025</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quote Wall */}
            {testimonials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Quote Wall
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {testimonials.map((testimonial, index) => (
                    <div key={index} className={`border-l-4 pl-4 ${index === 0 ? 'border-yellow-400' : 'border-green-400'}`}>
                      <p className="text-gray-700 italic mb-2">"{testimonial.text}"</p>
                      <p className="text-sm text-gray-500">- {testimonial.founder}, {testimonial.company}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Impact Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Impact Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {avgRating.toFixed(1)}/5
                    </div>
                    <div className="text-gray-600">Average Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      100%
                    </div>
                    <div className="text-gray-600">Would Recommend</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Founders Tab */}
          <TabsContent value="founders" className="space-y-6">
            <div className="space-y-4">
              {assignments?.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {assignment.founder?.email?.split('@')[0] || 'Founder'} - Startup Name
                            </h3>
                            <Badge className="bg-green-100 text-green-800 mt-1">
                              Active
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Startup Focus:</h4>
                            <p className="text-gray-600 text-sm">
                              Technology startup focused on emerging markets. Seeking international expansion.
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Key Challenge:</h4>
                            <p className="text-gray-600 text-sm">
                              Scaling operations while maintaining quality control across multiple countries.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <Button variant="outline" size="sm">
                            View Full Brief
                          </Button>
                          <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white">
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
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">No active assignments yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            {/* Upcoming Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{session.title}</h4>
                        <p className="text-sm text-gray-600">
                          {format(new Date(session.scheduled_at), 'MMM dd, yyyy • h:mm a')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button className="bg-gray-900 hover:bg-gray-800 text-white" size="sm">
                          Join Call
                        </Button>
                        <Button variant="outline" size="sm">
                          Reschedule
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No upcoming sessions scheduled</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {completedSessions.length > 0 ? (
                  completedSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{session.title}</h4>
                        <p className="text-sm text-gray-600">
                          {format(new Date(session.scheduled_at), 'MMM dd')} • {session.duration_minutes || 60} min • 
                          {session.founder_rating ? ` ${session.founder_rating}⭐ feedback` : ' No rating yet'}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Summary
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No completed sessions yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedSessions
                    .filter(s => s.founder_feedback_text || s.founder_rating)
                    .slice(0, 5)
                    .map((session) => (
                    <div key={session.id} className="border-b pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{session.title}</h4>
                        {session.founder_rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm">{session.founder_rating}/5</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {format(new Date(session.scheduled_at), 'MMM dd, yyyy')}
                      </p>
                      {session.founder_feedback_text && (
                        <p className="text-gray-700 text-sm">"{session.founder_feedback_text}"</p>
                      )}
                    </div>
                  ))}
                  
                  {completedSessions.filter(s => s.founder_feedback_text || s.founder_rating).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No feedback received yet</p>
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
