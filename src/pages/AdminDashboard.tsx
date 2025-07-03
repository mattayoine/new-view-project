
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  TrendingUp, 
  Clock,
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  Home,
  UserCheck,
  BookOpen
} from 'lucide-react';
import { useAdminStats } from '@/hooks/useAdminData';
import { usePendingApplicationsCount } from '@/hooks/useAdminApplications';
import FlightControl from '@/components/admin/FlightControl';
import SessionTracker from '@/components/admin/SessionTracker';
import SessionAnalyticsDashboard from '@/components/admin/SessionAnalyticsDashboard';
import SessionQualityMonitor from '@/components/admin/SessionQualityMonitor';
import SmartSchedulingDashboard from '@/components/admin/SmartSchedulingDashboard';
import SessionPreparationHub from '@/components/admin/SessionPreparationHub';
import AutomatedReminderSystem from '@/components/admin/AutomatedReminderSystem';
import AdvisorDirectory from '@/components/admin/AdvisorDirectory';
import FounderDirectory from '@/components/admin/FounderDirectory';
import CaseStudyLibrary from '@/components/admin/CaseStudyLibrary';
import EnhancedApplicationReview from '@/components/admin/EnhancedApplicationReview';
import MatchingDashboard from '@/components/admin/MatchingDashboard';
import SessionOverviewDashboard from '@/components/admin/SessionOverviewDashboard';
import InterventionTools from '@/components/admin/InterventionTools';

