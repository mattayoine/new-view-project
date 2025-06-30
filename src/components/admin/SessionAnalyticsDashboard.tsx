
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Calendar, Clock, Star, 
  Target, RefreshCw, AlertTriangle 
} from 'lucide-react';
import { useSessionAnalytics, useSessionQualityScores } from '@/hooks/useSessionAnalytics';
import { LoadingState } from '@/components/ui/loading-spinner';
import { format } from 'date-fns';

const SessionAnalyticsDashboard = () => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  
  const { 
    data: analyticsData, 
    isLoading: analyticsLoading, 
    refetch: refetchAnalytics 
  } = useSessionAnalytics(timeframe);
  
  const { 
    data: qualityScores, 
    isLoading: qualityLoading 
  } = useSessionQualityScores();

  if (analyticsLoading || qualityLoading) {
    return <LoadingState message="Loading session analytics..." />;
  }

  const { metrics, trends } = analyticsData || { metrics: null, trends: [] };

  const getMetricTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const qualityDistribution = qualityScores?.reduce((acc, score) => {
    const range = score.qualityScore >= 80 ? 'Excellent' :
                  score.qualityScore >= 60 ? 'Good' :
                  score.qualityScore >= 40 ? 'Average' :
                  score.qualityScore >= 20 ? 'Poor' : 'Critical';
    acc[range] = (acc[range] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const qualityChartData = Object.entries(qualityDistribution || {}).map(([name, value]) => ({
    name, value
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Session Analytics & Insights</h2>
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={(value: '7d' | '30d' | '90d') => setTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchAnalytics()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Sessions"
          value={metrics?.totalSessions || 0}
          icon={<Calendar className="w-4 h-4" />}
          trend={5}
          isPositive={true}
        />
        <MetricCard
          title="Completion Rate"
          value={`${metrics?.completionRate || 0}%`}
          icon={<Target className="w-4 h-4" />}
          trend={3}
          isPositive={true}
        />
        <MetricCard
          title="Average Rating"
          value={metrics?.avgRating || 0}
          icon={<Star className="w-4 h-4" />}
          trend={-2}
          isPositive={false}
        />
        <MetricCard
          title="Avg Duration"
          value={`${metrics?.avgDuration || 0}m`}
          icon={<Clock className="w-4 h-4" />}
          trend={8}
          isPositive={true}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Session Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM dd')} />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                />
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#8884d8" 
                  name="Total Sessions"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="completions" 
                  stroke="#82ca9d" 
                  name="Completed"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quality Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Session Quality Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={qualityChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {qualityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Quality Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Top Quality Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {qualityScores?.slice(0, 10).map((session) => (
              <div 
                key={session.sessionId} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{session.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(session.scheduledAt), 'MMM dd, yyyy • h:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Quality Score</div>
                    <Badge 
                      variant={session.qualityScore >= 80 ? 'default' : 
                               session.qualityScore >= 60 ? 'secondary' : 'destructive'}
                    >
                      {session.qualityScore}/100
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-muted-foreground">Duration</div>
                      <div>{session.durationScore}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">Rating</div>
                      <div>{session.ratingScore}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">Follow-up</div>
                      <div>{session.followupScore}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rating Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Rating & Duration Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM dd')} />
              <YAxis yAxisId="rating" orientation="left" domain={[0, 5]} />
              <YAxis yAxisId="duration" orientation="right" />
              <Tooltip 
                labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
              />
              <Bar 
                yAxisId="rating"
                dataKey="avgRating" 
                fill="#8884d8" 
                name="Avg Rating"
              />
              <Bar 
                yAxisId="duration"
                dataKey="avgDuration" 
                fill="#82ca9d" 
                name="Avg Duration (min)"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  isPositive?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend = 0,
  isPositive = true
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== 0 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="w-3 h-3 text-green-600" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-600" />
            )}
            <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(trend)}%
            </span>
            from last period
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionAnalyticsDashboard;
