
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSendApplicationNotification } from './useApplicationNotifications';
import { toast } from 'sonner';

export const useEnhancedApplicationActions = () => {
  const queryClient = useQueryClient();
  const sendNotification = useSendApplicationNotification();

  const approveApplication = useMutation({
    mutationFn: async ({ applicationId, reviewerId }: { applicationId: string, reviewerId: string }) => {
      // Get application details first
      const { data: application, error: fetchError } = await supabase
        .from('base_applications')
        .select(`
          *,
          founder_details:founder_application_details(*),
          advisor_details:advisor_application_details(*)
        `)
        .eq('id', applicationId)
        .single();

      if (fetchError || !application) {
        throw new Error('Application not found');
      }

      // Create user account in auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: application.email,
        password: Math.random().toString(36).slice(-8) + 'A1!', // Temporary password
        email_confirm: true,
        user_metadata: {
          name: application.name,
          role: application.type
        }
      });

      if (authError) {
        throw new Error(`Failed to create auth user: ${authError.message}`);
      }

      // Create user record in users table
      const { error: userError } = await supabase
        .from('users')
        .insert({
          auth_id: authUser.user.id,
          email: application.email,
          role: application.type,
          status: 'active',
          profile_completed: true
        });

      if (userError) {
        throw new Error(`Failed to create user record: ${userError.message}`);
      }

      // Get the created user ID
      const { data: newUser, error: getUserError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.user.id)
        .single();

      if (getUserError || !newUser) {
        throw new Error('Failed to retrieve created user');
      }

      // Create user profile
      const profileData = application.type === 'founder' 
        ? {
            name: application.name,
            location: application.location,
            startup_name: application.founder_details?.[0]?.startup_name,
            website: application.founder_details?.[0]?.website,
            sector: application.founder_details?.[0]?.sector,
            stage: application.founder_details?.[0]?.stage,
            challenge: application.founder_details?.[0]?.challenge,
            win_definition: application.founder_details?.[0]?.win_definition,
            video_link: application.founder_details?.[0]?.video_link
          }
        : {
            name: application.name,
            location: application.location,
            linkedin: application.advisor_details?.[0]?.linkedin,
            expertise: application.advisor_details?.[0]?.expertise,
            experience_level: application.advisor_details?.[0]?.experience_level,
            timezone: application.advisor_details?.[0]?.timezone,
            challenge_preference: application.advisor_details?.[0]?.challenge_preference
          };

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: newUser.id,
          profile_type: application.type,
          profile_data: profileData
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't throw here as the main user creation succeeded
      }

      // Update application status
      const { error: updateError } = await supabase
        .from('base_applications')
        .update({
          status: 'approved',
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (updateError) {
        throw new Error(`Failed to update application: ${updateError.message}`);
      }

      // Send welcome notification
      await sendNotification.mutateAsync({
        applicationId,
        status: 'approved'
      });

      return { userId: newUser.id, authUserId: authUser.user.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      queryClient.invalidateQueries({ queryKey: ['pending-applications-count'] });
      toast.success('Application approved! User account created and welcome email sent.');
    },
    onError: (error) => {
      console.error('Error approving application:', error);
      toast.error(`Failed to approve application: ${error.message}`);
    }
  });

  const rejectApplication = useMutation({
    mutationFn: async ({ 
      applicationId, 
      reviewerId, 
      reason 
    }: { 
      applicationId: string, 
      reviewerId: string, 
      reason: string 
    }) => {
      const { error } = await supabase
        .from('base_applications')
        .update({
          status: 'rejected',
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Send rejection notification
      await sendNotification.mutateAsync({
        applicationId,
        status: 'rejected',
        rejectionReason: reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      queryClient.invalidateQueries({ queryKey: ['pending-applications-count'] });
      toast.success('Application rejected and notification sent.');
    },
    onError: (error) => {
      console.error('Error rejecting application:', error);
      toast.error('Failed to reject application');
    }
  });

  return { approveApplication, rejectApplication };
};