const AdminDashboard = () => {
  const { data: stats, isLoading } = useAdminStats();
  const { data: pendingCount = 0 } = usePendingApplicationsCount();

  const quickActions = [
    { 
      icon: FileText, 
      label: 'Post-Session Reflection', 
      color: 'bg-blue-50 text-blue-600 border-blue-200' 
    },
    { 
      icon: UserCheck, 
      label: 'Advisor Feedback Form', 
      color: 'bg-green-50 text-green-600 border-green-200' 
    },
    { 
      icon: Calendar, 
      label: 'Master Session Calendar', 
      color: 'bg-purple-50 text-purple-600 border-purple-200' 
    },
    { 
      icon: BookOpen, 
      label: 'Masterclass Schedule', 
      color: 'bg-orange-50 text-orange-600 border-orange-200' 
    }
  ];

  const currentWeekTodos = [
    { task: "Review 3 new founder applications", priority: "high", due: "Today" },
    { task: "Schedule Q2 advisor onboarding", priority: "medium", due: "Wednesday" },
    { task: "Follow up on Session #47 outcomes", priority: "high", due: "Tomorrow" },
    { task: "Prepare monthly KPI report", priority: "low", due: "Friday" }
  ];

  const timeline = [
    { month: "Month 1", phase: "Onboarding & Matching", status: "completed", founders: 15, advisors: 10 },
    { month: "Month 2", phase: "First Advisory Sessions", status: "active", founders: stats?.activeFounders || 28, advisors: stats?.activeAdvisors || 19 },
    { month: "Month 3", phase: "Masterclasses Begin", status: "upcoming", founders: 25, advisors: 18 },
    { month: "Month 4", phase: "Progress Reviews", status: "planned", founders: 20, advisors: 15 },
    { month: "Month 5", phase: "Case Study Collection", status: "planned", founders: 18, advisors: 12 },
    { month: "Month 6", phase: "Final Reports & Graduation", status: "planned", founders: 15, advisors: 10 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-3 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">CoPilot Admin Command Center</h1>
            <p className="text-xs text-gray-600">Real-time platform oversight and management</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-green-600">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              System Online
            </div>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
              <Settings className="w-3 h-3 mr-1" />
              Settings
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 p-1 mb-4">
          <div className="flex gap-1">
            <Button variant="secondary" size="sm" className="h-7 px-3 text-xs bg-gray-100">
              <Home className="w-3 h-3 mr-1" />
              Flight Control
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-3 text-xs">
              <Users className="w-3 h-3 mr-1" />
              Founders
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-3 text-xs">
              <UserCheck className="w-3 h-3 mr-1" />
              Advisors
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-3 text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              Sessions
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-3 text-xs">
              <FileText className="w-3 h-3 mr-1" />
              Case Studies
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-9 h-8 bg-white border">
            <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-gray-100">Overview</TabsTrigger>
            <TabsTrigger value="applications" className="text-xs relative data-[state=active]:bg-gray-100">
              Applications
              {pendingCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs bg-red-500">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="matching" className="text-xs data-[state=active]:bg-gray-100">Matching</TabsTrigger>
            <TabsTrigger value="sessions" className="text-xs data-[state=active]:bg-gray-100">Sessions</TabsTrigger>
            <TabsTrigger value="monitor" className="text-xs data-[state=active]:bg-gray-100">Monitor</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs data-[state=active]:bg-gray-100">Analytics</TabsTrigger>
            <TabsTrigger value="advisors" className="text-xs data-[state=active]:bg-gray-100">Advisors</TabsTrigger>
            <TabsTrigger value="founders" className="text-xs data-[state=active]:bg-gray-100">Founders</TabsTrigger>
            <TabsTrigger value="resources" className="text-xs data-[state=active]:bg-gray-100">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-3">
              <Card className="border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Active Founders</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">
                          {isLoading ? '-' : stats?.activeFounders || 28}
                        </span>
                        <div className="flex items-center text-xs text-green-600">
                          <ArrowUp className="w-3 h-3" />
                          <span>+3 from last month</span>
                        </div>
                      </div>
                    </div>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Active Advisors</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">
                          {isLoading ? '-' : stats?.activeAdvisors || 19}
                        </span>
                        <div className="flex items-center text-xs text-green-600">
                          <ArrowUp className="w-3 h-3" />
                          <span>+1 from last month</span>
                        </div>
                      </div>
                    </div>
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Sessions This Month</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">
                          {isLoading ? '-' : stats?.sessionsThisMonth || 45}
                        </span>
                        <div className="flex items-center text-xs text-green-600">
                          <ArrowUp className="w-3 h-3" />
                          <span>+12 from last month</span>
                        </div>
                      </div>
                    </div>
                    <Calendar className="w-4 h-4 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Case Studies Ready</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">
                          {isLoading ? '-' : stats?.caseStudiesReady || 8}
                        </span>
                        <div className="flex items-center text-xs text-green-600">
                          <ArrowUp className="w-3 h-3" />
                          <span>+2 from last month</span>
                        </div>
                      </div>
                    </div>
                    <FileText className="w-4 h-4 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* What's Live Now */}
            <Card className="border-gray-200">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <CardTitle className="text-sm">What's Live Now</CardTitle>
                </div>
                <p className="text-xs text-gray-600">Quick access to active processes and tools</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-700">Active Forms</h4>
                    <div className="space-y-1">
                      {quickActions.slice(0, 2).map((action, index) => (
                        <Button 
                          key={index}
                          variant="outline" 
                          size="sm" 
                          className={`w-full justify-start h-7 text-xs ${action.color} border`}
                        >
                          <action.icon className="w-3 h-3 mr-1" />
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-700">Calendars</h4>
                    <div className="space-y-1">
                      {quickActions.slice(2, 4).map((action, index) => (
                        <Button 
                          key={index}
                          variant="outline" 
                          size="sm" 
                          className={`w-full justify-start h-7 text-xs ${action.color} border`}
                        >
                          <action.icon className="w-3 h-3 mr-1" />
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-700">Tools</h4>
                    <div className="space-y-1">
                      <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs border-gray-200">
                        📊 Airtable Database
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs border-gray-200">
                        💬 Zoom Admin Panel
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-700">Quick Actions</h4>
                    <div className="space-y-1">
                      <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs border-gray-200">
                        <Plus className="w-3 h-3 mr-1" />
                        Add Advisor
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs border-gray-200">
                        <Search className="w-3 h-3 mr-1" />
                        Export Data
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 6-Month Timeline */}
            <Card className="border-gray-200">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <CardTitle className="text-sm">6-Month Flight Timeline</CardTitle>
                </div>
                <p className="text-xs text-gray-600">Track progress across the entire program lifecycle</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {timeline.map((period, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={period.status === 'completed' ? 'default' : 
                                 period.status === 'active' ? 'secondary' : 'outline'}
                          className="text-xs px-2 py-0.5"
                        >
                          {period.status}
                        </Badge>
                        <div>
                          <h4 className="text-xs font-medium">{period.month}</h4>
                          <p className="text-xs text-gray-600">{period.phase}</p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-600">
                        <div>{period.founders} Founders</div>
                        <div>{period.advisors} Advisors</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* This Week's To-Dos */}
            <Card className="border-gray-200">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <CardTitle className="text-sm">This Week's To-Dos</CardTitle>
                </div>
                <p className="text-xs text-gray-600">Critical tasks requiring attention</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {currentWeekTodos.map((todo, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={todo.priority === 'high' ? 'destructive' : 
                                 todo.priority === 'medium' ? 'secondary' : 'outline'}
                          className="text-xs px-2 py-0.5"
                        >
                          {todo.priority}
                        </Badge>
                        <span className="text-xs font-medium">{todo.task}</span>
                      </div>
                      <span className="text-xs text-gray-600">Due: {todo.due}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <EnhancedApplicationReview />
          </TabsContent>

          <TabsContent value="matching">
            <MatchingDashboard />
          </TabsContent>

          <TabsContent value="sessions">
            <div className="space-y-4">
              <Tabs defaultValue="tracker" className="space-y-3">
                <TabsList className="grid w-full grid-cols-6 h-8 bg-white border">
                  <TabsTrigger value="tracker" className="text-xs data-[state=active]:bg-gray-100">Tracker</TabsTrigger>
                  <TabsTrigger value="analytics" className="text-xs data-[state=active]:bg-gray-100">Analytics</TabsTrigger>
                  <TabsTrigger value="quality" className="text-xs data-[state=active]:bg-gray-100">Quality</TabsTrigger>
                  <TabsTrigger value="scheduling" className="text-xs data-[state=active]:bg-gray-100">Smart Scheduling</TabsTrigger>
                  <TabsTrigger value="preparation" className="text-xs data-[state=active]:bg-gray-100">Preparation</TabsTrigger>
                  <TabsTrigger value="reminders" className="text-xs data-[state=active]:bg-gray-100">Reminders</TabsTrigger>
                </TabsList>
                
                <TabsContent value="tracker">
                  <SessionTracker />
                </TabsContent>
                
                <TabsContent value="analytics">
                  <SessionAnalyticsDashboard />
                </TabsContent>
                
                <TabsContent value="quality">
                  <SessionQualityMonitor />
                </TabsContent>

                <TabsContent value="scheduling">
                  <SmartSchedulingDashboard />
                </TabsContent>

                <TabsContent value="preparation">
                  <SessionPreparationHub sessionId="sample-session-id" />
                </TabsContent>

                <TabsContent value="reminders">
                  <AutomatedReminderSystem />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="monitor">
            <SessionOverviewDashboard />
          </TabsContent>

          <TabsContent value="analytics">
            <SessionAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="advisors">
            <AdvisorDirectory />
          </TabsContent>

          <TabsContent value="founders">
            <FounderDirectory />
          </TabsContent>

          <TabsContent value="resources">
            <CaseStudyLibrary />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
