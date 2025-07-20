import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface JourneyStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  data?: any;
  completedAt?: string;
  blockedReason?: string;
}

export interface UserJourneyFlow {
  currentStep: string;
  progress: number;
  steps: JourneyStep[];
  canProceedToNext: boolean;
  nextStepAction?: string;
}

export const useUserJourneyFlow = () => {
  const { user, userProfile } = useAuth();

  return useQuery({
    queryKey: ['user-journey-flow', user?.id],
    queryFn: async (): Promise<UserJourneyFlow> => {
      if (!user) {
        return {
          currentStep: 'authentication',
          progress: 0,
          steps: [],
          canProceedToNext: false
        };
      }

      const steps: JourneyStep[] = [];
      let currentStep = 'authentication';
      let canProceedToNext = false;

      // Step 1: Authentication
      steps.push({
        id: 'authentication',
        name: 'Account Creation',
        status: 'completed',
        completedAt: user.created_at
      });

      // Step 2: Application Submission
      const { data: application } = await supabase
        .from('base_applications')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      const applicationStep: JourneyStep = {
        id: 'application',
        name: 'Application Submission',
        status: application ? 'completed' : 'pending',
        data: application,
        completedAt: application?.created_at
      };
      steps.push(applicationStep);

      if (!application) {
        currentStep = 'application';
        return { currentStep, progress: 25, steps, canProceedToNext: false };
      }

      // Step 3: Application Approval
      const approvalStep: JourneyStep = {
        id: 'approval',
        name: 'Application Review',
        status: application.status === 'approved' ? 'completed' : 
                application.status === 'rejected' ? 'blocked' : 'pending',
        data: { status: application.status, reviewedAt: application.reviewed_at },
        completedAt: application.status === 'approved' ? application.reviewed_at : undefined,
        blockedReason: application.rejection_reason
      };
      steps.push(approvalStep);

      if (application.status !== 'approved') {
        currentStep = 'approval';
        return { 
          currentStep, 
          progress: 50, 
          steps, 
          canProceedToNext: false 
        };
      }

      // Step 4: Profile Setup - using consistent property name
      const profileStep: JourneyStep = {
        id: 'profile',
        name: 'Profile Setup',
        status: userProfile?.profile_completed ? 'completed' : 'pending',
        data: userProfile,
        completedAt: userProfile?.updated_at
      };
      steps.push(profileStep);

      if (!userProfile?.profile_completed) {
        currentStep = 'profile';
        return { currentStep, progress: 75, steps, canProceedToNext: false };
      }

      // Step 5: Assignment (for non-admin users)
      if (userProfile.role !== 'admin') {
        const { data: assignment } = await supabase
          .from('advisor_founder_assignments')
          .select('*')
          .or(`advisor_id.eq.${userProfile.id},founder_id.eq.${userProfile.id}`)
          .eq('status', 'active')
          .maybeSingle();

        const assignmentStep: JourneyStep = {
          id: 'assignment',
          name: 'Advisor-Founder Matching',
          status: assignment ? 'completed' : 'pending',
          data: assignment,
          completedAt: assignment?.assigned_at
        };
        steps.push(assignmentStep);

        if (!assignment) {
          currentStep = 'assignment';
          return { 
            currentStep, 
            progress: 90, 
            steps, 
            canProceedToNext: false,
            nextStepAction: 'Waiting for admin assignment'
          };
        }

        // Step 6: First Session
        const { data: sessions } = await supabase
          .from('sessions')
          .select('*')
          .eq('assignment_id', assignment.id)
          .order('scheduled_at', { ascending: true });

        const firstSessionStep: JourneyStep = {
          id: 'first_session',
          name: 'First Advisory Session',
          status: sessions?.some(s => s.status === 'completed') ? 'completed' : 'pending',
          data: { sessionCount: sessions?.length || 0, sessions },
          completedAt: sessions?.find(s => s.status === 'completed')?.updated_at
        };
        steps.push(firstSessionStep);

        if (!sessions?.some(s => s.status === 'completed')) {
          currentStep = 'first_session';
          return { 
            currentStep, 
            progress: 95, 
            steps, 
            canProceedToNext: true,
            nextStepAction: sessions?.length > 0 ? 'Attend scheduled session' : 'Schedule first session'
          };
        }

        currentStep = 'active_journey';
        canProceedToNext = true;
      } else {
        currentStep = 'admin_active';
        canProceedToNext = true;
      }

      return {
        currentStep,
        progress: 100,
        steps,
        canProceedToNext,
        nextStepAction: 'Continue with advisory journey'
      };
    },
    enabled: !!user,
    refetchInterval: 30000 // Refresh every 30 seconds
  });
};

// Enhanced version that leverages the new framework
export { useEnhancedJourneyFlow as useUserJourneyFlow } from './useEnhancedJourneyFlow';

export const useCompleteJourneyStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stepId, data }: { stepId: string; data?: any }) => {
      console.log(`Completing journey step: ${stepId}`, data);
      
      // This would trigger specific completion logic based on step
      switch (stepId) {
        case 'application':
          // Navigate to application form
          return { action: 'navigate', path: '/apply-founder' };
        case 'profile':
          // Navigate to profile completion
          return { action: 'navigate', path: '/onboarding' };
        case 'first_session':
          // Navigate to session scheduling
          return { action: 'navigate', path: '/founder-session-hub' };
        default:
          return { action: 'none' };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['user-journey-flow'] });
      
      if (result.action === 'navigate') {
        toast.success('Redirecting to next step...');
      }
    },
    onError: (error: any) => {
      toast.error(`Failed to proceed: ${error.message}`);
    }
  });
};
