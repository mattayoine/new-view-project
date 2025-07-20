
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StepTransition } from '@/components/ui/enhanced-transitions';
import { useFounderSessionStats } from '@/hooks/useFounderSessionExperience';
import { useFounderData } from '@/hooks/useFounderData';
import { Calendar, Target, Users, TrendingUp } from 'lucide-react';

export const FounderMetricsCards: React.FC = () => {
  const { data: sessionStats } = useFounderSessionStats();
  const { data: founderData } = useFounderData();

  const metrics = [
    {
      title: 'Sessions Completed',
      value: sessionStats?.completedSessions || 0,
      icon: Calendar,
      color: 'text-blue-600'
    },
    {
      title: 'Active Goals',
      value: founderData?.goals?.filter(g => g.status === 'active').length || 0,
      icon: Target,
      color: 'text-green-600'
    },
    {
      title: 'Advisors Assigned',
      value: founderData?.assignments?.length || 0,
      icon: Users,
      color: 'text-purple-600'
    },
    {
      title: 'Progress Score',
      value: `${Math.round(sessionStats?.goalProgress || 0)}%`,
      icon: TrendingUp,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <StepTransition key={metric.title} isActive={false} isCompleted={false} delay={index * 100}>
          <Card className="shadow-sm">
            <CardContent className="p-6 text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                metric.color.includes('blue') ? 'bg-blue-100' :
                metric.color.includes('green') ? 'bg-green-100' :
                metric.color.includes('purple') ? 'bg-purple-100' : 'bg-orange-100'
              }`}>
                <metric.icon className={`w-6 h-6 ${metric.color}`} />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {metric.value}
              </div>
              <div className="text-sm text-gray-600">{metric.title}</div>
            </CardContent>
          </Card>
        </StepTransition>
      ))}
    </div>
  );
};
