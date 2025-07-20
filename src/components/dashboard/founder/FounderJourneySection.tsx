
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StepTransition } from '@/components/ui/enhanced-transitions';
import { JourneyStatusIndicator } from '@/components/journey/JourneyStatusIndicator';
import { useEnhancedJourneyFlow } from '@/hooks/useEnhancedJourneyFlow';
import { useFounderData } from '@/hooks/useFounderData';
import { Target, CheckCircle, Clock } from 'lucide-react';

export const FounderJourneySection: React.FC = () => {
  const { data: journeyFlow } = useEnhancedJourneyFlow();
  const { data: founderData } = useFounderData();
  
  const activeAssignment = founderData?.assignments?.[0];
  const totalPlannedSessions = activeAssignment?.total_sessions || 6;
  const completedSessionCount = activeAssignment?.completed_sessions || 0;
  const journeyProgress = Math.round((completedSessionCount / totalPlannedSessions) * 100);

  // Calculate current month based on assignment
  const assignmentStartDate = activeAssignment?.assigned_at ? new Date(activeAssignment.assigned_at) : new Date();
  const currentDate = new Date();
  const monthsDiff = Math.max(1, Math.ceil((currentDate.getTime() - assignmentStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const currentMonth = Math.min(monthsDiff, 6);

  const milestones = [
    { month: 1, label: 'Setup', completed: currentMonth >= 1 },
    { month: 3, label: 'Mid-Point Review', completed: currentMonth >= 3 },
    { month: 6, label: 'Graduation', completed: currentMonth >= 6 }
  ];

  return (
    <StepTransition isActive={true} isCompleted={false}>
      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Target className="w-6 h-6 text-blue-600" />
            Your 6-Month Journey
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="outline">Month {currentMonth} of 6</Badge>
            {journeyFlow && (
              <Badge variant="secondary">
                {journeyFlow.healthScore}% Health Score
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          <div className="space-y-6">
            {/* Journey Status Indicator */}
            <JourneyStatusIndicator />
            
            {/* Progress Bar */}
            <div className="relative">
              <div className="w-full h-4 bg-gray-200 rounded-full">
                <div 
                  className="h-4 bg-gray-900 rounded-full transition-all duration-1000"
                  style={{ width: `${journeyProgress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span>{completedSessionCount} of {totalPlannedSessions} sessions completed</span>
                <span>{journeyProgress}% complete</span>
              </div>
            </div>
            
            {/* Milestones */}
            <div className="grid grid-cols-3 gap-4">
              {milestones.map((milestone) => (
                <div key={milestone.month} className="text-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-2 ${
                    milestone.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {milestone.completed ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div className={`font-semibold text-sm ${milestone.completed ? 'text-green-600' : 'text-gray-600'}`}>
                    Month {milestone.month}
                  </div>
                  <div className="text-xs text-gray-500">{milestone.label}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </StepTransition>
  );
};
