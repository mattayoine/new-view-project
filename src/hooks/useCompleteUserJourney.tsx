
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { FounderProfileData, AdvisorProfileData } from '@/types/profile';

export interface UserJourneyStep {
  step: string;
  completed: boolean;
  data?: any;
  error?: string;
}

export interface UserJourneyStatus {
  currentStep: string;
  steps: UserJourneyStep[];
  canProceed: boolean;
  nextAction: string;
}

export const useUserJourneyStatus = () => {
  const { user, userProfile } = useAuth();

  return useQuery({
    queryKey: ['user-journey-status', user?.id],
    queryFn: async (): Promise<UserJourneyStatus> => {
      if (!user) {
        return {
          currentStep: 'not_authenticated',
          steps: [],
          canProceed: false,
          nextAction: 'Please log in or create an account'
        };
      }

      const steps: UserJourneyStep[] = [];
      let currentStep = 'authenticated';
      let canProceed = true;
      let nextAction = '';

      // Step 1: Authentication
      steps.push({
        step: 'authentication',
        completed: !!user,
        data: { email: user.email }
      });

      // Step 2: Application Submission
      const { data: application } = await supabase
        .from('base_applications')
        .select('*')
        .eq('email', user.email)
        .single();

      const applicationCompleted = !!application;
      steps.push({
        step: 'application',
        completed: applicationCompleted,
        data: application
      });

      if (!applicationCompleted) {
        currentStep = 'application';
        nextAction = 'Complete your application';
        canProceed = false;
      }

      // Step 3: Application Approval
      const approvalCompleted = application?.status === 'approved';
      steps.push({
        step: 'approval',
        completed: approvalCompleted,
        data: { status: application?.status }
      });

      if (applicationCompleted && !approvalCompleted) {
        currentStep = 'approval';
        nextAction = application?.status === 'rejected' 
          ? 'Your application was rejected. Please contact support.'
          : 'Waiting for admin approval';
        canProceed = false;
      }

      // Step 4: User Profile Creation
      const profileCompleted = !!userProfile && userProfile.status === 'active';
      steps.push({
        step: 'profile',
        completed: profileCompleted,
        data: userProfile
      });

      if (approvalCompleted && !profileCompleted) {
        currentStep = 'profile';
        nextAction = 'Complete your profile setup';
        canProceed = false;
      }

      // Step 5: Assignment (for non-admin users)
      if (userProfile?.role !== 'admin') {
        const { data: assignment } = await supabase
          .from('advisor_founder_assignments')
          .select('*')
          .or(`advisor_id.eq.${userProfile?.id},founder_id.eq.${userProfile?.id}`)
          .eq('status', 'active')
          .single();

        const assignmentCompleted = !!assignment;
        steps.push({
          step: 'assignment',
          completed: assignmentCompleted,
          data: assignment
        });

        if (profileCompleted && !assignmentCompleted) {
          currentStep = 'assignment';
          nextAction = 'Waiting for advisor/founder assignment';
          canProceed = false;
        }

        // Step 6: First Session
        if (assignmentCompleted) {
          const { data: sessions } = await supabase
            .from('sessions')
            .select('*')
            .eq('assignment_id', assignment.id)
            .order('scheduled_at', { ascending: true });

          const firstSessionCompleted = sessions?.some(s => s.status === 'completed');
          steps.push({
            step: 'first_session',
            completed: firstSessionCompleted,
            data: { sessionCount: sessions?.length || 0 }
          });

          if (!firstSessionCompleted) {
            currentStep = 'first_session';
            nextAction = sessions?.length > 0 
              ? 'Attend your scheduled session'
              : 'Schedule your first session';
          } else {
            currentStep = 'active_program';
            nextAction = 'Continue with your advisory program';
          }
        }
      } else {
        // Admin user journey
        currentStep = 'admin_active';
        nextAction = 'Manage the platform';
      }

      return {
        currentStep,
        steps,
        canProceed,
        nextAction
      };
    },
    enabled: !!user,
    refetchInterval: 30000 // Check every 30 seconds
  });
};

