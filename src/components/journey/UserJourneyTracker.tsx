import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  User, 
  FileText, 
  UserCheck, 
  Users, 
  Calendar 
} from 'lucide-react';
import { useUserJourneyStatus } from '@/hooks/useCompleteUserJourney';
import { useNavigate } from 'react-router-dom';

const UserJourneyTracker: React.FC = () => {
  const { data: journeyStatus, isLoading } = useUserJourneyStatus();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!journeyStatus) return null;

  const getStepIcon = (step: string, completed: boolean) => {
    const iconProps = { className: `w-5 h-5 ${completed ? 'text-green-600' : 'text-gray-400'}` };
    
    switch (step) {
      case 'authentication': return <User {...iconProps} />;
      case 'application': return <FileText {...iconProps} />;
      case 'approval': return <UserCheck {...iconProps} />;
      case 'profile': return <User {...iconProps} />;
      case 'assignment': return <Users {...iconProps} />;
      case 'first_session': return <Calendar {...iconProps} />;
      default: return <CheckCircle {...iconProps} />;
    }
  };

  const getStepTitle = (step: string) => {
    switch (step) {
      case 'authentication': return 'Account Created';
      case 'application': return 'Application Submitted';
      case 'approval': return 'Application Approved';
      case 'profile': return 'Profile Completed';
      case 'assignment': return 'Advisor/Founder Assigned';
      case 'first_session': return 'First Session Completed';
      default: return step.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const completedSteps = journeyStatus.steps.filter(s => s.completed).length;
  const totalSteps = journeyStatus.steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  const handleNextAction = () => {
    switch (journeyStatus.currentStep) {
      case 'application':
        navigate('/');
        break;
      case 'approval':
        // Stay on current page, show waiting message
        break;
      case 'profile':
        navigate('/onboarding');
        break;
      case 'assignment':
        // Stay on dashboard, show waiting message
        break;
      case 'first_session':
        navigate('/sessions');
        break;
      default:
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Tseer Journey</span>
          <Badge variant={journeyStatus.canProceed ? 'default' : 'secondary'}>
            {completedSteps}/{totalSteps} Complete
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {journeyStatus.steps.map((step, index) => (
            <div key={step.step} className="flex items-center gap-3 p-3 rounded-lg border">
              <div className={`flex-shrink-0 ${step.completed ? 'text-green-600' : 'text-gray-400'}`}>
                {step.completed ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  getStepIcon(step.step, step.completed)
                )}
              </div>
              
              <div className="flex-1">
                <h4 className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-600'}`}>
                  {getStepTitle(step.step)}
                </h4>
                {step.error && (
                  <p className="text-sm text-red-600 mt-1">{step.error}</p>
                )}
                {step.data && !step.error && (
                  <p className="text-sm text-gray-500 mt-1">
                    {step.step === 'application' && `Status: ${step.data.status}`}
                    {step.step === 'assignment' && step.data.id && 'Assignment active'}
                    {step.step === 'first_session' && `${step.data.sessionCount} sessions scheduled`}
                  </p>
                )}
              </div>

              {step.completed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : journeyStatus.currentStep === step.step ? (
                <Clock className="w-5 h-5 text-blue-600" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
              )}
            </div>
          ))}
        </div>

        {/* Next Action */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            {journeyStatus.canProceed ? (
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-1">Next Step</h4>
              <p className="text-blue-800 text-sm mb-3">{journeyStatus.nextAction}</p>
              
              {journeyStatus.canProceed && journeyStatus.currentStep !== 'active_program' && (
                <Button 
                  onClick={handleNextAction}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continue
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserJourneyTracker;