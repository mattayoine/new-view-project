
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSendApplicationNotification } from './useApplicationNotifications';
import { toast } from 'sonner';

export const useEnhancedApplicationActions = () => {
  const queryClient = useQueryClient();
  const sendNotification = useSendApplicationNotification();

  const approveApplication = useMutation({
    mutationFn: async ({ applicationId, reviewerId }: { applicationId: string, reviewerId: string }) => {
      console.log('Starting application approval process for:', applicationId);
      
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
        console.error('Failed to fetch application:', fetchError);
        throw new Error('Application not found');
      }

      console.log('Application fetched:', application.email, application.type);

      // Generate a secure random password
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
      
      // Create user account in auth using admin API
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: application.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: application.name,
          role: application.type,
          approved_by: reviewerId
        }
      });

      if (authError) {
        console.error('Auth user creation failed:', authError);
        throw new Error(`Failed to create auth user: ${authError.message}`);
      }

      console.log('Auth user created:', authUser.user.id);

      // Create user record in users table
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          auth_id: authUser.user.id,
          email: application.email,
          role: application.type,
          status: 'active',
          profile_completed: true
        })
        .select()
        .single();

      if (userError) {
        console.error('User record creation failed:', userError);
        // Try to cleanup auth user
        try {
          await supabase.auth.admin.deleteUser(authUser.user.id);
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user:', cleanupError);
        }
        throw new Error(`Failed to create user record: ${userError.message}`);
      }

      console.log('User record created:', newUser.id);

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
        console.error('Application update failed:', updateError);
        throw new Error(`Failed to update application: ${updateError.message}`);
      }

      console.log('Application approved successfully');

      // Send welcome notification
      try {
        await sendNotification.mutateAsync({
          applicationId,
          status: 'approved'
        });
        console.log('Welcome notification sent');
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
        // Don't throw here as the main approval succeeded
      }

      return { 
        userId: newUser.id, 
        authUserId: authUser.user.id,
        tempPassword 
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      queryClient.invalidateQueries({ queryKey: ['pending-applications-count'] });
      toast.success(`Application approved! User account created. Temporary password: ${data.tempPassword}`);
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