export const useCompleteApplicationApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationId, action, reason }: {
      applicationId: string;
      action: 'approve' | 'reject';
      reason?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: adminUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!adminUser) throw new Error('Admin user not found');

      if (action === 'approve') {
        // Use the approve-application edge function
        const { data, error } = await supabase.functions.invoke('approve-application', {
          body: {
            applicationId,
            reviewerId: adminUser.id
          }
        });

        if (error) throw error;
        return data;
      } else {
        // Reject application
        const { error } = await supabase
          .from('base_applications')
          .update({
            status: 'rejected',
            rejection_reason: reason,
            reviewed_by: adminUser.id,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', applicationId);

        if (error) throw error;
        return { success: true };
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-journey-status'] });
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      
      if (variables.action === 'approve') {
        toast.success(`Application approved! User account created.`);
      } else {
        toast.success('Application rejected');
      }
    },
    onError: (error: any) => {
      toast.error(`Failed to ${error.action} application: ${error.message}`);
    }
  });
};

export const useCreateAssignmentFromApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ founderId, advisorId, notes }: {
      founderId: string;
      advisorId: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: adminUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!adminUser) throw new Error('Admin user not found');

      // Calculate match score using the algorithm
      const { calculateMatchScore } = await import('@/utils/matchingAlgorithm');
      
      // Get founder and advisor profiles for matching
      const { data: founderProfile } = await supabase
        .from('user_profiles')
        .select('profile_data')
        .eq('user_id', founderId)
        .eq('profile_type', 'founder')
        .single();

      const { data: advisorProfile } = await supabase
        .from('user_profiles')
        .select('profile_data')
        .eq('user_id', advisorId)
        .eq('profile_type', 'advisor')
        .single();

      let matchScore = 0;
      if (founderProfile && advisorProfile) {
        // Safely type cast the Json data to the expected types
        const founderData = founderProfile.profile_data as unknown as FounderProfileData;
        const advisorData = advisorProfile.profile_data as unknown as AdvisorProfileData;
        
        const score = calculateMatchScore(founderData, advisorData);
        matchScore = score.overall;
      }

      // Create assignment
      const { data: assignment, error } = await supabase
        .from('advisor_founder_assignments')
        .insert({
          founder_id: founderId,
          advisor_id: advisorId,
          match_score: matchScore,
          assigned_by: adminUser.id,
          notes: notes || `Manual assignment with ${matchScore}% match score`,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Send notifications to both parties
      await Promise.all([
        supabase.from('notifications').insert({
          user_id: founderId,
          type: 'assignment',
          title: 'Advisor Assigned',
          message: 'You have been matched with an advisor. Check your dashboard to get started!',
          priority: 'high'
        }),
        supabase.from('notifications').insert({
          user_id: advisorId,
          type: 'assignment',
          title: 'Founder Assigned',
          message: 'You have been matched with a founder. Check your dashboard to get started!',
          priority: 'high'
        })
      ]);

      return assignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-journey-status'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Assignment created successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to create assignment: ${error.message}`);
    }
  });
};

export const useValidateUserJourney = () => {
  return useMutation({
    mutationFn: async (userId: string) => {
      // Comprehensive validation of user journey data integrity
      const validationResults = [];

      // Check user record
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        validationResults.push({
          step: 'user_record',
          valid: false,
          error: 'User record not found'
        });
        return validationResults;
      }

      validationResults.push({
        step: 'user_record',
        valid: true,
        data: user
      });

      // Check application record
      const { data: application } = await supabase
        .from('base_applications')
        .select('*')
        .eq('email', user.email)
        .single();

      validationResults.push({
        step: 'application',
        valid: !!application,
        data: application
      });

      // Check profile record
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      validationResults.push({
        step: 'profile',
        valid: !!profile,
        data: profile
      });

      // Check assignments (if not admin)
      if (user.role !== 'admin') {
        const { data: assignments } = await supabase
          .from('advisor_founder_assignments')
          .select('*')
          .or(`advisor_id.eq.${userId},founder_id.eq.${userId}`);

        validationResults.push({
          step: 'assignments',
          valid: true,
          data: { count: assignments?.length || 0, assignments }
        });
      }

      return validationResults;
    }
  });
};
