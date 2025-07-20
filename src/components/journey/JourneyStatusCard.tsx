
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  User,
  FileText,
  UserCheck,
  Users,
  Calendar
} from 'lucide-react';
import { useUserJourneyFlow, useCompleteJourneyStep } from '@/hooks/useUserJourneyFlow';

const getStepIcon = (stepId: string) => {
  switch (stepId) {
    case 'authentication': return User;
    case 'application': return FileText;
    case 'approval': return UserCheck;
    case 'profile': return User;
    case 'assignment': return Users;
    case 'first_session': return Calendar;
    default: return Clock;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'text-green-600 bg-green-100';
    case 'in_progress': return 'text-blue-600 bg-blue-100';
    case 'blocked': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const JourneyStatusCard: React.FC = () => {
  const { data: journey, isLoading } = useUserJourneyFlow();
  const completeStep = useCompleteJourneyStep();

  if (isLoading || !journey) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleStepAction = (stepId: string) => {
    completeStep.mutate({ stepId });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Journey Progress</span>
          <Badge variant="outline" className="text-sm">
            {Math.round(journey.overallProgress)}% Complete
          </Badge>
        </CardTitle>
        <Progress 
          value={journey.overallProgress} 
          className="w-full h-2"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {journey.steps.map((step, index) => {
          const Icon = getStepIcon(step.id);
          const isCurrentStep = journey.currentStep === step.id;
          
          return (
            <div
              key={step.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                isCurrentStep ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.status === 'completed' ? 'bg-green-100' :
                  step.status === 'blocked' ? 'bg-red-100' :
                  isCurrentStep ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : step.status === 'blocked' ? (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <Icon className={`w-4 h-4 ${
                      isCurrentStep ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  )}
                </div>
                
                <div>
                  <h4 className={`font-medium ${
                    isCurrentStep ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {step.name}
                  </h4>
                  {step.blockedReason && (
                    <p className="text-sm text-red-600">{step.blockedReason}</p>
                  )}
                  {step.completedAt && (
                    <p className="text-xs text-gray-500">
                      Completed {new Date(step.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusColor(step.status)}`}
                >
                  {step.status.replace('_', ' ')}
                </Badge>
                
                {isCurrentStep && step.status === 'pending' && (
                  <Button 
                    size="sm"
                    onClick={() => handleStepAction(step.id)}
                    disabled={completeStep.isPending}
                  >
                    Continue
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        
        {journey.nextStepAction && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Next Step:</strong> {journey.nextStepAction}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
