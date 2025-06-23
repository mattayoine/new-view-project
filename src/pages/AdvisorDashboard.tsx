
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Users, Award, MessageSquare, FileText, Star } from "lucide-react";
import { useAdvisorData, useAdvisorSessions, useAdvisorTestimonials } from "@/hooks/useAdvisorData";

const AdvisorDashboard = () => {
  const [currentMonth] = useState(3); // Simulating Month 3
  const advisorId = "temp-advisor-id"; // TODO: Get from auth context
  
  const { data: advisorData, isLoading: advisorLoading } = useAdvisorData(advisorId);
  const { data: sessions, isLoading: sessionsLoading } = useAdvisorSessions(advisorId);
  const { data: testimonials, isLoading: testimonialsLoading } = useAdvisorTestimonials(advisorId);

  if (advisorLoading || sessionsLoading || testimonialsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
  const foundersCount = advisorData?.assignments?.length || 0;
  const avgRating = advisorData?.assignments?.reduce((acc, assignment) => {
    return acc + (assignment.avg_rating || 0);
  }, 0) / (foundersCount || 1);
  
  const upcomingSessions = sessions?.filter(s => s.status === 'scheduled').slice(0, 2) || [];
  const recentSessions = sessions?.filter(s => s.status === 'completed').slice(0, 2) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="mr-4">
              <ArrowLeft className="h-5 w-5 text-gray-500 hover:text-green-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Advisor Dashboard</h1>
              <p className="text-sm text-gray-600">Month {currentMonth} of 6 • Making Impact</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-green-100 text-green-800">
              <Star className="h-3 w-3 mr-1" />
              Top Advisor
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Impact Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-green-600" />
              Your Impact This Quarter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{completedSessions}</div>
                <div className="text-sm text-gray-600">Sessions Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{foundersCount}</div>
                <div className="text-sm text-gray-600">Founders Mentored</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{avgRating ? Math.round(avgRating * 20) : 95}%</div>
                <div className="text-sm text-gray-600">Satisfaction Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="founders">My Founders</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Welcome & Quick Actions */}
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Welcome Back! 🚀</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Your expertise is making a real difference. Here's what's on your agenda:
                  </p>
                  <div className="space-y-3">
                    {upcomingSessions.length > 0 ? (
                      upcomingSessions.map((session) => (
                        <div key={session.id} className="flex items-start">
                          <Calendar className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                          <span className="text-sm">Next session: {session.title || 'Advisory Session'} - {new Date(session.scheduled_at).toLocaleDateString()}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-start">
                        <Calendar className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                        <span className="text-sm">No upcoming sessions scheduled</span>
                      </div>
                    )}
                    <div className="flex items-start">
                      <MessageSquare className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                      <span className="text-sm">Masterclass prep: "Scaling in Emerging Markets"</span>
                    </div>
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-purple-500 mr-3 mt-0.5" />
                      <span className="text-sm">Submit monthly impact summary</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recognition</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Award className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-sm font-medium">Advisor of Impact</div>
                    <div className="text-xs text-gray-600">March 2025</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Masterclass */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Masterclass 🎯</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Scaling in Emerging Markets</h3>
                      <p className="text-gray-600 mb-4">Share your expertise with 15+ African founders</p>
                      <div className="text-sm text-gray-500">March 25, 2025 • 4:00 PM GMT</div>
                    </div>
                    <Button>Prepare Session</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="founders" className="space-y-6">
            <div className="grid gap-6">
              {advisorData?.assignments?.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{assignment.founder?.email?.split('@')[0] || 'Founder'}</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium mb-2">Assignment Focus:</div>
                        <p className="text-sm text-gray-600">Strategic guidance and mentorship for scaling operations.</p>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-2">Progress:</div>
                        <p className="text-sm text-gray-600">{assignment.total_sessions || 0} sessions completed</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm">View Full Brief</Button>
                      <Button size="sm" variant="outline">Schedule Session</Button>
                    </div>
                  </CardContent>
                </Card>
              )) || (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-600">No founders assigned yet</p>
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
                    <div key={session.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
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
                <CardTitle>Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentSessions.length > 0 ? recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{session.title || 'Advisory Session'}</div>
                        <div className="text-xs text-gray-600">{new Date(session.scheduled_at).toLocaleDateString()} • {session.duration_minutes || 60} min • {session.founder_rating ? 'Excellent feedback' : 'Pending feedback'}</div>
                      </div>
                      <Button size="sm" variant="ghost">View Summary</Button>
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

          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Quote Wall
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testimonials && testimonials.length > 0 ? testimonials.slice(0, 2).map((testimonial) => (
                    <div key={testimonial.id} className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                      <p className="text-sm italic">"{testimonial.content}"</p>
                      <p className="text-xs text-gray-500 mt-2">- {testimonial.from_user?.email?.split('@')[0] || 'Founder'}</p>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-600">
                      No testimonials available yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Impact Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{avgRating ? avgRating.toFixed(1) : '4.9'}/5</div>
                    <div className="text-sm text-gray-600">Average Rating</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">100%</div>
                    <div className="text-sm text-gray-600">Would Recommend</div>
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

export default AdvisorDashboard;
