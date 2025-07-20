
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StepTransition } from '@/components/ui/enhanced-transitions';
import { useAdvisorData } from '@/hooks/useAdvisorData';
import { Target, Users, Star, TrendingUp, Award } from 'lucide-react';

export const AdvisorImpactMetrics: React.FC = () => {
  const { data } = useAdvisorData();
  
  const { advisor, assignments } = data || {};
  const allSessions = assignments?.flatMap(a => a.sessions || []) || [];
  const completedSessions = allSessions.filter(session => session.status === 'completed');
  
  // Calculate metrics
  const totalFoundersCount = assignments?.length || 0;
  const completedSessionCount = completedSessions.length;
  const avgRating = completedSessions.length > 0 
    ? completedSessions.reduce((sum, session) => sum + (session.founder_rating || 0), 0) / completedSessions.length 
    : 0;
  const satisfactionScore = Math.round(avgRating * 20);

  // Calculate current quarter
  const currentMonth = new Date().getMonth() + 1;
  const quarter = Math.ceil(currentMonth / 3);
  const monthInQuarter = ((currentMonth - 1) % 3) + 1;

  const metrics = [
    {
      title: 'Sessions Completed',
      value: completedSessionCount,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Founders Mentored', 
      value: totalFoundersCount,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Satisfaction Score',
      value: `${satisfactionScore}%`,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Impact Rating',
      value: avgRating.toFixed(1),
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <StepTransition isActive={true} isCompleted={false}>
      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <TrendingUp className="w-6 h-6 text-green-600" />
            Your Impact This Quarter
          </CardTitle>
          <p className="text-lg text-gray-600">
            Q{quarter} • Month {monthInQuarter} • Making Real Difference
          </p>
        </CardHeader>
        <CardContent className="pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <StepTransition key={metric.title} isActive={false} isCompleted={false} delay={index * 150}>
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${metric.bgColor}`}>
                    <metric.icon className={`w-8 h-8 ${metric.color}`} />
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {metric.value}
                  </div>
                  <div className="text-sm text-gray-600">{metric.title}</div>
                </div>
              </StepTransition>
            ))}
          </div>
        </CardContent>
      </Card>
    </StepTransition>
  );
};
