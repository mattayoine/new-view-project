
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertCircle, ArrowRight, Wifi, WifiOff } from 'lucide-react';
import { useEnhancedJourneyFlow } from '@/hooks/useEnhancedJourneyFlow';
import { useOfflineSupport } from '@/hooks/useOfflineSupport';
import { EnhancedLoadingState } from '@/components/ui/enhanced-loading';
import { format } from 'date-fns';

export const EnhancedJourneyStatusCard: React.FC = () => {
  const { data: journeyFlow, isLoading, error, completeStep, isCompletingStep } = useEnhancedJourneyFlow();
  const { isOnline, queuedOperationsCount } = useOfflineSupport();

  if (isLoading) {
    return <EnhancedLoadingState type="cards" count={1} message="Loading journey status..." />;
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Unable to load journey status</h3>
          <p className="text-muted-foreground">We're having trouble connecting. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  if (!journeyFlow) return null;

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'blocked':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            Journey Progress
            {!isOnline && (
              <Badge variant="outline" className="ml-2 text-orange-600 border-orange-200">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
            {queuedOperationsCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {queuedOperationsCount} pending
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Health Score</p>
              <p className={`text-lg font-semibold ${getHealthScoreColor(journeyFlow.healthScore)}`}>
                {journeyFlow.healthScore}%
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Overall Progress</p>
              <p className="text-lg font-semibold">{journeyFlow.overallProgress}%</p>
            </div>
          </div>
        </div>
        
        <Progress value={journeyFlow.overallProgress} className="mt-4" />
        
        {journeyFlow.estimatedCompletion && (
          <p className="text-sm text-muted-foreground mt-2">
            Estimated completion: {journeyFlow.estimatedCompletion}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {journeyFlow.steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
              step.status === 'pending' && journeyFlow.currentStep === step.id
                ? 'border-blue-200 bg-blue-50'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              {getStepIcon(step.status)}
              
              <div>
                <h4 className="font-medium">{step.name}</h4>
                {step.nextAction && (
                  <p className="text-sm text-muted-foreground">{step.nextAction}</p>
                )}
                {step.completedAt && (
                  <p className="text-xs text-muted-foreground">
                    Completed {format(new Date(step.completedAt), 'MMM dd, yyyy')}
                  </p>
                )}
                {step.blockedReason && (
                  <p className="text-sm text-red-600">{step.blockedReason}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Badge className={getStatusColor(step.status)}>
                {step.status.replace('_', ' ')}
              </Badge>
              
              <div className="text-right min-w-[60px]">
                <p className="text-sm font-medium">{step.progress}%</p>
                <Progress value={step.progress} className="w-16 h-2" />
              </div>

              {step.canProceed && step.status === 'pending' && (
                <Button
                  size="sm"
                  onClick={() => completeStep({ stepId: step.id })}
                  disabled={isCompletingStep || !isOnline}
                  className="ml-2"
                >
                  {isCompletingStep ? (
                    'Processing...'
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}

        {journeyFlow.nextStepAction && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Next Step</h4>
            <p className="text-blue-800">{journeyFlow.nextStepAction}</p>
          </div>
        )}

        {journeyFlow.overallProgress === 100 && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <h4 className="font-medium text-green-900 mb-1">Journey Complete!</h4>
            <p className="text-green-800">You're all set up and ready to go.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
