
import { useMutation } from '@tanstack/react-query';
import { anonymousSupabase } from '@/integrations/supabase/anonymousClient';
import { toast } from 'sonner';

interface FounderApplicationData {
  name: string;
  email: string;
  location: string;
  startup_name: string;
  website?: string;
  sector: string;
  stage: string;
  challenge: string;
  win_definition: string;
  video_link?: string;
  case_study_consent: boolean;
}

interface AdvisorApplicationData {
  name: string;
  email: string;
  location: string;
  linkedin: string;
  expertise: string[];
  experience_level: string;
  timezone: string;
  challenge_preference: string;
  public_profile_consent: boolean;
}

export const useFounderApplicationSubmission = () => {
  return useMutation({
    mutationFn: async (data: FounderApplicationData) => {
      console.log('Submitting founder application:', data);
      
      try {
        // Create base application record using anonymous client
        const { data: baseApp, error: baseError } = await anonymousSupabase
          .from('base_applications')
          .insert({
            name: data.name,
            email: data.email,
            location: data.location,
            type: 'founder',
            status: 'pending'
          })
          .select()
          .single();

        if (baseError) {
          console.error('Base application error:', baseError);
          console.error('Base application error details:', {
            code: baseError.code,
            message: baseError.message,
            details: baseError.details,
            hint: baseError.hint
          });
          throw new Error(`Failed to create application: ${baseError.message}`);
        }

        if (!baseApp) {
          throw new Error('No application data returned');
        }

        console.log('Base application created successfully:', baseApp);

        // Create founder-specific details using anonymous client
        const { error: detailError } = await anonymousSupabase
          .from('founder_application_details')
          .insert({
            application_id: baseApp.id,
            startup_name: data.startup_name,
            website: data.website,
            sector: data.sector,
            stage: data.stage,
            challenge: data.challenge,
            win_definition: data.win_definition,
            video_link: data.video_link,
            case_study_consent: data.case_study_consent
          });

        if (detailError) {
          console.error('Founder details error:', detailError);
          console.error('Founder details error details:', {
            code: detailError.code,
            message: detailError.message,
            details: detailError.details,
            hint: detailError.hint
          });
          throw new Error(`Failed to save application details: ${detailError.message}`);
        }

        console.log('Founder application details created successfully');
        return baseApp;
        
      } catch (error) {
        console.error('Application submission failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Founder application submitted successfully');
      toast.success('Application submitted successfully! We\'ll review it and get back to you soon.');
    },
    onError: (error: any) => {
      console.error('Application submission error:', error);
      toast.error(`Failed to submit application: ${error.message}`);
    }
  });
};

export const useAdvisorApplicationSubmission = () => {
  return useMutation({
    mutationFn: async (data: AdvisorApplicationData) => {
      console.log('Submitting advisor application:', data);
      
      try {
        // Create base application record using anonymous client
        const { data: baseApp, error: baseError } = await anonymousSupabase
          .from('base_applications')
          .insert({
            name: data.name,
            email: data.email,
            location: data.location,
            type: 'advisor',
            status: 'pending'
          })
          .select()
          .single();

        if (baseError) {
          console.error('Base application error:', baseError);
          console.error('Base application error details:', {
            code: baseError.code,
            message: baseError.message,
            details: baseError.details,
            hint: baseError.hint
          });
          throw new Error(`Failed to create application: ${baseError.message}`);
        }

        if (!baseApp) {
          throw new Error('No application data returned');
        }

        console.log('Base application created successfully:', baseApp);

        // Create advisor-specific details using anonymous client
        const { error: detailError } = await anonymousSupabase
          .from('advisor_application_details')
          .insert({
            application_id: baseApp.id,
            linkedin: data.linkedin,
            expertise: data.expertise,
            experience_level: data.experience_level,
            timezone: data.timezone,
            challenge_preference: data.challenge_preference,
            public_profile_consent: data.public_profile_consent
          });

        if (detailError) {
          console.error('Advisor details error:', detailError);
          console.error('Advisor details error details:', {
            code: detailError.code,
            message: detailError.message,
            details: detailError.details,
            hint: detailError.hint
          });
          throw new Error(`Failed to save application details: ${detailError.message}`);
        }

        console.log('Advisor application details created successfully');
        return baseApp;
        
      } catch (error) {
        console.error('Application submission failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Advisor application submitted successfully');
      toast.success('Application submitted successfully! We\'ll review it and get back to you soon.');
    },
    onError: (error: any) => {
      console.error('Application submission error:', error);
      toast.error(`Failed to submit application: ${error.message}`);
    }
  });
};
