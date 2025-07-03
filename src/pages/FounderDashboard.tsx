
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Target, User, CheckCircle, FileText, Clock, ArrowLeft, BookOpen, Video } from 'lucide-react';
import { useFounderData } from '@/hooks/useFounderData';
import { useFounderSessionStats } from '@/hooks/useFounderSessionExperience';
import { useFounderSessions } from '@/hooks/useFounderData';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const FounderDashboard = () => {
  const { data, isLoading, error } = useFounderData();
  const { data: sessionStats } = useFounderSessionStats();
  const { data: sessions } = useFounderSessions();
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

  const { founder, assignments, goals } = data || {};
  const activeAssignment = assignments?.[0];
  
  // Real session data
  const upcomingSessions = sessions?.filter(
    session => session.status === 'scheduled' && new Date(session.scheduled_at) > new Date()
  ) || [];
  
  const completedSessions = sessions?.filter(
    session => session.status === 'completed'
  ) || [];

  // Calculate real journey progress based on completed sessions and goals
  const totalPlannedSessions = activeAssignment?.total_sessions || 6;
  const completedSessionCount = activeAssignment?.completed_sessions || 0;
  const journeyProgress = Math.round((completedSessionCount / totalPlannedSessions) * 100);
  
  // Calculate current month based on assignment start date
  const assignmentStartDate = activeAssignment?.assigned_at ? new Date(activeAssignment.assigned_at) : new Date();
  const currentDate = new Date();
  const monthsDiff = Math.max(1, Math.ceil((currentDate.getTime() - assignmentStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const currentMonth = Math.min(monthsDiff, 6);
  const totalMonths = 6;

  // Real milestones based on journey progress
  const milestones = [
    { month: 1, label: 'Setup', completed: currentMonth >= 1 },
    { month: 3, label: 'Masterclass', completed: currentMonth >= 3 },
    { month: 6, label: 'Case Study', completed: currentMonth >= 6 }
  ];

  // Real upcoming tasks based on actual data
  const upcomingTasks = [
    { 
      icon: CheckCircle, 
      text: upcomingSessions.length > 0 
        ? `Complete your session with ${activeAssignment?.advisor?.email || 'advisor'}`
        : 'Schedule your next advisory session',
      completed: false 
    },
    { 
      icon: FileText, 
      text: 'Submit your monthly reflection form',
      completed: false 
    },
    { 
      icon: BookOpen, 
      text: currentMonth >= 2 ? 'Prepare for Masterclass #1' : 'Complete onboarding materials',
      completed: false 
    }
  ];

  // Real toolkit items (this would come from resources table in a full implementation)
  const toolkitItems = [
    {
      title: 'Pricing Strategy Framework',
      author: 'By Sarah Chen',
      usage: 'Used by 50+ founders'
    },
    {
      title: 'Pitch Deck Template',
      author: 'Proven template for African startups',
      usage: ''
    },
    {
      title: 'Export Readiness Checklist',
      author: 'Essential steps for international expansion',
      usage: ''
    },
    {
      title: 'Financial Model Template',
      author: 'Excel template for revenue projections',
      usage: ''
    }
  ];

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
              <h1 className="text-2xl font-bold text-gray-900">Founder Dashboard</h1>
              <p className="text-gray-600">Month {currentMonth} of {totalMonths} • Welcome to CoPilot</p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            {activeAssignment?.status === 'active' ? 'Active Pilot' : 'Inactive'}
          </Badge>
        </div>

        {/* Journey Progress */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Your 6-Month Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-gray-900 rounded-full transition-all duration-500"
                    style={{ width: `${journeyProgress}%` }}
                  />
                </div>
              </div>
              
              {/* Milestones */}
              <div className="flex justify-between text-sm text-gray-600">
                {milestones.map((milestone) => (
                  <div key={milestone.month} className="text-center">
                    <div className={`font-medium ${milestone.completed ? 'text-green-600' : 'text-gray-600'}`}>
                      Month {milestone.month}: {milestone.label}
                    </div>
                  </div>
                ))}
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
            <TabsTrigger value="advisors" className="data-[state=active]:bg-gray-100">
              My Advisors
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-gray-100">
              Sessions
            </TabsTrigger>
            <TabsTrigger value="toolkit" className="data-[state=active]:bg-gray-100">
              Toolkit
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Welcome Section */}
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">👋</span>
                      <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Welcome Back, {founder?.email?.split('@')[0] || 'Founder'}!</h2>
                        <p className="text-gray-600">
                          You're making great progress in your CoPilot journey. Here's what's coming up this month:
                        </p>
                        
                        <div className="space-y-3">
                          {upcomingTasks.map((task, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <task.icon className={`w-5 h-5 ${task.completed ? 'text-green-600' : 'text-blue-600'}`} />
                              <span className={task.completed ? 'line-through text-gray-500' : 'text-gray-700'}>
                                {task.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* This Week's Reflection */}
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">💭</span>
                      <div className="space-y-4 flex-1">
                        <h2 className="text-xl font-semibold">This Week's Reflection</h2>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-blue-900 italic">"What's 1 small win this week?"</p>
                        </div>
                        <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                          Share Your Win
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {sessionStats?.completedSessions || completedSessionCount}
                    </div>
                    <div className="text-gray-600">Sessions Completed</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {assignments?.length || 0}
                    </div>
                    <div className="text-gray-600">Active Advisors</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {Math.round(sessionStats?.goalProgress || journeyProgress)}%
                    </div>
                    <div className="text-gray-600">Goal Progress</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* My Advisors Tab */}
          <TabsContent value="advisors" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignments?.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {assignment.advisor?.email || 'Advisor'}
                          </h3>
                          <Badge className="bg-blue-100 text-blue-800">Expert Advisor</Badge>
                        </div>
                        
                        <p className="text-gray-600 text-sm">
                          Experienced advisor with {assignment.completed_sessions || 0} completed sessions. 
                          Average rating: {assignment.avg_rating ? `${assignment.avg_rating.toFixed(1)}/5` : 'N/A'}.
                        </p>
                        
                        <div className="space-y-2">
                          {upcomingSessions.length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium">Next Session:</span>
                              <br />
                              <span className="text-gray-600">
                                {format(new Date(upcomingSessions[0].scheduled_at), 'MMM dd, yyyy • h:mm a')}
                              </span>
                            </div>
                          )}
                          
                          {completedSessions.length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium">Last Session:</span>
                              <br />
                              <span className="text-gray-600">
                                {format(new Date(completedSessions[0].scheduled_at), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                          {upcomingSessions.length > 0 ? 'View Next Session' : 'Schedule Next Session'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {(!assignments || assignments.length === 0) && (
                <Card className="col-span-full">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">No advisors assigned yet</p>
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
                <CardTitle>Upcoming Sessions ({upcomingSessions.length})</CardTitle>
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
                        <p className="text-sm text-gray-500">{session.description}</p>
                      </div>
                      <div className="flex gap-2">
                        {session.meeting_link && (
                          <Button className="bg-gray-900 hover:bg-gray-800 text-white" size="sm">
                            <Video className="w-4 h-4 mr-2" />
                            Join Call
                          </Button>
                        )}
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

            {/* Session History */}
            <Card>
              <CardHeader>
                <CardTitle>Session History ({completedSessions.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {completedSessions.length > 0 ? (
                  completedSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{session.title}</h4>
                        <p className="text-sm text-gray-600">
                          {format(new Date(session.scheduled_at), 'MMM dd, yyyy')} • 
                          {session.duration_minutes ? ` ${session.duration_minutes} min` : ' Duration N/A'}
                        </p>
                        {session.ai_summary && (
                          <p className="text-sm text-gray-500 mt-1">{session.ai_summary.substring(0, 100)}...</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {session.founder_rating && (
                          <div className="text-sm text-gray-500">
                            Rating: {session.founder_rating}/5
                          </div>
                        )}
                        <Button variant="outline" size="sm">
                          View Notes
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No completed sessions yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Toolkit Tab */}
          <TabsContent value="toolkit" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <CardTitle>Founder Toolkit</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {toolkitItems.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                      <h4 className="font-medium mb-2">{item.title}</h4>
                      <p className="text-sm text-gray-600 mb-1">{item.author}</p>
                      {item.usage && (
                        <p className="text-xs text-gray-500">{item.usage}</p>
                      )}
                    </div>
                  ))}
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
