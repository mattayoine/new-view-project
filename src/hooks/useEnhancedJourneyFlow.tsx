
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRealTimeJourneyUpdates } from './useRealTimeJourneyUpdates';
import { useRetryWithBackoff } from './useRetryWithBackoff';
import { useOfflineSupport } from './useOfflineSupport';
import { toast } from 'sonner';

export interface EnhancedJourneyStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  progress: number;
  data?: any;
  completedAt?: string;
  blockedReason?: string;
  canProceed: boolean;
  nextAction?: string;
}

export interface EnhancedJourneyFlow {
  currentStep: string;
  overallProgress: number;
  steps: EnhancedJourneyStep[];
  canProceedToNext: boolean;
  nextStepAction?: string;
  healthScore: number;
  estimatedCompletion?: string;
}

export const useEnhancedJourneyFlow = () => {
  const { user, userProfile } = useAuth();
  const { executeWithRetry } = useRetryWithBackoff();
  const { executeOperation } = useOfflineSupport();
  const queryClient = useQueryClient();

  // Enable real-time updates
  useRealTimeJourneyUpdates();

  const fetchJourneyFlow = async (): Promise<EnhancedJourneyFlow> => {
    if (!user) {
      return {
        currentStep: 'authentication',
        overallProgress: 0,
        steps: [],
        canProceedToNext: false,
        healthScore: 0
      };
    }

    const steps: EnhancedJourneyStep[] = [];
    let overallProgress = 0;
    let healthScore = 100;
    let currentStep = 'authentication';

    // Step 1: Authentication (20% of journey)
    steps.push({
      id: 'authentication',
      name: 'Account Creation',
      status: 'completed',
      progress: 100,
      completedAt: user.created_at,
      canProceed: true
    });
    overallProgress += 20;

    // Step 2: Application Submission (20% of journey)
    const { data: application } = await supabase
      .from('base_applications')
      .select('*')
      .eq('email', user.email)
      .maybeSingle();

    const applicationStep: EnhancedJourneyStep = {
      id: 'application',
      name: 'Application Submission',
      status: application ? 'completed' : 'pending',
      progress: application ? 100 : 0,
      data: application,
      completedAt: application?.created_at,
      canProceed: !!application,
      nextAction: application ? undefined : 'Submit your application to continue'
    };
    steps.push(applicationStep);

    if (!application) {
      currentStep = 'application';
      healthScore -= 20;
    } else {
      overallProgress += 20;
    }

    // Step 3: Application Approval (20% of journey)
    if (application) {
      const approvalStep: EnhancedJourneyStep = {
        id: 'approval',
        name: 'Application Review',
        status: application.status === 'approved' ? 'completed' : 
                application.status === 'rejected' ? 'blocked' : 'in_progress',
        progress: application.status === 'approved' ? 100 : 
                  application.status === 'rejected' ? 0 : 50,
        data: { status: application.status, reviewedAt: application.reviewed_at },
        completedAt: application.status === 'approved' ? application.reviewed_at : undefined,
        blockedReason: application.rejection_reason,
        canProceed: application.status === 'approved',
        nextAction: application.status === 'rejected' ? 'Contact support to resubmit' :
                   application.status === 'pending' ? 'Waiting for admin review' : undefined
      };
      steps.push(approvalStep);

      if (application.status === 'approved') {
        overallProgress += 20;
      } else if (application.status === 'rejected') {
        currentStep = 'approval';
        healthScore -= 40;
      } else {
        currentStep = 'approval';
        overallProgress += 10; // Partial progress for pending
        healthScore -= 10;
      }
    }

    // Step 4: Profile Setup (20% of journey)
    if (application?.status === 'approved') {
      const profileStep: EnhancedJourneyStep = {
        id: 'profile',
        name: 'Profile Setup',
        status: userProfile?.profile_completed ? 'completed' : 'pending',
        progress: userProfile?.profile_completed ? 100 : 0,
        data: userProfile,
        completedAt: userProfile?.updated_at,
        canProceed: !!userProfile?.profile_completed,
        nextAction: userProfile?.profile_completed ? undefined : 'Complete your profile setup'
      };
      steps.push(profileStep);

      if (userProfile?.profile_completed) {
        overallProgress += 20;
      } else {
        currentStep = 'profile';
        healthScore -= 15;
      }
    }

    // Step 5: Assignment (20% of journey)
    if (userProfile?.profile_completed && userProfile.role !== 'admin') {
      const { data: assignment } = await supabase
        .from('advisor_founder_assignments')
        .select('*')
        .or(`advisor_id.eq.${userProfile.id},founder_id.eq.${userProfile.id}`)
        .eq('status', 'active')
        .maybeSingle();

      const assignmentStep: EnhancedJourneyStep = {
        id: 'assignment',
        name: 'Advisor-Founder Matching',
        status: assignment ? 'completed' : 'pending',
        progress: assignment ? 100 : 0,
        data: assignment,
        completedAt: assignment?.assigned_at,
        canProceed: !!assignment,
        nextAction: assignment ? undefined : 'Waiting for admin assignment'
      };
      steps.push(assignmentStep);

      if (assignment) {
        overallProgress += 20;
        
        // Estimate completion time based on assignment date
        if (assignment.assigned_at) {
          const assignedDate = new Date(assignment.assigned_at);
          const estimatedDate = new Date(assignedDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
          assignmentStep.nextAction = `First session expected by ${estimatedDate.toLocaleDateString()}`;
        }
      } else {
        currentStep = 'assignment';
        healthScore -= 10;
      }
    } else if (userProfile?.role === 'admin') {
      // Admin users skip assignment step
      overallProgress += 20;
      currentStep = 'admin_active';
    }

    // Calculate health score based on time since last activity
    const daysSinceLastActivity = userProfile?.updated_at ? 
      Math.floor((Date.now() - new Date(userProfile.updated_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    if (daysSinceLastActivity > 7) {
      healthScore -= Math.min(20, daysSinceLastActivity - 7);
    }

    return {
      currentStep,
      overallProgress: Math.round(overallProgress),
      steps,
      canProceedToNext: steps[steps.length - 1]?.canProceed || false,
      nextStepAction: steps.find(s => s.status === 'pending')?.nextAction,
      healthScore: Math.max(0, Math.round(healthScore)),
      estimatedCompletion: overallProgress < 100 ? 
        new Date(Date.now() + ((100 - overallProgress) / 20) * 7 * 24 * 60 * 60 * 1000).toLocaleDateString() : 
        undefined
    };
  };

  const queryResult = useQuery({
    queryKey: ['enhanced-journey-flow', user?.id],
    queryFn: () => executeWithRetry(fetchJourneyFlow, {
      maxRetries: 3,
      onRetry: (attempt) => console.log(`Retrying journey flow fetch (attempt ${attempt})`),
    }),
    enabled: !!user,
    refetchInterval: 30000, // 30 seconds
    staleTime: 15000, // 15 seconds
    refetchOnWindowFocus: true
  });

  const completeStep = useMutation({
    mutationFn: async ({ stepId, data }: { stepId: string; data?: any }) => {
      return executeOperation(async () => {
        console.log(`Completing journey step: ${stepId}`, data);
        
        switch (stepId) {
          case 'application':
            return { action: 'navigate', path: '/apply-founder' };
          case 'profile':
            return { action: 'navigate', path: '/onboarding' };
          case 'first_session':
            return { action: 'navigate', path: '/founder-session-hub' };
          default:
            return { action: 'none' };
        }
      }, `Complete ${stepId} step`);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-journey-flow'] });
      
      if (result?.action === 'navigate') {
        toast.success('Redirecting to next step...');
      }
    },
    onError: (error: any) => {
      toast.error(`Failed to proceed: ${error.message}`);
    }
  });

  return {
    ...queryResult,
    completeStep: completeStep.mutate,
    isCompletingStep: completeStep.isPending
  };
};
