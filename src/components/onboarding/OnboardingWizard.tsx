import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export const OnboardingWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [steps, setSteps] = useState<OnboardingStep[]>([
    { id: 'profile', title: 'Complete Profile', description: 'Basic information and role setup', completed: false },
    { id: 'verification', title: 'Email Verification', description: 'Verify your email address', completed: false },
    { id: 'application', title: 'Submit Application', description: 'Complete your application form', completed: false },
    { id: 'approval', title: 'Wait for Approval', description: 'Admin review and approval', completed: false },
    { id: 'setup', title: 'Account Setup', description: 'Preferences and notification settings', completed: false }
  ]);

  useEffect(() => {
    if (user) {
      checkOnboardingStatus();
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    try {
      // Check user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_id', user?.id)
        .single();

      setUserProfile(profile);

      // Update step completion status
      const updatedSteps = [...steps];
      
      // Profile completed if user_profiles record exists
      updatedSteps[0].completed = !!profile;
      
      // Email verification from auth
      updatedSteps[1].completed = !!user?.email_confirmed_at;
      
      // Application completed if role-specific profile exists
      if (profile) {
        const roleTable = profile.profile_type === 'founder' ? 'founder_profiles' : 'advisor_profiles';
        const { data: roleProfile } = await supabase
          .from(roleTable)
          .select('id')
          .eq('user_id', profile.id)
          .single();
        
        updatedSteps[2].completed = !!roleProfile;
      }

      // Check approval status from users table
      const { data: userData } = await supabase
        .from('users')
        .select('status')
        .eq('auth_id', user?.id)
        .single();
      
      updatedSteps[3].completed = userData?.status === 'active';
      
      // Setup completed if user_settings exists
      const { data: settings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', profile?.user_id)
        .single();
      
      updatedSteps[4].completed = !!settings;

      setSteps(updatedSteps);

      // Find current step
      const nextIncompleteStep = updatedSteps.findIndex(step => !step.completed);
      setCurrentStep(nextIncompleteStep >= 0 ? nextIncompleteStep : updatedSteps.length - 1);

    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleStepComplete = async (stepId: string) => {
    setLoading(true);
    try {
      switch (stepId) {
        case 'profile':
          // Navigate to profile creation
          navigate('/onboarding/profile');
          break;
        case 'verification':
          // Resend verification email
          await supabase.auth.resend({ type: 'signup', email: user?.email! });
          toast({
            title: 'Verification Email Sent',
            description: 'Please check your email and click the verification link.'
          });
          break;
        case 'application':
          // Navigate to application form
          navigate(userProfile?.profile_type === 'founder' ? '/apply-tseer' : '/apply-sme');
          break;
        case 'setup':
          // Navigate to settings
          navigate('/settings');
          break;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = (steps.filter(s => s.completed).length / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Tseer!</h1>
          <p className="text-gray-600">Let's get your account set up step by step</p>
          <div className="mt-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-500 mt-2">{Math.round(progress)}% Complete</p>
          </div>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <Card 
              key={step.id} 
              className={`${
                step.completed ? 'border-green-200 bg-green-50' : 
                index === currentStep ? 'border-blue-200 bg-blue-50' : 
                'border-gray-200'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step.completed ? 'bg-green-500' : 
                      index === currentStep ? 'bg-blue-500' : 
                      'bg-gray-300'
                    }`}>
                      {step.completed ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <span className="text-white font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{step.title}</h3>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {step.completed ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Completed
                      </Badge>
                    ) : index === currentStep ? (
                      <Button 
                        onClick={() => handleStepComplete(step.id)}
                        disabled={loading}
                        size="sm"
                      >
                        {loading ? 'Processing...' : 'Continue'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Badge variant="secondary">
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {progress === 100 && (
          <Card className="mt-8 border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Onboarding Complete!</h3>
              <p className="text-gray-600 mb-4">You're all set up and ready to use Tseer.</p>
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};