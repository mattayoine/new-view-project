import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Calendar as CalendarIcon, 
  Activity, 
  Download, 
  FileText,
  Target,
  Clock,
  Award,
  UserCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  userGrowth: Array<{ month: string; founders: number; advisors: number; total: number }>;
  sessionMetrics: Array<{ month: string; scheduled: number; completed: number; cancelled: number }>;
  matchingSuccess: Array<{ score_range: string; count: number; success_rate: number }>;
  userEngagement: Array<{ name: string; value: number; color: string }>;
  performanceMetrics: {
    avgSessionRating: number;
    completionRate: number;
    matchingAccuracy: number;
    userSatisfaction: number;
  };
}

export const AnalyticsReporting: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '6m' | '1y'>('30d');
  const [reportType, setReportType] = useState<'overview' | 'users' | 'sessions' | 'matching'>('overview');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '6m':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch user growth data
      const { data: userGrowthData } = await supabase
        .from('users')
        .select('created_at, role')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Fetch session metrics
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('created_at, status, advisor_rating, founder_rating')
        .gte('created_at', startDate.toISOString());

      // Fetch matching data
      const { data: matchingData } = await supabase
        .from('matching_criteria_scores')
        .select('overall_score, assignment_id')
        .gte('calculated_at', startDate.toISOString());

      // Fetch assignment success data
      const { data: assignmentData } = await supabase
        .from('advisor_founder_assignments')
        .select('created_at, status, avg_rating, total_sessions')
        .gte('created_at', startDate.toISOString());

      // Process data for charts
      const processedData = processAnalyticsData(
        userGrowthData || [],
        sessionData || [],
        matchingData || [],
        assignmentData || []
      );

      setData(processedData);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (
    users: any[],
    sessions: any[],
    matching: any[],
    assignments: any[]
  ): AnalyticsData => {
    // Process user growth by month
    const userGrowthByMonth = processUserGrowth(users);
    
    // Process session metrics by month
    const sessionMetricsByMonth = processSessionMetrics(sessions);
    
    // Process matching success rates
    const matchingSuccess = processMatchingSuccess(matching, assignments);
    
    // Process user engagement
    const userEngagement = processUserEngagement(sessions, assignments);
    
    // Calculate performance metrics
    const performanceMetrics = calculatePerformanceMetrics(sessions, assignments, matching);

    return {
      userGrowth: userGrowthByMonth,
      sessionMetrics: sessionMetricsByMonth,
      matchingSuccess,
      userEngagement,
      performanceMetrics
    };
  };

  const processUserGrowth = (users: any[]) => {
    const monthlyData: Record<string, { founders: number; advisors: number; total: number }> = {};
    
    users.forEach(user => {
      const month = new Date(user.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!monthlyData[month]) {
        monthlyData[month] = { founders: 0, advisors: 0, total: 0 };
      }
      
      monthlyData[month].total++;
      if (user.role === 'founder') monthlyData[month].founders++;
      if (user.role === 'advisor') monthlyData[month].advisors++;
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data
    }));
  };

  const processSessionMetrics = (sessions: any[]) => {
    const monthlyData: Record<string, { scheduled: number; completed: number; cancelled: number }> = {};
    
    sessions.forEach(session => {
      const month = new Date(session.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!monthlyData[month]) {
        monthlyData[month] = { scheduled: 0, completed: 0, cancelled: 0 };
      }
      
      if (session.status === 'scheduled') monthlyData[month].scheduled++;
      if (session.status === 'completed') monthlyData[month].completed++;
      if (session.status === 'cancelled') monthlyData[month].cancelled++;
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data
    }));
  };

  const processMatchingSuccess = (matching: any[], assignments: any[]) => {
    const scoreRanges = [
      { range: '90-100', min: 90, max: 100 },
      { range: '80-89', min: 80, max: 89 },
      { range: '70-79', min: 70, max: 79 },
      { range: '60-69', min: 60, max: 69 },
      { range: '0-59', min: 0, max: 59 }
    ];

    return scoreRanges.map(({ range, min, max }) => {
      const matchesInRange = matching.filter(m => 
        m.overall_score >= min && m.overall_score <= max
      );
      
      const successfulAssignments = assignments.filter(a => 
        matchesInRange.some(m => m.assignment_id === a.id) &&
        a.avg_rating >= 4 && a.total_sessions >= 3
      );
      
      const successRate = matchesInRange.length > 0 
        ? (successfulAssignments.length / matchesInRange.length) * 100 
        : 0;

      return {
        score_range: range,
        count: matchesInRange.length,
        success_rate: Math.round(successRate)
      };
    });
  };

  const processUserEngagement = (sessions: any[], assignments: any[]) => {
    const activeUsers = new Set(sessions.map(s => s.assignment_id)).size;
    const totalAssignments = assignments.length;
    const inactiveUsers = totalAssignments - activeUsers;
    
    return [
      { name: 'Active Users', value: activeUsers, color: '#10B981' },
      { name: 'Inactive Users', value: inactiveUsers, color: '#EF4444' }
    ];
  };

  const calculatePerformanceMetrics = (sessions: any[], assignments: any[], matching: any[]) => {
    // Average session rating
    const ratedSessions = sessions.filter(s => s.advisor_rating || s.founder_rating);
    const avgSessionRating = ratedSessions.length > 0
      ? ratedSessions.reduce((sum, s) => {
          const rating = ((s.advisor_rating || 0) + (s.founder_rating || 0)) / 2;
          return sum + rating;
        }, 0) / ratedSessions.length
      : 0;

    // Completion rate
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    // Matching accuracy (assignments with good ratings)
    const successfulAssignments = assignments.filter(a => a.avg_rating >= 4).length;
    const matchingAccuracy = assignments.length > 0 
      ? (successfulAssignments / assignments.length) * 100 
      : 0;

    // User satisfaction (based on ratings >= 4)
    const satisfiedSessions = ratedSessions.filter(s => {
      const avgRating = ((s.advisor_rating || 0) + (s.founder_rating || 0)) / 2;
      return avgRating >= 4;
    }).length;
    const userSatisfaction = ratedSessions.length > 0 
      ? (satisfiedSessions / ratedSessions.length) * 100 
      : 0;

    return {
      avgSessionRating: Math.round(avgSessionRating * 10) / 10,
      completionRate: Math.round(completionRate),
      matchingAccuracy: Math.round(matchingAccuracy),
      userSatisfaction: Math.round(userSatisfaction)
    };
  };

  const exportReport = async () => {
    try {
      const reportData = {
        generated_at: new Date().toISOString(),
        time_range: timeRange,
        data
      };
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Report Exported',
        description: 'Analytics report has been downloaded'
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Could not export report',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart className="w-5 h-5 mr-2" />
              Analytics & Reporting
            </div>
            <div className="flex items-center space-x-2">
              <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="6m">Last 6 months</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={exportReport} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Session Rating</p>
                  <p className="text-2xl font-bold">{data.performanceMetrics.avgSessionRating}/5</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold">{data.performanceMetrics.completionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UserCheck className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Matching Accuracy</p>
                  <p className="text-2xl font-bold">{data.performanceMetrics.matchingAccuracy}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">User Satisfaction</p>
                  <p className="text-2xl font-bold">{data.performanceMetrics.userSatisfaction}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Tabs value={reportType} onValueChange={(v: any) => setReportType(v)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Growth</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="matching">Matching</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data?.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="founders" stroke="#F59E0B" name="Founders" />
                    <Line type="monotone" dataKey="advisors" stroke="#3B82F6" name="Advisors" />
                    <Line type="monotone" dataKey="total" stroke="#10B981" name="Total" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data?.userEngagement}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data?.userEngagement.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Registration Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data?.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="founders" fill="#F59E0B" name="Founders" />
                  <Bar dataKey="advisors" fill="#3B82F6" name="Advisors" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Session Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data?.sessionMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="scheduled" fill="#3B82F6" name="Scheduled" />
                  <Bar dataKey="completed" fill="#10B981" name="Completed" />
                  <Bar dataKey="cancelled" fill="#EF4444" name="Cancelled" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matching">
          <Card>
            <CardHeader>
              <CardTitle>Matching Success by Score Range</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data?.matchingSuccess}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="score_range" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3B82F6" name="Total Matches" />
                  <Bar dataKey="success_rate" fill="#10B981" name="Success Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};