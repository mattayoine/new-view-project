
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, Star, Users, 
  Calendar, Target, AlertCircle, CheckCircle,
  BarChart3, Award, Lightbulb 
} from 'lucide-react';
import { AdvisorPerformanceMetrics } from '@/hooks/useAdvisorSessionHub';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AdvisorPerformanceInsightsProps {
  metrics: AdvisorPerformanceMetrics;
}

const AdvisorPerformanceInsights: React.FC<AdvisorPerformanceInsightsProps> = ({ metrics }) => {
  const satisfactionTrend = metrics.avgFounderSatisfaction >= 4.0 ? 'positive' : 
                           metrics.avgFounderSatisfaction >= 3.5 ? 'neutral' : 'negative';

  const completionRate = metrics.completedSessions / (metrics.completedSessions + metrics.activeSessions) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Insights</h2>
          <p className="text-muted-foreground">
            Your mentoring performance and improvement areas
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Award className="w-3 h-3" />
          Performance Score: {Math.round(metrics.avgFounderSatisfaction * 20)}%
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Founders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalFounders}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1" />
              Active mentoring relationships
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgSessionRating.toFixed(1)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
              Average session rating
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <CheckCircle className="w-3 h-3 mr-1" />
              Sessions completed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgFounderSatisfaction.toFixed(1)}</div>
            <div className="flex items-center text-xs">
              {satisfactionTrend === 'positive' ? (
                <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
              ) : satisfactionTrend === 'negative' ? (
                <TrendingDown className="w-3 h-3 mr-1 text-red-600" />
              ) : (
                <div className="w-3 h-3 mr-1" />
              )}
              <span className={
                satisfactionTrend === 'positive' ? 'text-green-600' :
                satisfactionTrend === 'negative' ? 'text-red-600' :
                'text-muted-foreground'
              }>
                Founder satisfaction
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      {metrics.monthlyTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Monthly Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#8884d8" 
                  name="Sessions"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="satisfaction" 
                  stroke="#82ca9d" 
                  name="Satisfaction"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Strengths and Improvement Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Your Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.strengths.map((strength, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{strength}</span>
                </div>
              ))}
              {metrics.strengths.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Complete more sessions to see your strengths
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.improvementAreas.map((area, index) => (
                <div key={index} className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm">{area}</span>
                </div>
              ))}
              {metrics.improvementAreas.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No improvement areas identified
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.avgSessionRating < 4.0 && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Improve Session Quality:</strong> Consider asking for more specific feedback 
                  and focus on actionable outcomes during sessions.
                </p>
              </div>
            )}
            
            {completionRate < 80 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Increase Completion Rate:</strong> Follow up more consistently with founders 
                  and ensure sessions have clear next steps.
                </p>
              </div>
            )}
            
            {metrics.avgFounderSatisfaction < 4.0 && (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Boost Satisfaction:</strong> Focus on understanding founder needs better 
                  and providing more personalized guidance.
                </p>
              </div>
            )}
            
            {metrics.avgSessionRating >= 4.5 && metrics.avgFounderSatisfaction >= 4.5 && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Excellent Performance:</strong> You're doing great! Consider mentoring 
                  additional founders or sharing your expertise with other advisors.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvisorPerformanceInsights;
