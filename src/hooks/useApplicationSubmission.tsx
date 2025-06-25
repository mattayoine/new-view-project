
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
      
      // Create base application record
      const { data: baseApp, error: baseError } = await supabase
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
        throw baseError;
      }

      console.log('Base application created:', baseApp);

      // Create founder-specific details
      const { error: detailError } = await supabase
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
        throw detailError;
      }

      console.log('Founder application details created successfully');
      return baseApp;
    },
    onSuccess: () => {
      console.log('Founder application submitted successfully');
      toast.success('Application submitted successfully! We\'ll review it and get back to you soon.');
    },
    onError: (error) => {
      console.error('Application submission error:', error);
      toast.error('Failed to submit application. Please try again.');
    }
  });
};

export const useAdvisorApplicationSubmission = () => {
  return useMutation({
    mutationFn: async (data: AdvisorApplicationData) => {
      console.log('Submitting advisor application:', data);
      
      // Create base application record
      const { data: baseApp, error: baseError } = await supabase
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
        throw baseError;
      }

      console.log('Base application created:', baseApp);

      // Create advisor-specific details
      const { error: detailError } = await supabase
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
        throw detailError;
      }

      console.log('Advisor application details created successfully');
      return baseApp;
    },
    onSuccess: () => {
      console.log('Advisor application submitted successfully');
      toast.success('Application submitted successfully! We\'ll review it and get back to you soon.');
    },
    onError: (error) => {
      console.error('Application submission error:', error);
      toast.error('Failed to submit application. Please try again.');
    }
  });
};
