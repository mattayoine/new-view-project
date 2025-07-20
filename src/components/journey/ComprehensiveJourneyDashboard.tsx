
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EnhancedJourneyStatusCard } from './EnhancedJourneyStatusCard';
import { RealTimeDashboard } from '@/components/realtime/RealTimeDashboard';
import { StepTransition } from '@/components/ui/enhanced-transitions';
import { useAuth } from '@/hooks/useAuth';
import { useEnhancedJourneyFlow } from '@/hooks/useEnhancedJourneyFlow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  UserCheck, 
  Settings, 
  Bell, 
  Calendar, 
  Users, 
  FileText, 
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export const ComprehensiveJourneyDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { data: journeyFlow } = useEnhancedJourneyFlow();
  const navigate = useNavigate();

  if (!userProfile) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please log in to view your journey.</p>
        </CardContent>
      </Card>
    );
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'profile':
        navigate('/onboarding');
        break;
      case 'session':
        if (userProfile.role === 'founder') {
          navigate('/founder-session-hub');
        } else if (userProfile.role === 'advisor') {
          navigate('/advisor-session-hub');
        }
        break;
      case 'notifications':
        // Toggle notification preferences or show notification center
        break;
      case 'application':
        if (userProfile.role === 'founder') {
          navigate('/apply-founder');
        } else if (userProfile.role === 'advisor') {
          navigate('/apply-advisor');
        }
        break;
      default:
        break;
    }
  };

  const getNextAction = () => {
    if (!journeyFlow) return null;

    const pendingStep = journeyFlow.steps.find(step => step.status === 'pending');
    if (!pendingStep) return null;

    switch (pendingStep.id) {
      case 'application':
        return {
          title: 'Complete Application',
          description: 'Submit your application to continue',
          action: 'application',
          icon: FileText,
          priority: 'high'
        };
      case 'profile':
        return {
          title: 'Complete Profile',
          description: 'Finish setting up your profile',
          action: 'profile',
          icon: UserCheck,
          priority: 'high'
        };
      case 'first_session':
        return {
          title: 'Schedule First Session',
          description: 'Book your first advisory session',
          action: 'session',
          icon: Calendar,
          priority: 'medium'
        };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <StepTransition isActive={true} isCompleted={false}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your Journey Dashboard</h1>
            <p className="text-muted-foreground">Track your progress and manage your advisory experience</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              {userProfile.role}
            </Badge>
            
            {userProfile.profile_completed && (
              <Badge className="bg-green-100 text-green-800">
                Profile Complete
              </Badge>
            )}

            {journeyFlow && (
              <Badge variant="secondary">
                {journeyFlow.healthScore}% Health Score
              </Badge>
            )}
          </div>
        </div>
      </StepTransition>

      {/* Next Action Alert */}
      {nextAction && (
        <StepTransition isActive={true} isCompleted={false} delay={200}>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    nextAction.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    <nextAction.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900">{nextAction.title}</h4>
                    <p className="text-blue-700 text-sm">{nextAction.description}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => handleQuickAction(nextAction.action)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Take Action
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </StepTransition>
      )}

      {/* Journey Status */}
      <StepTransition isActive={true} isCompleted={false} delay={400}>
        <EnhancedJourneyStatusCard />
      </StepTransition>

      {/* Real-time Dashboard */}
      <StepTransition isActive={true} isCompleted={false} delay={600}>
        <div>
          <h2 className="text-xl font-semibold mb-4">Dashboard Metrics</h2>
          <RealTimeDashboard />
        </div>
      </StepTransition>

      {/* Quick Actions */}
      <StepTransition isActive={true} isCompleted={false} delay={800}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  action: 'profile',
                  icon: UserCheck,
                  title: 'Update Profile',
                  description: 'Keep your information current'
                },
                {
                  action: 'session',
                  icon: Calendar,
                  title: 'Schedule Session',
                  description: 'Book your next advisory meeting'
                },
                {
                  action: 'notifications',
                  icon: Bell,
                  title: 'Notifications',
                  description: 'Manage your preferences'
                }
              ].map((item, index) => (
                <StepTransition
                  key={item.action}
                  isActive={false}
                  isCompleted={false}
                  delay={1000 + (index * 100)}
                >
                  <button
                    onClick={() => handleQuickAction(item.action)}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer text-left w-full"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon className="w-4 h-4" />
                      <h4 className="font-medium">{item.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </button>
                </StepTransition>
              ))}
            </div>
          </CardContent>
        </Card>
      </StepTransition>

      {/* Journey Health Insights */}
      {journeyFlow && journeyFlow.healthScore < 80 && (
        <StepTransition isActive={true} isCompleted={false} delay={1400}>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="w-5 h-5" />
                Journey Health Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-yellow-700">Health Score</span>
                  <div className="flex items-center gap-2">
                    <Progress value={journeyFlow.healthScore} className="w-24" />
                    <span className="text-yellow-800 font-medium">{journeyFlow.healthScore}%</span>
                  </div>
                </div>
                
                {journeyFlow.healthScore < 60 && (
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      <strong>Recommendation:</strong> Your journey health could be improved. 
                      Consider completing pending steps or reaching out for support.
                    </p>
                  </div>
                )}
                
                {journeyFlow.estimatedCompletion && (
                  <p className="text-yellow-700 text-sm">
                    Estimated completion: {journeyFlow.estimatedCompletion}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </StepTransition>
      )}
    </div>
  );
};
