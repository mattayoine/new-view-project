
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Users, Award, MessageSquare, FileText, Star } from "lucide-react";

const AdvisorDashboard = () => {
  const [currentMonth] = useState(3); // Simulating Month 3

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
                <div className="text-2xl font-bold text-green-600">8</div>
                <div className="text-sm text-gray-600">Sessions Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">3</div>
                <div className="text-sm text-gray-600">Founders Mentored</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">95%</div>
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
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                      <span className="text-sm">Next session with Amara (AgriTech) - Tomorrow 2:00 PM</span>
                    </div>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Amara Okafor - GreenTech Solutions</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Startup Focus:</div>
                      <p className="text-sm text-gray-600">Solar panel distribution across West Africa. $250k ARR, seeking international expansion.</p>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">Key Challenge:</div>
                      <p className="text-sm text-gray-600">Scaling operations while maintaining quality control across multiple countries.</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm">View Full Brief</Button>
                    <Button size="sm" variant="outline">Schedule Session</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>David Kwame - EduPlatform</span>
                    <Badge className="bg-blue-100 text-blue-800">Session Pending</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Startup Focus:</div>
                      <p className="text-sm text-gray-600">Online learning platform for African universities. 10k+ active students.</p>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">Key Challenge:</div>
                      <p className="text-sm text-gray-600">Monetization strategy and premium tier pricing for emerging markets.</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm">View Full Brief</Button>
                    <Button size="sm" variant="outline">Schedule Session</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium">Operations Strategy with Amara</div>
                      <div className="text-sm text-gray-600">March 16, 2025 • 2:00 PM GMT</div>
                    </div>
                    <Button size="sm">Join Call</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-medium">Pricing Workshop with David</div>
                      <div className="text-sm text-gray-600">March 20, 2025 • 3:00 PM GMT</div>
                    </div>
                    <Button size="sm" variant="outline">Reschedule</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">Market Entry Strategy - Amara</div>
                      <div className="text-xs text-gray-600">Mar 2 • 60 min • Excellent feedback</div>
                    </div>
                    <Button size="sm" variant="ghost">View Summary</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">Product Roadmap Review - David</div>
                      <div className="text-xs text-gray-600">Feb 28 • 45 min • Very helpful</div>
                    </div>
                    <Button size="sm" variant="ghost">View Summary</Button>
                  </div>
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
                  <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                    <p className="text-sm italic">"The pricing framework completely changed how we think about our market. We increased our premium tier conversion by 40%!"</p>
                    <p className="text-xs text-gray-500 mt-2">- Founder, EdTech Platform</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                    <p className="text-sm italic">"Having someone who's actually scaled in emerging markets was invaluable. The operational insights saved us months of trial and error."</p>
                    <p className="text-xs text-gray-500 mt-2">- Founder, AgriTech Startup</p>
                  </div>
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
                    <div className="text-2xl font-bold text-blue-600">4.9/5</div>
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
